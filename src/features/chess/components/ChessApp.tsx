'use client';

import { memo, useCallback, useMemo } from 'react';
import ChessBoard from '@/components/ChessBoard';
import EvalBar from '@/components/EvalBar';
import GameOverModal from '@/components/GameOverModal';
import HistoryPanel from '@/components/HistoryPanel';
import NewGameModal from '@/components/NewGameModal';
import HintPanel from './HintPanel';
import { useChessGame } from '../hooks/useChessGame';

const StableHeader = memo(() => (
  <div className="header">
    <h1>
      <span className="logo-light">ch</span>
      <span className="logo-bold">ess</span>
    </h1>
  </div>
));
StableHeader.displayName = 'StableHeader';

const MemoizedEvalBar = memo(EvalBar);
const MemoizedChessBoard = memo(ChessBoard);
const MemoizedGameOverModal = memo(GameOverModal);
const MemoizedNewGameModal = memo(NewGameModal);
const MemoizedHistoryPanel = memo(HistoryPanel);

export default function ChessApp() {
  const {
    gameState,
    historySnapshots,
    playerColor,
    aiDepth,
    engineMode,
    evalScore,
    mateIn,
    progressActive,
    progressValue,
    hintMoves,
    hintError,
    isHintLoading,
    showNewGameModal,
    canUndo,
    canRedo,
    possibleMoveCount,
    setAiDepth,
    setEngineMode,
    setShowNewGameModal,
    executeMove,
    undoMove,
    redoMove,
    requestHint,
    handleNewGame,
    letterCoords,
    numberCoords,
  } = useChessGame();

  const letterCoordNodes = useMemo(
    () => letterCoords.map((file) => <span key={file}>{file}</span>),
    [letterCoords]
  );
  const numberCoordNodes = useMemo(
    () => numberCoords.map((value) => <span key={value}>{value}</span>),
    [numberCoords]
  );
  const canRequestHint = useMemo(
    () => gameState.turn === playerColor,
    [gameState.turn, playerColor]
  );
  const progressStyle = useMemo(() => ({ width: `${progressValue}%` }), [progressValue]);

  const handleCloseModal = useCallback(() => {
    setShowNewGameModal(false);
  }, [setShowNewGameModal]);

  const handleShowModal = useCallback(() => {
    setShowNewGameModal(true);
  }, [setShowNewGameModal]);

  return (
    <div className="container">
      <StableHeader />
      <div className="main-content">
        <div className="side-panel left-panel">
          <div className="move-counter-card">
            <h3 className="move-counter-label">
              {gameState.result
                ? 'Available Options'
                : gameState.turn === playerColor
                  ? 'Your Options'
                  : "Opponent's Options"}
            </h3>
            <div className="move-counter-value-row">
              <span className="move-counter-value">{possibleMoveCount}</span>
              <span className="move-counter-meta">legal moves</span>
            </div>
          </div>
          <HintPanel
            isThinking={isHintLoading}
            error={hintError}
            hints={hintMoves}
            canRequestHint={canRequestHint}
            onRequestHint={requestHint}
          />
        </div>

        <div className="board-container">
          <MemoizedEvalBar score={evalScore} mateIn={mateIn} />

          <div className="board-wrapper">
            <div className={`progress-container ${progressActive ? 'active' : ''}`}>
              <div className="progress-bar" style={progressStyle}></div>
            </div>
            <div className="coordinates letters top">{letterCoordNodes}</div>
            <div className="board-middle">
              <div className="coordinates numbers left">{numberCoordNodes}</div>
              <MemoizedChessBoard
                fen={gameState.fen}
                currentTurn={gameState.turn}
                onMove={executeMove}
                lastMoveSquares={gameState.lastMoveSquares}
                playerColor={playerColor}
              />
            </div>
            {gameState.result && (
              <MemoizedGameOverModal
                winner={gameState.result.winner}
                reason={gameState.result.reason}
                onNewGame={handleNewGame}
              />
            )}
            {showNewGameModal && (
              <MemoizedNewGameModal
                onSelectColor={handleNewGame}
                onClose={handleCloseModal}
                aiDepth={aiDepth}
                setAiDepth={setAiDepth}
                engineMode={engineMode}
                setEngineMode={setEngineMode}
                playerColor={playerColor}
              />
            )}
            <div className="coordinates letters bottom">{letterCoordNodes}</div>
          </div>
        </div>
        <div className="side-panel">
          <MemoizedHistoryPanel
            moveHistory={gameState.moveHistory}
            historySnapshots={historySnapshots}
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={undoMove}
            onRedo={redoMove}
          />
          <button className="start-match-btn" onClick={handleShowModal}>
            Play_Match
          </button>
        </div>
      </div>

      <style jsx>{`
        .move-counter-card {
          background: linear-gradient(145deg, #1f1f1f, #151515);
          border: 1px solid #333;
          border-radius: 12px;
          padding: 14px 16px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .move-counter-label {
          color: #8b9bb3;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }
        .move-counter-value-row {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          flex-wrap: wrap;
        }
        .move-counter-value {
          color: #ffffff;
          font-size: 2rem;
          font-weight: 800;
          line-height: 1;
        }
        .move-counter-meta {
          color: #6b7280;
          font-size: 0.88rem;
          line-height: 1.1;
          padding-bottom: 3px;
        }
      `}</style>
    </div>
  );
}
