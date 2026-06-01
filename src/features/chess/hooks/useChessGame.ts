'use client';

import { Square } from 'chess.js';
import { useCallback, useLayoutEffect, useMemo, useReducer, useRef, useState } from 'react';
import { EngineMode } from '@/components/AISettings';
import { OpeningKey } from '@/components/NewGameModal';
import {
  coordToSquareLoc,
  createChessFromFen,
  files,
  generateAllMoves,
  initialFen,
  openingMap,
  rcToSq,
} from '@/utils/chessLogic';
import {
  buildGameStateFromUciMoves,
  buildInitialTimelineState,
  buildTimelineStateFromCurrent,
  commitGameStateToTimeline,
  commitMoveToGameState,
  projectHistorySnapshots,
  redoGameTimeline,
  undoGameTimeline,
} from '../domain/gameState';
import { annotateLastMoveCpLoss } from '../domain/moveHistory';
import { useEngineAnalysis } from './useEngineAnalysis';
import { useHintSystem } from './useHintSystem';
import { GameState, GameTimelineState, HistorySnapshot, PlayerColor } from '../types/chess';

interface UseChessGameResult {
  gameState: GameState;
  historySnapshots: HistorySnapshot[];
  playerColor: PlayerColor;
  aiDepth: number;
  engineMode: EngineMode;
  engineStatus: string;
  evalScore: number;
  mateIn: number | null;
  progressActive: boolean;
  progressValue: number;
  hintMoves: ReturnType<typeof useHintSystem>['hintMoves'];
  hintError: string | null;
  isHintLoading: boolean;
  showNewGameModal: boolean;
  canUndo: boolean;
  canRedo: boolean;
  possibleMoveCount: number;
  setAiDepth: (depth: number) => void;
  setEngineMode: (mode: EngineMode) => void;
  setShowNewGameModal: (show: boolean) => void;
  executeMove: (
    startRow: number,
    startCol: number,
    endRow: number,
    endCol: number,
    promotionOverride?: string
  ) => void;
  undoMove: () => void;
  redoMove: () => void;
  requestHint: () => void;
  handleNewGame: (colorOverride?: PlayerColor, openingKey?: OpeningKey) => void;
  letterCoords: string[];
  numberCoords: number[];
}

type TimelineAction =
  | { type: 'replaceTimeline'; timeline: GameTimelineState }
  | { type: 'commit'; nextState: GameState }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'annotateLastMove'; cpLoss: number };

function timelineReducer(state: GameTimelineState, action: TimelineAction): GameTimelineState {
  switch (action.type) {
    case 'replaceTimeline':
      return action.timeline;
    case 'commit':
      return commitGameStateToTimeline(state, action.nextState);
    case 'undo':
      return undoGameTimeline(state);
    case 'redo':
      return redoGameTimeline(state);
    case 'annotateLastMove': {
      const nextMoveHistory = annotateLastMoveCpLoss(state.current.moveHistory, action.cpLoss);
      if (nextMoveHistory === state.current.moveHistory) {
        return state;
      }

      return {
        ...state,
        current: {
          ...state.current,
          moveHistory: nextMoveHistory,
        },
      };
    }
    default:
      return state;
  }
}

