# Implementation Plan - Stockfish WASM Integration

Integrate Stockfish Chess Engine (WASM) into the Next.js App Router application using Web Workers for high performance and non-blocking UI.

## User Review Required

> [!IMPORTANT]
> **Cross-Origin Isolation**: To use `SharedArrayBuffer` (often required for multi-threaded Stockfish WASM and better performance), we must enable Cross-Origin Isolation headers (`COOP`/`COEP`). This will be added to `next.config.ts`. Note that this might affect loading of third-party resources (like images from other domains) unless they also provide appropriate CORS headers.

## Open Questions

- **SIMD Files**: The `public` directory currently only contains `stockfish-18-single.js`. To support SIMD as requested, we need a SIMD-enabled version (e.g., `stockfish-18-simd.js`). Should I implement the detection logic assuming these files will be added, or use a CDN?
- **Worker File Location**: I'll place the worker in `src/workers/engine.worker.ts`. Next.js handles Web Workers automatically if they are imported correctly.

## Proposed Changes

### Configuration

#### [MODIFY] [next.config.ts](file:///d:/Developer/Next.Js/next-chess/next.config.ts)
- Add headers for Cross-Origin-Embedder-Policy: `require-corp` and Cross-Origin-Opener-Policy: `same-origin`.

### Types

#### [NEW] [src/types/engine.ts](file:///d:/Developer/Next.Js/next-chess/src/types/engine.ts)
- `EngineMessage`: Union of possible messages from/to worker.
- `EngineEvaluation`: Interface for centipawn, mate, depth, and best move.
- `EngineState`: Status of the engine (loading, ready, thinking, etc.).

### Worker

#### [NEW] [src/workers/engine.worker.ts](file:///d:/Developer/Next.Js/next-chess/src/workers/engine.worker.ts)
- Use `importScripts` to load Stockfish JS.
- Handle SIMD detection using `WebAssembly.validate`.
- Bridge UCI commands between main thread and Stockfish.
- Parse `info` strings to extract evaluation and depth.

### Hook

#### [NEW] [src/hooks/useChessEngine.ts](file:///d:/Developer/Next.Js/next-chess/src/hooks/useChessEngine.ts)
- Manage Worker lifecycle.
- Initialize engine with `uci`, `isready`, `setoption` (Threads/Hash).
- Expose `evaluate(fen)`, `stop()`, and `terminate()` methods.
- Use `navigator.hardwareConcurrency` for thread count.

## Verification Plan

### Automated Tests
- Build check: `npm run build` to ensure worker bundling works.
- Type check: `npx tsc --noEmit`.

### Manual Verification
- Verify engine initialization logs in browser console.
- Test evaluation output for a known position (e.g., starting FEN).
- Check that the UI remains responsive during deep engine searches.
