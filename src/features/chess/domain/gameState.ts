import { Chess, Move } from 'chess.js';
import { initialFen, rcToSq, sqToRc } from '@/utils/chessLogic';
import { resolveGameStatus } from './gameStatus';
import { GameState, GameTimelineState, HistorySnapshot, MoveRecord, SquareHighlight } from '../types/chess';

export interface CommitMoveToGameStateArgs {
  chess: Chess;
  previousState: GameState;
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
  promotion?: string;
}

export interface CommitMoveToGameStateResult {
  nextState: GameState;
  moveRecord: MoveRecord;
  nextFen: string;
}

function buildMoveRecord(move: Move, nextFen: string, ply: number): MoveRecord {
  return {
    ply,
    color: move.color,
    san: move.san,
    uci: `${move.from}${move.to}${move.promotion ?? ''}`,
    fenAfter: nextFen,
  };
}

function buildGameState(chess: Chess, moveHistory: readonly MoveRecord[], lastMoveSquares: readonly SquareHighlight[]): GameState {
  const status = resolveGameStatus(chess);

  return {
    fen: chess.fen(),
    turn: status.turn,
    moveHistory: [...moveHistory],
    lastMoveSquares: [...lastMoveSquares],
    result: status.result,
  };
}

export function buildInitialGameState(): GameState {
  return {
    fen: initialFen,
    turn: 'w',
    moveHistory: [],
    lastMoveSquares: [],
    result: null,
  };
}

export function buildInitialTimelineState(): GameTimelineState {
  return {
    history: [],
    current: buildInitialGameState(),
    future: [],
  };
}

export function buildTimelineStateFromCurrent(current: GameState): GameTimelineState {
  return {
    history: [],
    current,
    future: [],
  };
}

export function buildGameStateFromUciMoves(moves: string[]): GameState {
  const chess = new Chess();
  let moveHistory: MoveRecord[] = [];
  let lastMoveSquares: SquareHighlight[] = [];

  for (const uciMove of moves) {
    const from = uciMove.slice(0, 2);
    const to = uciMove.slice(2, 4);
    const promotion = uciMove.length > 4 ? uciMove[4] : undefined;

    try {
      const moveResult = chess.move({ from, to, promotion });
      if (!moveResult) {
        break;
      }

      lastMoveSquares = [
        sqToRc(from),
        sqToRc(to),
      ];
      moveHistory = [
        ...moveHistory,
        buildMoveRecord(moveResult, chess.fen(), moveHistory.length + 1),
      ];
    } catch {
      break;
    }
  }

  return buildGameState(chess, moveHistory, lastMoveSquares);
}

export function commitMoveToGameState({
  chess,
  previousState,
  startRow,
  startCol,
  endRow,
  endCol,
  promotion,
}: CommitMoveToGameStateArgs): CommitMoveToGameStateResult | null {
  const from = rcToSq(startRow, startCol);
  const to = rcToSq(endRow, endCol);

  let moveResult: Move | null;
  try {
    moveResult = chess.move({ from, to, promotion });
  } catch {
    return null;
  }

  if (!moveResult) {
    return null;
  }

  const lastMoveSquares: SquareHighlight[] = [
    { row: startRow, col: startCol },
    { row: endRow, col: endCol },
  ];
  const nextFen = chess.fen();
  const moveRecord = buildMoveRecord(moveResult, nextFen, previousState.moveHistory.length + 1);
  const nextMoveHistory = [...previousState.moveHistory, moveRecord];
  const nextState = buildGameState(chess, nextMoveHistory, lastMoveSquares);

  return {
    nextState,
    moveRecord,
    nextFen,
  };
}

export function commitGameStateToTimeline(
  timelineState: GameTimelineState,
  nextState: GameState
): GameTimelineState {
  return {
    history: [...timelineState.history, timelineState.current],
    current: nextState,
    future: [],
  };
}

export function undoGameTimeline(timelineState: GameTimelineState): GameTimelineState {
  if (timelineState.history.length === 0) {
    return timelineState;
  }

  const previousHistory = timelineState.history.slice(0, -1);
  const previousState = timelineState.history[timelineState.history.length - 1];

  return {
    history: previousHistory,
    current: previousState,
    future: [timelineState.current, ...timelineState.future],
  };
}

export function redoGameTimeline(timelineState: GameTimelineState): GameTimelineState {
  if (timelineState.future.length === 0) {
    return timelineState;
  }

  const [nextState, ...remainingFuture] = timelineState.future;

  return {
    history: [...timelineState.history, timelineState.current],
    current: nextState,
    future: remainingFuture,
  };
}

export function projectHistorySnapshots(timelineState: GameTimelineState): HistorySnapshot[] {
  return [...timelineState.history, timelineState.current].map((snapshot) => ({
    fen: snapshot.fen,
    lastMoveSquares: snapshot.lastMoveSquares,
  }));
}
