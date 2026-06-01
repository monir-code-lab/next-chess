'use client';

import { MutableRefObject, useCallback, useEffect, useRef, useState } from 'react';
import { EngineMode } from '@/components/AISettings';
import { createStockfishAdapter } from '../engine/stockfishAdapter';
import { resolveMainEngineConfig } from '../engine/workerManager';
import { formatGameOverStatus } from '../domain/gameStatus';
import { GameResult, GameState, PlayerColor } from '../types/chess';
import { EngineEvent, EngineSearchPurpose } from '../types/engine';

const EVAL_UPDATE_THROTTLE_MS = 250;
const LIGHT_ANALYSIS_DEPTH = 8;
const LIGHT_ANALYSIS_MOVETIME = 180;

type ProgressTimer = ReturnType<typeof setTimeout>;
type ProgressInterval = ReturnType<typeof setInterval>;

interface UseEngineAnalysisOptions {
  aiDepth: number;
  engineMode: EngineMode;
  gameStateRef: MutableRefObject<GameState>;
  playerColorRef: MutableRefObject<PlayerColor>;
  onEngineMove: (uciMove: string) => void;
  onLastMoveEvaluated: (cpLoss: number) => void;
}

interface QueueSearchArgs {
  fen: string;
  depth: number;
  moveTime?: number;
  purpose: EngineSearchPurpose;
}

interface UseEngineAnalysisResult {
  engineStatus: string;
  evalScore: number;
  mateIn: number | null;
  progressActive: boolean;
  progressValue: number;
  capturePreMoveEvaluation: () => void;
  queueAiMove: (fen: string) => void;
  queueLightAnalysis: (fen: string) => void;
  cancelSearch: () => void;
  prepareForPositionChange: (options?: { resetEngineGame?: boolean }) => void;
  resetForNewGame: () => void;
  setTerminalStatus: (result: GameResult) => void;
}

