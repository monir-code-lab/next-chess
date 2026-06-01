'use client';

import React, { useMemo, useState } from 'react';
import MiniBoard from './MiniBoard';
import MoveEvaluation from './MoveEvaluation';
import { getBoardStateFromFen } from '../utils/chessLogic';
import { buildMovePairs } from '@/features/chess/domain/moveHistory';
import { HistorySnapshot, MoveRecord } from '@/features/chess/types/chess';

export type { MoveRecord };

interface HistoryPanelProps {
  moveHistory: readonly MoveRecord[];
  historySnapshots: readonly HistorySnapshot[];
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

function HistoryPanel({
  moveHistory,
  historySnapshots,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: HistoryPanelProps) {
  const [hoveredMove, setHoveredMove] = useState<{ index: number; x: number; y: number } | null>(
    null
  );
  const movePairs = useMemo(() => buildMovePairs(moveHistory), [moveHistory]);
  const previewIndex = hoveredMove?.index ?? -1;
  const previewSnapshot = useMemo(
    () => (previewIndex >= 0 ? historySnapshots[previewIndex + 1] ?? null : null),
    [historySnapshots, previewIndex]
  );
  const previewBoardState = useMemo(
    () => (previewSnapshot ? getBoardStateFromFen(previewSnapshot.fen) : null),
    [previewSnapshot]
  );

  const handleMouseEnter = (index: number, event: React.MouseEvent) => {
    setHoveredMove({ index, x: event.clientX, y: event.clientY });
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!hoveredMove) {
      return;
    }

    setHoveredMove((previousValue) =>
      previousValue ? { ...previousValue, x: event.clientX, y: event.clientY } : null
    );
  };

  const handleMouseLeave = () => {
    setHoveredMove(null);
  };

  return (
    <div className="history-panel" onMouseMove={handleMouseMove}>
      <div className="history-panel-header">
        <h2>Move History</h2>
      </div>

      <div className="history-list" id="historyList">
        {movePairs.map((pair) => (
          <div key={pair.number} className="history-row">
            <span className="move-number">{pair.number}.</span>
            <span
              className="move white"
              onMouseEnter={(event) => handleMouseEnter(pair.white.index, event)}
              onMouseLeave={handleMouseLeave}
            >
              <span className="notation">{pair.white.san}</span>
              {pair.white.cpLoss !== undefined && <MoveEvaluation cpLoss={pair.white.cpLoss} />}
            </span>
            {pair.black && (
              <span
                className="move black"
                onMouseEnter={(event) => handleMouseEnter(pair.black!.index, event)}
                onMouseLeave={handleMouseLeave}
              >
                <span className="notation">{pair.black!.san}</span>
                {pair.black!.cpLoss !== undefined && <MoveEvaluation cpLoss={pair.black!.cpLoss} />}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="history-panel-footer">
        <div className="timeline-controls">
          <button
            type="button"
            className="timeline-btn"
            onClick={onUndo}
            disabled={!canUndo}
            aria-label="Undo move"
          >
            Undo
          </button>
          <button
            type="button"
            className="timeline-btn"
            onClick={onRedo}
            disabled={!canRedo}
            aria-label="Redo move"
          >
            Redo
          </button>
        </div>
      </div>

      {hoveredMove && previewSnapshot && previewBoardState && (
        <div
          className="hover-preview"
          style={{
            left: hoveredMove.x + 20,
            top: hoveredMove.y - 80,
          }}
        >
          <div className="preview-label">Board Position</div>
          <MiniBoard boardState={previewBoardState} lastMoveSquares={previewSnapshot.lastMoveSquares} />
        </div>
      )}

      <style jsx>{`
        .history-panel-header {
          flex-shrink: 0;
        }
        .history-panel-footer {
          flex-shrink: 0;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }
        .timeline-controls {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
          width: 100%;
        }
        .timeline-btn {
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 8px;
          background: rgba(15, 23, 42, 0.85);
          color: #e2e8f0;
          cursor: pointer;
          font-size: 0.8rem;
          font-weight: 600;
          padding: 6px 10px;
          width: 100%;
          transition: transform 0.15s ease, opacity 0.15s ease, border-color 0.15s ease;
        }
        .timeline-btn:hover:enabled {
          transform: translateY(-1px);
          border-color: rgba(255, 255, 255, 0.24);
        }
        .timeline-btn:disabled {
          cursor: not-allowed;
          opacity: 0.45;
        }
        .hover-preview {
          position: fixed;
          z-index: 1000;
          pointer-events: none;
          background: rgba(30, 30, 30, 0.9);
          backdrop-filter: blur(8px);
          padding: 8px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 12px 48px rgba(0, 0, 0, 0.5);
          animation: fadeIn 0.15s ease-out;
        }
        .preview-label {
          font-size: 0.7rem;
          color: #888;
          margin-bottom: 4px;
          text-align: center;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .move {
          cursor: help;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: 8px;
          min-height: 24px;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}

export default React.memo(HistoryPanel);
