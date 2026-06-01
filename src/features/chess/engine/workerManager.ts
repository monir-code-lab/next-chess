export interface WorkerEngineConfig {
  threads: number;
  hash: number;
}

export function createStockfishWorker(scriptPath = '/stockfish-18-single.js'): Worker {
  return new Worker(scriptPath);
}

export function resolveMainEngineConfig(): WorkerEngineConfig {
  const hardwareThreads = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 2 : 2;
  const threads = Math.max(1, Math.min(2, Math.floor(hardwareThreads / 2) || 1));
  const hash = hardwareThreads >= 8 ? 64 : 32;
  return { threads, hash };
}

export function resolveHintEngineConfig(): WorkerEngineConfig {
  const hardwareThreads = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 2 : 2;
  return {
    threads: 1,
    hash: hardwareThreads >= 8 ? 48 : 24,
  };
}

export function initializeWorker(worker: Worker, config: WorkerEngineConfig): void {
  worker.postMessage('uci');
  worker.postMessage(`setoption name Hash value ${config.hash}`);
  worker.postMessage(`setoption name Threads value ${config.threads}`);
  worker.postMessage('setoption name Use NNUE value true');
  worker.postMessage('isready');
}
