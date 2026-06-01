export type EngineSearchPurpose = 'ai' | 'hint' | 'eval';

export interface EngineSearchRequest {
  fen: string;
  depth: number;
  moveTime?: number;
  purpose: EngineSearchPurpose;
  requestId: number;
}

export interface EngineSearchContext {
  requestId: number;
  purpose: EngineSearchPurpose;
}

export interface EngineReadyEvent {
  type: 'ready';
}

export interface EngineEvaluationEvent {
  type: 'evaluation';
  depth: number;
  score: number;
}

export interface EngineMateEvent {
  type: 'mate';
  depth: number;
  mateIn: number;
}

export interface EngineBestMoveEvent {
  type: 'bestmove';
  move: string;
}

export interface EngineHintEvent {
  type: 'hint';
  rank: number;
  move: string;
  evaluation: number | null;
  mateIn: number | null;
}

export type ParsedEngineEvent =
  | EngineReadyEvent
  | EngineEvaluationEvent
  | EngineMateEvent
  | EngineBestMoveEvent
  | EngineHintEvent;

export type EngineEvent =|EngineReadyEvent|(EngineSearchContext &(EngineEvaluationEvent | EngineMateEvent | EngineBestMoveEvent | EngineHintEvent));
