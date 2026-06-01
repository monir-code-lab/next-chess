'use client';

import React from 'react';
import { HintMove } from '../types/hint';

interface HintPanelProps {
  isThinking: boolean;
  error: string | null;
  hints: HintMove[];
  canRequestHint: boolean;
  onRequestHint: () => void;
}

function HintPanelComponent({ isThinking, error, hints, canRequestHint, onRequestHint }: HintPanelProps) {
  return (
    <div className="hint-panel">
      <h2>Hint Box</h2>
      <div className="hint-content">
        {isThinking ? (
          <p className="hint-text loading">Analyzing...</p>
        ) : hints.length > 0 ? (
          <div className="hint-text">
            {hints.map((hint) => (
              <p key={hint.rank}>
                {hint.rank}. {hint.move}{' '}
                {hint.mateIn !== null
                  ? `(Mate in ${Math.abs(hint.mateIn)})`
                  : hint.evaluation !== null
                    ? `(${hint.evaluation >= 0 ? '+' : ''}${hint.evaluation.toFixed(2)})`
                    : ''}
              </p>
            ))}
          </div>
        ) : error ? (
          <p className="hint-text">{error}</p>
        ) : (
          <p className="hint-empty">Click for a hint</p>
        )}
      </div>
      <button className="btn hint-btn" onClick={onRequestHint} disabled={!canRequestHint || isThinking}>
        Get Hint
      </button>
    </div>
  );
}

const HintPanel = React.memo(HintPanelComponent);

export default HintPanel;