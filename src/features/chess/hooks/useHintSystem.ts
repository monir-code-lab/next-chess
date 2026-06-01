'use client';

import { MutableRefObject, useCallback, useEffect, useRef, useState } from 'react';
import { createChessFromFen } from '@/utils/chessLogic';
import { createStockfishAdapter } from '../engine/stockfishAdapter';
import { resolveHintEngineConfig } from '../engine/workerManager';
import { GameState, PlayerColor } from '../types/chess';
import { EngineEvent } from '../types/engine';
import { HintMove } from '../types/hint';

const HINT_MULTI_PV = 3;
const HINT_DEPTH = 12;
const HINT_MOVE_TIME = 3000;

function formatHintMove(fen: string, uciMove: string): string {
  try {
    const chess = createChessFromFen(fen);
    const move = chess.move({
      from: uciMove.slice(0, 2),
      to: uciMove.slice(2, 4),
      promotion: uciMove.length > 4 ? uciMove[4] : undefined,
    });

    return move?.san ?? uciMove;
  } catch {
    return uciMove;
  }
}

interface UseHintSystemOptions {
  gameStateRef: MutableRefObject<GameState>;
  playerColorRef: MutableRefObject<PlayerColor>;
}

interface UseHintSystemResult {
  hintMoves: HintMove[];
  hintError: string | null;
  isHintLoading: boolean;
  requestHint: () => void;
  resetHintState: () => void;
  resetForNewGame: () => void;
}

export function useHintSystem({
  gameStateRef,
  playerColorRef,
}: UseHintSystemOptions): UseHintSystemResult {
  const [hintMoves, setHintMoves] = useState<HintMove[]>([]);
  const [hintError, setHintError] = useState<string | null>(null);
  const [isHintLoading, setIsHintLoading] = useState(false);
  
  const requestIdRef = useRef(0);
  const hintFenRef = useRef('');
  const hintCandidatesRef = useRef<Map<number, HintMove>>(new Map());
  const hintSanCacheRef = useRef<Map<string, string>>(new Map());
  const adapterRef = useRef<ReturnType<typeof createStockfishAdapter> | null>(null);

  const resetHintState = useCallback(() => {
    hintCandidatesRef.current.clear();
    hintSanCacheRef.current.clear();
    setHintMoves([]);
    setHintError(null);
    setIsHintLoading(false);
    adapterRef.current?.cancel();
  }, []);

  const finalizeHints = useCallback((incomingRequestId: number) => {
    // Prevent resolution if a newer request has already bypassed this execution
    if (incomingRequestId !== requestIdRef.current) return;

    const sortedHints = Array.from(hintCandidatesRef.current.values())
      .sort((left, right) => left.rank - right.rank)
      .slice(0, HINT_MULTI_PV);

    if (sortedHints.length === 0) {
      setHintError('No hint available for this position.');
      setHintMoves([]);
    } else {
      setHintMoves(sortedHints);
      setHintError(null);
    }

    setIsHintLoading(false);
  }, []);

  // Use a ref to store the event handler to protect the Engine instance 
  // from recreating if React dependencies shift.
  const onEngineEventRef = useRef<(event: EngineEvent) => void>(() => {});

  onEngineEventRef.current = (event: EngineEvent) => {
    if (event.type === 'ready' || event.purpose !== 'hint') {
      return;
    }

    // 🛑 CRITICAL FIX: Ignore stale engine reports from older request IDs
    if (event.requestId !== requestIdRef.current) {
      return;
    }

    if (event.type === 'hint') {
      const currentGameState = gameStateRef.current;
      const labelCache = hintSanCacheRef.current;
      const cachedLabel = labelCache.get(event.move);
      const label = cachedLabel ?? formatHintMove(hintFenRef.current, event.move);

      if (!cachedLabel) {
        labelCache.set(event.move, label);
      }

      // NOTE: Double check if your UI expects absolute perspective (White positive) 
      // or relative perspective (positive means current player is winning). 
      // Adjusted below assuming standard relative POV adjustments.
      const multiplier = currentGameState.turn === 'b' ? -1 : 1;

      hintCandidatesRef.current.set(event.rank, {
        rank: event.rank,
        move: label,
        evaluation: event.evaluation !== null ? event.evaluation * multiplier : null,
        mateIn: event.mateIn !== null ? event.mateIn * multiplier : null,
      });
      return;
    }

    if (event.type === 'bestmove') {
      finalizeHints(event.requestId);
    }
  };

  useEffect(() => {
    const adapter = createStockfishAdapter({
      config: resolveHintEngineConfig(),
      multiPv: HINT_MULTI_PV,
      onEvent: (e) => onEngineEventRef.current(e),
      onError: () => {
        setHintError('Hint engine failed. Please try again.');
        setHintMoves([]);
        setIsHintLoading(false);
      },
    });

    adapterRef.current = adapter;
    adapter.start();

    return () => {
      adapter.cancel();
      adapter.dispose();
    };
  }, []);

  const requestHint = useCallback(() => {
    const currentGameState = gameStateRef.current;
    const playerColor = playerColorRef.current;
    const adapter = adapterRef.current;

    if (!adapter || currentGameState.turn !== playerColor) {
      return;
    }

    adapter.cancel();

    requestIdRef.current += 1;
    hintFenRef.current = currentGameState.fen;
    hintCandidatesRef.current.clear();
    hintSanCacheRef.current.clear();
    
    setHintMoves([]);
    setHintError(null);
    setIsHintLoading(true);

    adapter.search({
      fen: currentGameState.fen,
      depth: HINT_DEPTH,
      moveTime: HINT_MOVE_TIME,
      purpose: 'hint',
      requestId: requestIdRef.current,
    });
  }, [gameStateRef, playerColorRef]);

  const resetForNewGame = useCallback(() => {
    resetHintState();
    adapterRef.current?.newGame();
  }, [resetHintState]);

  return {
    hintMoves,
    hintError,
    isHintLoading,
    requestHint,
    resetHintState,
    resetForNewGame,
  };
}