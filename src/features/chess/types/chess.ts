import { Color } from 'chess.js';

export type PlayerColor = Color;
export type GameTurn = PlayerColor | 'end';

export interface SquareHighlight {
  readonly row: number;
  readonly col: number;
}

export interface MoveRecord {
  readonly ply: number;
  readonly color: PlayerColor;
  readonly san: string;
  readonly uci: string;
  readonly fenAfter: string;
  readonly cpLoss?: number;
}

export type GameResultReason =
  | 'checkmate'
  | 'stalemate'
  | 'threefold_repetition'
  | 'insufficient_material'
  | 'fifty_moves'
  | 'timeout'
  | 'resignation'
  | 'abandonment'
  | 'draw';

export interface GameResult {
  readonly winner: PlayerColor | 'Draw';
  readonly reason: GameResultReason;
}

export interface GameState {
  readonly fen: string;
  readonly turn: GameTurn;
  readonly moveHistory: readonly MoveRecord[];
  readonly lastMoveSquares: readonly SquareHighlight[];
  readonly result: GameResult | null;
}

export interface GameTimelineState {
  readonly history: readonly GameState[];
  readonly current: GameState;
  readonly future: readonly GameState[];
}

export type HistorySnapshot = Pick<GameState, 'fen' | 'lastMoveSquares'>;
