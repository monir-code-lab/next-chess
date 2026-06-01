import { MoveRecord } from '../types/chess';

export interface IndexedMoveRecord extends MoveRecord {
  index: number;
}

export interface MovePair {
  number: number;
  white: IndexedMoveRecord;
  black: IndexedMoveRecord | null;
}

export function annotateLastMoveCpLoss(
  moveHistory: readonly MoveRecord[],
  cpLoss: number
): readonly MoveRecord[] {
  if (moveHistory.length === 0) {
    return moveHistory;
  }

  const nextMoveHistory = [...moveHistory];
  const lastIndex = nextMoveHistory.length - 1;
  const lastMove = nextMoveHistory[lastIndex];

  if (lastMove.cpLoss !== undefined) {
    return moveHistory;
  }

  nextMoveHistory[lastIndex] = {
    ...lastMove,
    cpLoss,
  };

  return nextMoveHistory;
}

export function buildMovePairs(moveHistory: readonly MoveRecord[]): MovePair[] {
  const pairs: MovePair[] = [];

  for (let index = 0; index < moveHistory.length; index += 2) {
    pairs.push({
      number: Math.floor(index / 2) + 1,
      white: { ...moveHistory[index], index },
      black: moveHistory[index + 1] ? { ...moveHistory[index + 1], index: index + 1 } : null,
    });
  }

  return pairs;
}
