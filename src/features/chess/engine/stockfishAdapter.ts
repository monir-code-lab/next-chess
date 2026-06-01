import { buildUciGoCommand, buildUciPositionCommand } from '@/utils/engineUtils';
import { EngineEvent, EngineSearchRequest } from '../types/engine';
import { createStockfishWorker, initializeWorker, WorkerEngineConfig } from './workerManager';
import { parseEngineEvent, parseHintEvent } from './uciParser';

interface EngineAdapterOptions {
  config: WorkerEngineConfig;
  multiPv?: number;
  onEvent: (event: EngineEvent) => void;
  onError?: () => void;
}

export interface EngineAdapter {
  start: () => void;
  search: (request: EngineSearchRequest) => void;
  cancel: () => void;
  newGame: () => void;
  dispose: () => void;
}

export function createStockfishAdapter(options: EngineAdapterOptions): EngineAdapter {
  let worker: Worker | null = null;
  let isBooting = false;
  let isAwaitingReady = false;
  let activeRequest: EngineSearchRequest | null = null;
  let pendingRequest: EngineSearchRequest | null = null;
  let pendingNewGame = false;

  const beginSearch = (request: EngineSearchRequest) => {
    if (!worker) return;
    activeRequest = request;
    worker.postMessage(buildUciPositionCommand({ fen: request.fen }));
    worker.postMessage(buildUciGoCommand(request.depth, request.moveTime));
  };

  const requestReadyBarrier = () => {
    if (!worker || isAwaitingReady) return;
    isAwaitingReady = true;
    activeRequest = null;
    worker.postMessage('stop');
    worker.postMessage('isready');
  };

  const flushPendingWork = () => {
    if (!worker) return;

    if (pendingNewGame) {
      pendingNewGame = false;
      isAwaitingReady = true;
      worker.postMessage('ucinewgame');
      worker.postMessage('isready');
      return;
    }

    isAwaitingReady = false;

    if (pendingRequest) {
      const nextRequest = pendingRequest;
      pendingRequest = null;
      beginSearch(nextRequest);
      return;
    }

    options.onEvent({ type: 'ready' });
  };

  const start = () => {
    if (worker) return;
    isBooting = true;
    worker = createStockfishWorker();
    worker.onmessage = (event: MessageEvent<unknown>) => {
      if (typeof event.data !== 'string') {
        return;
      }

      const parsedEvent = parseEngineEvent(event.data);
      if (parsedEvent?.type === 'ready') {
        isBooting = false;
        flushPendingWork();
        return;
      }

      if (isBooting || isAwaitingReady || !activeRequest) {
        return;
      }

      if (activeRequest.purpose === 'hint') {
        const hintEvent = parseHintEvent(event.data, options.multiPv ?? 1);
        if (hintEvent) {
          options.onEvent({
            ...hintEvent,
            requestId: activeRequest.requestId,
            purpose: activeRequest.purpose,
          });
          return;
        }
      }

      if (!parsedEvent) {
        return;
      }

      if (activeRequest.purpose === 'hint' && parsedEvent.type !== 'bestmove') {
        return;
      }

      options.onEvent({
        ...parsedEvent,
        requestId: activeRequest.requestId,
        purpose: activeRequest.purpose,
      });

      if (parsedEvent.type === 'bestmove') {
        activeRequest = null;
      }
    };
    worker.onerror = () => {
      options.onError?.();
    };
    initializeWorker(worker, options.config);
  };

  const search = (request: EngineSearchRequest) => {
    if (!worker) return;
    pendingRequest = request;

    if (isBooting || isAwaitingReady) {
      return;
    }

    if (activeRequest) {
      requestReadyBarrier();
      return;
    }

    const nextRequest = pendingRequest;
    pendingRequest = null;
    if (nextRequest) {
      beginSearch(nextRequest);
    }
  };

  const cancel = () => {
    pendingRequest = null;
    if (!worker || isBooting) return;
    requestReadyBarrier();
  };

  const newGame = () => {
    if (!worker) return;
    pendingRequest = null;
    pendingNewGame = true;

    if (isBooting || isAwaitingReady) {
      return;
    }

    requestReadyBarrier();
  };

  const dispose = () => {
    if (!worker) return;
    pendingRequest = null;
    pendingNewGame = false;
    activeRequest = null;
    worker.postMessage('quit');
    worker.terminate();
    worker = null;
  };

  return { start, search, cancel, newGame, dispose };
}
