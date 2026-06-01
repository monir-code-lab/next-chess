'use client';
import React from 'react';
import { pieceImages } from '../utils/chessLogic';

interface PieceProps {
    type: string;
}

const Piece = React.memo(({ type }: PieceProps) => {
    return (
        <img 
            src={pieceImages[type]} 
            alt={type} 
            className="piece" 
            draggable={false}
            crossOrigin="anonymous"
        />
    );
});
Piece.displayName = 'Piece';
export default Piece;
