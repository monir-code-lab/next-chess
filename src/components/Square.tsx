'use client';

import React from 'react';
import Piece from './Piece';

interface SquareProps {
    row: number;
    col: number;
    piece: string | null;
    isLight: boolean;
    isPossible: boolean;
    isCapture: boolean;
    isSelected: boolean;
    isDragOver: boolean;
    isLastMove: boolean;
    playerColor: 'w' | 'b';
    onClick: (row: number, col: number) => void;
    onDragStart: (e: React.DragEvent, row: number, col: number) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDragEnter: (row: number, col: number) => void;
    onDrop: (e: React.DragEvent, row: number, col: number) => void;
    onDragLeave: (row: number, col: number) => void;
}

const Square = React.memo(({ 
    row, col, piece, isLight, isPossible, isCapture, isSelected, isDragOver, isLastMove,
    playerColor,
    onClick, onDragStart, onDragOver, onDragEnter, onDragLeave, onDrop
}: SquareProps) => {
    const isDraggable = !!(piece && piece[0] === playerColor);

    return (
        <div 
            className={`square ${isLight ? 'light' : 'dark'} ${isPossible ? 'possible-move' : ''} ${isCapture ? 'possible-capture' : ''} ${isSelected ? 'selected' : ''} ${isDragOver ? 'drag-over' : ''} ${isLastMove ? 'last-move' : ''} ${piece ? 'has-piece' : ''}`}
            onClick={() => onClick(row, col)}
            onDragOver={onDragOver}
            onDragEnter={() => onDragEnter(row, col)}
            onDragLeave={() => onDragLeave(row, col)}
            onDrop={(e) => onDrop(e, row, col)}
            draggable={isDraggable}
            onDragStart={(e) => onDragStart(e, row, col)}
        >
            {piece && <Piece type={piece} />}
        </div>
    );
});

Square.displayName = 'Square';

export default Square;
