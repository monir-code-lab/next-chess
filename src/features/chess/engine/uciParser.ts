import { EngineBestMoveEvent, EngineEvaluationEvent, EngineHintEvent, EngineMateEvent, EngineReadyEvent } from '../types/engine';

const UCI_MOVE_PATTERN = /^[a-h][1-8][a-h][1-8][qrbn]?$/;

export function parseEngineEvent(line: string): EngineReadyEvent | EngineBestMoveEvent | EngineEvaluationEvent | EngineMateEvent | null {
  if (line === 'readyok') {
    return { type: 'ready' };
  }

  const bestMoveMatch = line.match(/^bestmove\s([a-h][1-8][a-h][1-8][qrbn]?)/);
  if (bestMoveMatch) {
    return { type: 'bestmove', move: bestMoveMatch[1] };
  }

  if (!line.startsWith('info') || !line.includes(' score ')) {
    return null;
  }

  const depthMatch = line.match(/\bdepth\s(\d+)\b/);
  const depth = depthMatch ? parseInt(depthMatch[1], 10) : 0;

  const mateMatch = line.match(/\bscore\s+mate\s+(-?\d+)\b/);
  if (mateMatch) {
    return {
      type: 'mate',
      depth,
      mateIn: parseInt(mateMatch[1], 10),
    };
  }

  const cpMatch = line.match(/\bscore\s+cp\s+(-?\d+)\b/);
  if (!cpMatch) {
    return null;
  }

  return {
    type: 'evaluation',
    depth,
    score: parseInt(cpMatch[1], 10) / 100,
  };
}

export function parseHintEvent(line: string, maxRank: number): EngineHintEvent | null {
  if (!line.startsWith('info') || !line.includes(' multipv ') || !line.includes(' pv ')) {
    return null;
  }

  const multipvMatch = line.match(/\bmultipv\s+(\d+)\b/);
  const pvMatch = line.match(/\bpv\s+([a-h][1-8][a-h][1-8][qrbn]?)/);
  if (!multipvMatch || !pvMatch) {
    return null;
  }

  const rank = parseInt(multipvMatch[1], 10);
  if (rank < 1 || rank > maxRank) {
    return null;
  }

  const move = pvMatch[1];
  if (!UCI_MOVE_PATTERN.test(move)) {
    return null;
  }

  const mateMatch = line.match(/\bscore\s+mate\s+(-?\d+)\b/);
  const cpMatch = line.match(/\bscore\s+cp\s+(-?\d+)\b/);

  return {
    type: 'hint',
    rank,
    move,
    evaluation: cpMatch ? parseInt(cpMatch[1], 10) / 100 : null,
    mateIn: mateMatch ? parseInt(mateMatch[1], 10) : null,
  };
}