export function useEngineAnalysis({
  aiDepth,
  engineMode,
  gameStateRef,
  playerColorRef,
  onEngineMove,
  onLastMoveEvaluated,
}: UseEngineAnalysisOptions): UseEngineAnalysisResult {
  const [engineStatus, setEngineStatus] = useState('Stockfish Loading...');
  const [evalScore, setEvalScore] = useState(0);
  const [mateIn, setMateIn] = useState<number | null>(null);
  const [progressActive, setProgressActive] = useState(false);
  const [progressValue, setProgressValue] = useState(0);

  const mainRequestIdRef = useRef(0);
  const evalScoreRef = useRef(0);
  const lastEvalRef = useRef(0);
  const lastProcessedDepthRef = useRef(0);
  const lastProcessedTimeRef = useRef(0);
  const lastReportedMateRef = useRef<number | null>(null);
  const progressIntervalRef = useRef<ProgressInterval | null>(null);
  const progressHideTimeoutRef = useRef<ProgressTimer | null>(null);
  const progressResetTimeoutRef = useRef<ProgressTimer | null>(null);
  const adapterRef = useRef<ReturnType<typeof createStockfishAdapter> | null>(null);
  const suppressReadyStatusRef = useRef(false);

  const stopProgressBar = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    if (progressHideTimeoutRef.current) {
      clearTimeout(progressHideTimeoutRef.current);
    }

    if (progressResetTimeoutRef.current) {
      clearTimeout(progressResetTimeoutRef.current);
    }

    setProgressValue(100);
    progressHideTimeoutRef.current = setTimeout(() => {
      setProgressActive(false);
      progressResetTimeoutRef.current = setTimeout(() => setProgressValue(0), 300);
    }, 400);
  }, []);

  const startProgressBar = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    setProgressActive(true);
    setProgressValue(0);

    const duration = engineMode === 'Instant' ? 400 : engineMode === 'Strong' ? 3000 : 1000;
    progressIntervalRef.current = setInterval(() => {
      setProgressValue((previousValue) => {
        const nextValue = previousValue + (95 - previousValue) / (duration / 50);
        return nextValue > 95 ? 95 : nextValue;
      });
    }, 50);
  }, [engineMode]);

  const queueSearch = useCallback((args: QueueSearchArgs) => {
    const adapter = adapterRef.current;
    if (!adapter) return;

    mainRequestIdRef.current += 1;
    adapter.search({
      ...args,
      requestId: mainRequestIdRef.current,
    });
  }, []);

  const capturePreMoveEvaluation = useCallback(() => {
    lastEvalRef.current = evalScoreRef.current;
  }, []);

  const queueAiMove = useCallback(
    (fen: string) => {
      suppressReadyStatusRef.current = false;
      const moveTime = engineMode === 'Instant' ? 400 : engineMode === 'Strong' ? 3000 : 1000;
      queueSearch({
        fen,
        depth: aiDepth,
        moveTime,
        purpose: 'ai',
      });
      startProgressBar();
      setEngineStatus('Stockfish analyzing...');
    },
    [aiDepth, engineMode, queueSearch, startProgressBar]
  );

  const queueLightAnalysis = useCallback(
    (fen: string) => {
      suppressReadyStatusRef.current = false;
      queueSearch({
        fen,
        depth: LIGHT_ANALYSIS_DEPTH,
        moveTime: LIGHT_ANALYSIS_MOVETIME,
        purpose: 'eval',
      });
    },
    [queueSearch]
  );

  const cancelSearch = useCallback(() => {
    adapterRef.current?.cancel();
    stopProgressBar();
  }, [stopProgressBar]);

  const resetEvaluationState = useCallback(() => {
    setEvalScore(0);
    setMateIn(null);
    evalScoreRef.current = 0;
    lastEvalRef.current = 0;
    lastProcessedDepthRef.current = 0;
    lastProcessedTimeRef.current = 0;
    lastReportedMateRef.current = null;
  }, []);

  const resetForNewGame = useCallback(() => {
    suppressReadyStatusRef.current = false;
    cancelSearch();
    resetEvaluationState();
    adapterRef.current?.newGame();
  }, [cancelSearch, resetEvaluationState]);

  const prepareForPositionChange = useCallback(
    ({ resetEngineGame = false }: { resetEngineGame?: boolean } = {}) => {
      suppressReadyStatusRef.current = false;
      cancelSearch();
      resetEvaluationState();

      if (resetEngineGame) {
        adapterRef.current?.newGame();
      }
    },
    [cancelSearch, resetEvaluationState]
  );

  const setTerminalStatus = useCallback(
    (result: GameResult) => {
      suppressReadyStatusRef.current = true;
      cancelSearch();
      setEngineStatus(formatGameOverStatus(result));
    },
    [cancelSearch]
  );

  const handleEngineEvent = useCallback(
    (event: EngineEvent) => {
      if (event.type === 'ready') {
        if (suppressReadyStatusRef.current) {
          return;
        }

        setEngineStatus('Engine Ready');
        return;
      }

      const currentGameState = gameStateRef.current;
      const playerColor = playerColorRef.current;

      if (event.type === 'bestmove') {
        if (event.purpose === 'ai') {
          stopProgressBar();

          if (currentGameState.turn !== 'end' && currentGameState.turn !== playerColor) {
            setEngineStatus(`Stockfish played: ${event.move}`);
            onEngineMove(event.move);
          }
        }

        return;
      }

      if (event.purpose !== 'ai' && event.purpose !== 'eval') {
        return;
      }

      if (event.type !== 'evaluation' && event.type !== 'mate') {
        return;
      }

      const now = Date.now();
      if (
        event.depth <= lastProcessedDepthRef.current &&
        now - lastProcessedTimeRef.current <= EVAL_UPDATE_THROTTLE_MS
      ) {
        return;
      }

      lastProcessedDepthRef.current = event.depth;
      lastProcessedTimeRef.current = now;

      if (event.type === 'evaluation') {
        const score = currentGameState.turn === 'b' ? -event.score : event.score;
        if (Math.abs(score - evalScoreRef.current) < 0.01 && lastReportedMateRef.current === null) {
          return;
        }

        evalScoreRef.current = score;
        lastReportedMateRef.current = null;
        setEvalScore(score);
        setMateIn(null);
      } else if (event.type === 'mate') {
        const nextMate = currentGameState.turn === 'b' ? -event.mateIn : event.mateIn;
        if (lastReportedMateRef.current === nextMate) {
          return;
        }

        lastReportedMateRef.current = nextMate;
        setMateIn(nextMate);
        const artificialScore = nextMate > 0 ? 1000 - nextMate : -1000 - nextMate;
        evalScoreRef.current = artificialScore;
        setEvalScore(artificialScore);
      }

      if (event.depth < 10 || currentGameState.moveHistory.length === 0) {
        return;
      }

      const lastMove = currentGameState.moveHistory[currentGameState.moveHistory.length - 1];
      if (lastMove.cpLoss !== undefined) {
        return;
      }

      const currentEval = evalScoreRef.current;
      const previousEval = lastEvalRef.current;
      const cpLoss =
        lastMove.color === 'w' ? previousEval - currentEval : currentEval - previousEval;

      onLastMoveEvaluated(Math.max(0, cpLoss * 100));
    },
    [gameStateRef, onEngineMove, onLastMoveEvaluated, playerColorRef, stopProgressBar]
  );

  useEffect(() => {
    const adapter = createStockfishAdapter({
      config: resolveMainEngineConfig(),
      onEvent: handleEngineEvent,
      onError: () => {
        stopProgressBar();
        setEngineStatus('Stockfish failed. Please start a new game.');
      },
    });

    adapterRef.current = adapter;
    adapter.start();

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (progressHideTimeoutRef.current) clearTimeout(progressHideTimeoutRef.current);
      if (progressResetTimeoutRef.current) clearTimeout(progressResetTimeoutRef.current);
      adapter.dispose();
    };
  }, [handleEngineEvent, stopProgressBar]);

  return {
    engineStatus,
    evalScore,
    mateIn,
    progressActive,
    progressValue,
    capturePreMoveEvaluation,
    queueAiMove,
    queueLightAnalysis,
    cancelSearch,
    prepareForPositionChange,
    resetForNewGame,
    setTerminalStatus,
  };
}
