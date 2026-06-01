'use client';
import { BoardState, pieceImages } from '../utils/chessLogic';

interface MiniBoardProps {
    boardState: BoardState;
    lastMoveSquares?: readonly { row: number, col: number }[];
}

export default function MiniBoard({ boardState, lastMoveSquares = [] }: MiniBoardProps) {
    return (
        <div className="mini-board">
            {boardState.map((rowArr, r) => (
                <div key={r} className="mini-row">
                    {rowArr.map((piece, c) => {
                        const isLight = (r + c) % 2 === 0;
                        const isLastMove = lastMoveSquares.some(sq => sq.row === r && sq.col === c);
                        
                        return (
                            <div 
                                key={c} 
                                className={`mini-square ${isLight ? 'light' : 'dark'} ${isLastMove ? 'last-move' : ''}`}
                            >
                                {piece && (
                                    <img 
                                        src={pieceImages[piece]} 
                                        alt={piece} 
                                        className="mini-piece"
                                        draggable={false}
                                        crossOrigin="anonymous"
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            ))}
            <style jsx>{`
                .mini-board {
                    display: flex;
                    flex-direction: column;
                    width: 160px;
                    height: 160px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 4px;
                    overflow: hidden;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
                    background: #2a2a2a;
                }
                .mini-row {
                    display: flex;
                    flex: 1;
                }
                .mini-square {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                }
                .mini-square.light { background-color: #edddbf; }
                .mini-square.dark { background-color: #a4764a; }
                .mini-square.last-move {
                    background-color: rgba(255, 255, 0, 0.4) !important;
                }
                .mini-piece {
                    width: 80%;
                    height: 80%;
                    pointer-events: none;
                }
            `}</style>
        </div>
    );
}
