'use client';

import React from 'react';
import type { Color } from 'chess.js';
import AISettings, { EngineMode } from './AISettings';

export type OpeningKey =
    | 'none'
    | 'italian'
    | 'ruyLopez'
    | 'scotchGame'
    | 'viennaGame'
    | 'kingsGambit'
    | 'evansGambit'
    | 'danishGambit'
    | 'philidorDefense'
    | 'sicilian'
    | 'caroKann'
    | 'frenchDefense'
    | 'alekhineDefense'
    | 'scandinavianDefense'
    | 'pircDefense'
    | 'modernDefense'
    | 'queensGambit'
    | 'londonSystem'
    | 'slavDefense'
    | 'kingsIndian'
    | 'nimzoIndian'
    | 'bogoIndian'
    | 'grunfeldDefense'
    | 'dutchDefense'
    | 'benoniDefense'
    | 'benkoGambit'
    | 'trompowskyAttack'
    | 'budapestGambit'
    | 'catalanOpening'
    | 'englishOpening'
    | 'retiOpening'
    | 'kingsIndianAttack'
    | 'birdsOpening';

interface NewGameModalProps {
    onSelectColor: (color: Color, opening: OpeningKey) => void;
    onClose: () => void;
    aiDepth: number;
    setAiDepth: (depth: number) => void;
    engineMode: EngineMode;
    setEngineMode: (mode: EngineMode) => void;
    playerColor: 'w' | 'b';
}

const NewGameModal: React.FC<NewGameModalProps> = ({ 
    onSelectColor, 
    onClose,
    aiDepth,
    setAiDepth,
    engineMode,
    setEngineMode,
    playerColor
}) => {
    const [selectedOpening, setSelectedOpening] = React.useState<OpeningKey>('none');

    return (
        <div className="game-over-overlay new-game-modal">
            <div className="game-over-content">
                <div className="game-over-badge">New Game</div>
                <h2 className="text-blue-500">Select Your Side</h2>
                <AISettings 
                    aiDepth={aiDepth}
                    setAiDepth={setAiDepth}
                    engineMode={engineMode}
                    setEngineMode={setEngineMode}
                    playerColor={playerColor}
                />

                <div className="opening-selection">
                    <label htmlFor="opening-select">Starting Opening</label>
                    <select
                        id="opening-select"
                        value={selectedOpening}
                        onChange={(e) => setSelectedOpening(e.target.value as OpeningKey)}
                    >
                        <option value="none">Standard start position</option>
                        <optgroup label="1.e4 Openings">
                            <option value="italian">Italian Game</option>
                            <option value="ruyLopez">Ruy Lopez</option>
                            <option value="scotchGame">Scotch Game</option>
                            <option value="viennaGame">Vienna Game</option>
                            <option value="kingsGambit">King&apos;s Gambit</option>
                            <option value="evansGambit">Evans Gambit</option>
                            <option value="danishGambit">Danish Gambit</option>
                            <option value="philidorDefense">Philidor Defense</option>
                            <option value="sicilian">Sicilian Defense</option>
                            <option value="caroKann">Caro-Kann Defense</option>
                            <option value="frenchDefense">French Defense</option>
                            <option value="alekhineDefense">Alekhine&apos;s Defense</option>
                            <option value="scandinavianDefense">Scandinavian Defense</option>
                            <option value="pircDefense">Pirc Defense</option>
                            <option value="modernDefense">Modern Defense</option>
                        </optgroup>
                        <optgroup label="1.d4 Openings">
                            <option value="queensGambit">Queen&apos;s Gambit</option>
                            <option value="londonSystem">London System</option>
                            <option value="slavDefense">Slav Defense</option>
                            <option value="kingsIndian">King&apos;s Indian Defense</option>
                            <option value="nimzoIndian">Nimzo-Indian Defense</option>
                            <option value="bogoIndian">Bogo-Indian Defense</option>
                            <option value="grunfeldDefense">Grünfeld Defense</option>
                            <option value="dutchDefense">Dutch Defense</option>
                            <option value="benoniDefense">Benoni Defense</option>
                            <option value="benkoGambit">Benko Gambit</option>
                            <option value="trompowskyAttack">Trompowsky Attack</option>
                            <option value="budapestGambit">Budapest Gambit</option>
                            <option value="catalanOpening">Catalan Opening</option>
                        </optgroup>
                        <optgroup label="Other Openings">
                            <option value="englishOpening">English Opening</option>
                            <option value="retiOpening">Réti Opening</option>
                            <option value="kingsIndianAttack">King&apos;s Indian Attack</option>
                            <option value="birdsOpening">Bird&apos;s Opening</option>
                        </optgroup>
                    </select>
                </div>
                
                <div className="side-selection">
                    <button 
                        className="select-side-btn white" 
                        onClick={() => onSelectColor('w', selectedOpening)}
                    >
                        <span className="side-icon">♔</span>
                        Play as White
                    </button>
                    <button 
                        className="select-side-btn black" 
                        onClick={() => onSelectColor('b', selectedOpening)}
                    >
                        <span className="side-icon">♚</span>
                        Play as Black
                    </button>
                </div>
                
                <button className="cancel-btn" onClick={onClose}>
                    Cancel
                </button>
            </div>
            
            <style jsx>{`
                .game-over-content {
                    color: #bfdbfe;
                }
                .game-over-badge {
                    color: #93c5fd;
                }
                h2 {
                    color: #60a5fa;
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.55);
                }
                .side-selection {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    width: 100%;
                    margin-bottom: 20px;
                }
                .opening-selection {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    width: 100%;
                    margin: 8px 0 20px;
                    text-align: left;
                }
                .opening-selection label {
                    color: #bfdbfe;
                    font-size: 0.9rem;
                    font-weight: 600;
                }
                .opening-selection select {
                    border-radius: 10px;
                    border: 1px solid rgba(255, 255, 255, 0.18);
                    background: rgba(15, 23, 42, 0.8);
                    color: #eff6ff;
                    padding: 10px 12px;
                    font-size: 0.95rem;
                    font-family: inherit;
                }
                .select-side-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    padding: 14px;
                    border-radius: 12px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    font-family: inherit;
                }
                .select-side-btn.white {
                    background: linear-gradient(135deg, #ffffff, #e0e0e0);
                    color: #222;
                }
                .select-side-btn.black {
                    background: linear-gradient(135deg, #333333, #111111);
                    color: #fff;
                    border-color: rgba(255, 255, 255, 0.05);
                }
                .select-side-btn:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
                    filter: brightness(1.05);
                }
                .select-side-btn:active {
                    transform: translateY(-1px);
                }
                .side-icon {
                    font-size: 1.4rem;
                }
                .cancel-btn {
                    background: transparent;
                    border: none;
                    color: #93c5fd;
                    font-size: 0.9rem;
                    cursor: pointer;
                    text-decoration: underline;
                    transition: color 0.2s;
                }
                .cancel-btn:hover {
                    color: #dbeafe;
                }
            `}</style>
        </div>
    );
};

export default NewGameModal;
