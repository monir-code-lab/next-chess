'use client';

import React from 'react';

export type EngineMode = 'Instant' | 'Fast' | 'Strong';

interface AISettingsProps {
    aiDepth: number;
    setAiDepth: (depth: number) => void;
    engineStatus?: string;
    engineMode: EngineMode;
    setEngineMode: (mode: EngineMode) => void;
    onNewGame?: () => void;
    playerColor: 'w' | 'b';
}

export default function AISettings({ 
    aiDepth, setAiDepth, engineStatus, engineMode, setEngineMode, onNewGame, playerColor
}: AISettingsProps) {
    const isWhite = playerColor === 'w';

    return (
        <div className="ai-settings-container">
            <div className="control-group">
                <label>Engine Speed</label>
                <div className="speed-toggle">
                    {(['Instant', 'Fast', 'Strong'] as EngineMode[]).map(mode => (
                        <button 
                            key={mode}
                            className={`speed-btn ${engineMode === mode ? 'active' : ''}`}
                            onClick={() => setEngineMode(mode)}
                        >
                            {mode}
                        </button>
                    ))}
                </div>
            </div>

            <div className="control-group">
                <label htmlFor="aiDepth">Depth Override: <span id="depthVal">{aiDepth}</span></label>
                <input 
                    type="range" 
                    id="aiDepth" 
                    min="1" 
                    max="25" 
                    value={aiDepth ?? 12} 
                    onChange={(e) => setAiDepth(parseInt(e.target.value, 10) || 12)}
                    autoComplete="off" 
                />
            </div>

            {engineStatus !== undefined && (
                <div className="engine-status" id="engineStatus">
                    {engineStatus}
                </div>
            )}
            
            {onNewGame && (
                <button id="newGameBtn" className="new-game-btn" onClick={onNewGame}>New Game</button>
            )}


            <style jsx>{`
                .ai-settings-container {
                    display: flex;
                    flex-direction: column;
                    width: 100%;
                }
                .speed-toggle {
                    display: flex;
                    background: rgba(0,0,0,0.3);
                    border-radius: 8px;
                    padding: 4px;
                    gap: 4px;
                }
                .speed-btn {
                    flex: 1;
                    padding: 6px 4px;
                    font-size: 0.8rem;
                    border: none;
                    background: transparent;
                    color: #999;
                    cursor: pointer;
                    border-radius: 6px;
                    transition: all 0.2s ease;
                    font-family: inherit;
                    font-weight: 500;
                }
                .speed-btn:hover {
                    color: #ccc;
                }
                .speed-btn.active {
                    background: #cba483;
                    color: #fff;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.3);
                }
            `}</style>
        </div>
        );
    }