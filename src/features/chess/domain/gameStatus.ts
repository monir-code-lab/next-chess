import { Chess } from 'chess.js';
import { GameResult, GameResultReason, GameTurn } from '../types/chess';

function resolveDrawReason(chess: Chess): GameResultReason | null {
  if (chess.isStalemate()) {
    return 'stalemate';
  }

  if (chess.isThreefoldRepetition()) {
    return 'threefold_repetition';
  }

  if (chess.isDrawByFiftyMoves()) {
    return 'fifty_moves';
  }

  if (chess.isInsufficientMaterial()) {
    return 'insufficient_material';
  }

  if (chess.isDraw()) {
    return 'draw';
  }

  return null;
}

function formatResultReason(reason: GameResultReason): string {
  switch (reason) {
    case 'checkmate':
      return 'checkmate';
    case 'stalemate':
      return 'stalemate';
    case 'threefold_repetition':
      return 'threefold repetition';
    case 'insufficient_material':
      return 'insufficient material';
    case 'fifty_moves':
      return '50-move rule';
    case 'timeout':
      return 'timeout';
    case 'resignation':
      return 'resignation';
    case 'abandonment':
      return 'abandonment';
    case 'draw':
      return 'draw';
    default:
      return reason;
  }
}

export function resolveGameStatus(chess: Chess): { turn: GameTurn; result: GameResult | null } {
  if (chess.isCheckmate()) {
    const winner = chess.turn() === 'w' ? 'b' : 'w';
    return {
      turn: 'end',
      result: {
        winner,
        reason: 'checkmate',
      },
    };
  }

  const drawReason = resolveDrawReason(chess);
  if (drawReason) {
    return {
      turn: 'end',
      result: {
        winner: 'Draw',
        reason: drawReason,
      },
    };
  }

  return {
    turn: chess.turn(),
    result: null,
  };
}

export function formatGameOverStatus(result: GameResult): string {
  if (result.winner === 'Draw') {
    return `Game Over: Draw by ${formatResultReason(result.reason)}`;
  }

  const winner = result.winner === 'w' ? 'White' : 'Black';
  return `Game Over: ${winner} wins by ${formatResultReason(result.reason)}`;
}