export function useChessGame(): UseChessGameResult {
  const [timelineState, dispatchTimeline] = useReducer(
    timelineReducer,
    undefined,
    buildInitialTimelineState
  );
  const [aiDepth, setAiDepth] = useState(25);
  const [engineMode, setEngineModeState] = useState<EngineMode>('Fast');
  const [playerColor, setPlayerColor] = useState<PlayerColor>('w');
  const [showNewGameModal, setShowNewGameModal] = useState(false);

  const gameState = timelineState.current;
  const historySnapshots = useMemo(() => projectHistorySnapshots(timelineState), [timelineState]);
  const canUndo = timelineState.history.length > 0;
  const canRedo = timelineState.future.length > 0;
  const possibleMoveCount = useMemo(() => {
    if (gameState.result) {
      return 0;
    }

    return generateAllMoves(gameState.fen).length;
  }, [gameState.fen, gameState.result]);

  const gameRef = useRef(createChessFromFen(initialFen));
  const gameStateRef = useRef(gameState);
  const timelineStateRef = useRef(timelineState);
  const playerColorRef = useRef(playerColor);
  const executeMoveRef = useRef<UseChessGameResult['executeMove']>(() => undefined);

  const setEngineMode = useCallback((mode: EngineMode) => {
    setEngineModeState(mode);
    if (mode === 'Instant') {
      setAiDepth(8);
    } else if (mode === 'Fast') {
      setAiDepth(12);
    } else if (mode === 'Strong') {
      setAiDepth(18);
    }
  }, []);

  const handleLastMoveEvaluated = useCallback((cpLoss: number) => {
    dispatchTimeline({ type: 'annotateLastMove', cpLoss });
  }, []);

  const handleEngineMove = useCallback((uciMove: string) => {
    const fromLoc = coordToSquareLoc(uciMove.slice(0, 2));
    const toLoc = coordToSquareLoc(uciMove.slice(2, 4));
    const promotion = uciMove.length > 4 ? uciMove[4] : undefined;
    executeMoveRef.current(fromLoc.row, fromLoc.col, toLoc.row, toLoc.col, promotion);
  }, []);

  const engineAnalysis = useEngineAnalysis({
    aiDepth,
    engineMode,
    gameStateRef,
    playerColorRef,
    onEngineMove: handleEngineMove,
    onLastMoveEvaluated: handleLastMoveEvaluated,
  });

  const hintSystem = useHintSystem({
    gameStateRef,
    playerColorRef,
  });

  const queueAnalysisForGameState = useCallback(
    (nextGameState: GameState) => {
      if (nextGameState.result) {
        engineAnalysis.setTerminalStatus(nextGameState.result);
        return;
      }

      if (nextGameState.turn !== playerColorRef.current) {
        engineAnalysis.queueAiMove(nextGameState.fen);
        return;
      }

      engineAnalysis.queueLightAnalysis(nextGameState.fen);
    },
    [engineAnalysis]
  );

  const restoreTimelinePosition = useCallback(
    (nextTimeline: GameTimelineState) => {
      const nextGameState = nextTimeline.current;

      gameRef.current = createChessFromFen(nextGameState.fen);
      timelineStateRef.current = nextTimeline;
      gameStateRef.current = nextGameState;

      dispatchTimeline({ type: 'replaceTimeline', timeline: nextTimeline });

      hintSystem.resetHintState();
      engineAnalysis.prepareForPositionChange();
      queueAnalysisForGameState(nextGameState);
    },
    [engineAnalysis, hintSystem, queueAnalysisForGameState]
  );

  const executeMove = useCallback<UseChessGameResult['executeMove']>(
    (startRow, startCol, endRow, endCol, promotionOverride) => {
      const chess = gameRef.current;
      const fromSquare = rcToSq(startRow, startCol);
      const sourcePiece = chess.get(fromSquare as Square);

      if (!sourcePiece) {
        return;
      }

      const promotion =
        promotionOverride ??
        (sourcePiece.type === 'p' && (endRow === 0 || endRow === 7) ? 'q' : undefined);
      const moveResult = commitMoveToGameState({
        chess,
        previousState: gameStateRef.current,
        startRow,
        startCol,
        endRow,
        endCol,
        promotion,
      });

      if (!moveResult) {
        return;
      }

      engineAnalysis.capturePreMoveEvaluation();
      hintSystem.resetHintState();

      const nextTimeline = commitGameStateToTimeline(timelineStateRef.current, moveResult.nextState);
      timelineStateRef.current = nextTimeline;
      gameStateRef.current = moveResult.nextState;

      dispatchTimeline({ type: 'commit', nextState: moveResult.nextState });
      queueAnalysisForGameState(moveResult.nextState);
    },
    [engineAnalysis, hintSystem, queueAnalysisForGameState]
  );

  const undoMove = useCallback(() => {
    const nextTimeline = undoGameTimeline(timelineStateRef.current);
    if (nextTimeline === timelineStateRef.current) {
      return;
    }

    restoreTimelinePosition(nextTimeline);
  }, [restoreTimelinePosition]);

  const redoMove = useCallback(() => {
    const nextTimeline = redoGameTimeline(timelineStateRef.current);
    if (nextTimeline === timelineStateRef.current) {
      return;
    }

    restoreTimelinePosition(nextTimeline);
  }, [restoreTimelinePosition]);

  useLayoutEffect(() => {
    timelineStateRef.current = timelineState;
    gameStateRef.current = timelineState.current;
  }, [timelineState]);

  useLayoutEffect(() => {
    playerColorRef.current = playerColor;
  }, [playerColor]);

  useLayoutEffect(() => {
    executeMoveRef.current = executeMove;
  }, [executeMove]);

  const handleNewGame = useCallback(
    (colorOverride?: PlayerColor, openingKey: OpeningKey = 'none') => {
      if (typeof colorOverride !== 'string') {
        setShowNewGameModal(true);
        return;
      }

      const openingMoves =
        openingKey !== 'none' && openingMap[openingKey] ? openingMap[openingKey].moves : [];
      const nextGameState = buildGameStateFromUciMoves(openingMoves);
      const nextTimeline = buildTimelineStateFromCurrent(nextGameState);

      gameRef.current = createChessFromFen(nextGameState.fen);
      timelineStateRef.current = nextTimeline;
      gameStateRef.current = nextGameState;
      playerColorRef.current = colorOverride;

      setPlayerColor(colorOverride);
      setShowNewGameModal(false);
      dispatchTimeline({ type: 'replaceTimeline', timeline: nextTimeline });

      hintSystem.resetForNewGame();
      engineAnalysis.resetForNewGame();
      queueAnalysisForGameState(nextGameState);
    },
    [engineAnalysis, hintSystem, queueAnalysisForGameState]
  );

  const letterCoords = useMemo(
    () => (playerColor === 'b' ? [...files].reverse() : files),
    [playerColor]
  );
  const numberCoords = useMemo(
    () => (playerColor === 'b' ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1]),
    [playerColor]
  );

  return {
    gameState,
    historySnapshots,
    playerColor,
    aiDepth,
    engineMode,
    engineStatus: engineAnalysis.engineStatus,
    evalScore: engineAnalysis.evalScore,
    mateIn: engineAnalysis.mateIn,
    progressActive: engineAnalysis.progressActive,
    progressValue: engineAnalysis.progressValue,
    hintMoves: hintSystem.hintMoves,
    hintError: hintSystem.hintError,
    isHintLoading: hintSystem.isHintLoading,
    showNewGameModal,
    canUndo,
    canRedo,
    possibleMoveCount,
    setAiDepth,
    setEngineMode,
    setShowNewGameModal,
    executeMove,
    undoMove,
    redoMove,
    requestHint: hintSystem.requestHint,
    handleNewGame,
    letterCoords,
    numberCoords,
  };
}
