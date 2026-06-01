'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { BoardState, generateAllMoves, getBoardStateFromFen, Move } from '../utils/chessLogic';
import Square from './Square';

const EMPTY_MOVES: readonly Move[] = [];
const STATIC_INDEXES = [0, 1, 2, 3, 4, 5, 6, 7];

interface ChessBoardProps {
    currentTurn: 'w' | 'b' | 'end';
    onMove: (fromRow: number, fromCol: number, toRow: number, toCol: number) => void;
    lastMoveSquares: readonly { row: number, col: number }[];
    fen: string;
    playerColor: 'w' | 'b';
}

function ChessBoard({ currentTurn, onMove, lastMoveSquares, fen, playerColor }: ChessBoardProps) {
    const [selectedSquare, setSelectedSquare] = useState<{ row: number, col: number } | null>(null);
    const [possibleMoves, setPossibleMoves] = useState<Move[]>([]);
    const [dragOverSquareKey, setDragOverSquareKey] = useState<string | null>(null);
    const [interactionFen, setInteractionFen] = useState(fen);

    const flipped = playerColor === 'b';
    const boardState: BoardState = useMemo(() => getBoardStateFromFen(fen), [fen]);
    const hasActiveInteraction = interactionFen === fen;
    const activeSelectedSquare = hasActiveInteraction ? selectedSquare : null;
    const activePossibleMoves = hasActiveInteraction ? possibleMoves : EMPTY_MOVES;
    const activeDragOverSquareKey = hasActiveInteraction ? dragOverSquareKey : null;

    // Game Rule Lookups & Structural Cache
    const allLegalMoves = useMemo(() => {
        if (currentTurn === 'end') return [];
        return generateAllMoves(fen);
    }, [fen, currentTurn]);

    const legalMovesByOrigin = useMemo(() => {
        const nextMap = new Map<string, Move[]>();
        for (const move of allLegalMoves) {
            const key = `${move.fromRow}-${move.fromCol}`;
            const existingMoves = nextMap.get(key);
            if (existingMoves) {
                existingMoves.push(move);
            } else {
                nextMap.set(key, [move]);
            }
        }
        return nextMap;
    }, [allLegalMoves]);

    const possibleTargetKeys = useMemo(
        () => new Set(activePossibleMoves.map((move) => `${move.toRow}-${move.toCol}`)),
        [activePossibleMoves]
    );

    const lastMoveKeySet = useMemo(
        () => new Set(lastMoveSquares.map((square) => `${square.row}-${square.col}`)),
        [lastMoveSquares]
    );

    // Click Actions Handler
    const handleSquareClick = useCallback((row: number, col: number) => {
        if (currentTurn !== playerColor) return;

        if (activeSelectedSquare) {
            const move = activePossibleMoves.find(m => m.toRow === row && m.toCol === col);
            if (move) {
                onMove(activeSelectedSquare.row, activeSelectedSquare.col, row, col);
                setSelectedSquare(null);
                setPossibleMoves([]);
                setInteractionFen(fen);
                return;
            }
        }

        const piece = boardState[row]?.[col];
        if (piece && piece[0] === playerColor) {
            setSelectedSquare({ row, col });
            setPossibleMoves(legalMovesByOrigin.get(`${row}-${col}`) ?? []);
            setInteractionFen(fen);
        } else {
            setSelectedSquare(null);
            setPossibleMoves([]);
            setInteractionFen(fen);
        }
    }, [activePossibleMoves, activeSelectedSquare, boardState, currentTurn, fen, legalMovesByOrigin, playerColor, onMove]);

    // HTML5 Drag Event Interceptors
    const handleDragStart = useCallback((e: React.DragEvent, row: number, col: number) => {
        if (currentTurn !== playerColor) {
            e.preventDefault();
            return;
        }
        const piece = boardState[row]?.[col];
        if (!piece || piece[0] !== playerColor) {
            e.preventDefault();
            return;
        }

        setSelectedSquare({ row, col });
        setPossibleMoves(legalMovesByOrigin.get(`${row}-${col}`) ?? []);
        setInteractionFen(fen);
        
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('application/json', JSON.stringify({ row, col }));
    }, [boardState, currentTurn, fen, legalMovesByOrigin, playerColor]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }, []);

    const handleDragEnter = useCallback((row: number, col: number) => {
        setDragOverSquareKey(`${row}-${col}`);
    }, []);

    const handleDragLeave = useCallback((row: number, col: number) => {
        const targetKey = `${row}-${col}`;
        setDragOverSquareKey(prev => (prev === targetKey ? null : prev));
    }, []);

    const handleDrop = useCallback((e: React.DragEvent, row: number, col: number) => {
        e.preventDefault();
        setDragOverSquareKey(null);

        try {
            const dataStr = e.dataTransfer.getData('application/json');
            if (dataStr) {
                const from = JSON.parse(dataStr);
                const moves = legalMovesByOrigin.get(`${from.row}-${from.col}`) ?? [];
                const move = moves.find(m => m.toRow === row && m.toCol === col);

                if (move) {
                    onMove(from.row, from.col, row, col);
                }
            }
        } catch (err) {
            console.error("Failed parsing drop data", err);
        }

        setSelectedSquare(null);
        setPossibleMoves([]);
    }, [legalMovesByOrigin, onMove]);

    return (
        <div 
            className="chessboard" 
            style={{ 
                display: 'flex', 
                flexDirection: flipped ? 'column-reverse' : 'column' 
            }}
        >
            {STATIC_INDEXES.map((r) => (
                <div 
                    key={`row-${r}`} 
                    className="chessboard-row"
                    style={{ 
                        display: 'flex', 
                        flexDirection: flipped ? 'row-reverse' : 'row' 
                    }}
                >
                    {STATIC_INDEXES.map((c) => {
                        const piece = boardState[r][c];
                        const squareKey = `${r}-${c}`;
                        
                        const isPossible = possibleTargetKeys.has(squareKey);
                        const isCapture = isPossible && piece !== null;
                        const isSelected = activeSelectedSquare?.row === r && activeSelectedSquare?.col === c;
                        const isDragOver = activeDragOverSquareKey === squareKey;
                        const isLastMoveSq = lastMoveKeySet.has(squareKey);

                        return (
                            <Square 
                                key={squareKey}
                                row={r}
                                col={c}
                                piece={piece}
                                isLight={(r + c) % 2 === 0}
                                isPossible={isPossible}
                                isCapture={isCapture}
                                isSelected={isSelected}
                                isDragOver={isDragOver}
                                isLastMove={isLastMoveSq}
                                playerColor={playerColor}
                                onClick={handleSquareClick}
                                onDragStart={handleDragStart}
                                onDragOver={handleDragOver}
                                onDragEnter={handleDragEnter}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                            />
                        );
                    })}
                </div>
            ))}
        </div>
    );
}

export default React.memo(ChessBoard);
