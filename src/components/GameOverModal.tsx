'use client';

import React from 'react';
import type { Color } from 'chess.js';

interface GameOverModalProps {
    winner: Color | 'Draw';
    reason: string;
    onNewGame: () => void;
}

const GameOverModal: React.FC<GameOverModalProps> = ({ winner, reason, onNewGame }) => {
    const winnerText = winner === 'Draw' ? "It's a Draw!" : `${winner === 'w' ? 'White' : 'Black'} Wins!`;
    
    return (
        <div className="game-over-overlay">
            <div className="game-over-content">
                <div className="game-over-badge">
                    {reason}
                </div>
                <h2>{winnerText}</h2>
                <p>Refine your strategy. Would you like to play again?</p>
                <button className="new-game-btn" onClick={onNewGame}>
                    Play Again
                </button>
            </div>
        </div>
    );
};

export default GameOverModal;
