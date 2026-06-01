'use client';
export type MoveJudgment = 'excellent' | 'good' | 'inaccurate' | 'mistake' | 'blunder';

interface MoveEvaluationProps {
    cpLoss: number;
}

const getJudgment = (cpLoss: number): { label: string; type: MoveJudgment; icon: string } => {
    if (cpLoss < 20) return { label: 'Ex', type: 'excellent', icon: '!!' };
    if (cpLoss < 50) return { label: 'Gd', type: 'good', icon: '!' };
    if (cpLoss < 120) return { label: 'Ia', type: 'inaccurate', icon: '?!' };
    if (cpLoss < 250) return { label: 'Mt', type: 'mistake', icon: '?' };
    return { label: 'Br', type: 'blunder', icon: '??' };
};

export default function MoveEvaluation({ cpLoss }: MoveEvaluationProps) {
    const { label, type, icon } = getJudgment(cpLoss);

    return (
        <span className={`move-evaluation ${type}`} title={`${label} (CP Loss: ${cpLoss.toFixed(0)})`}>
            <span className="eval-icon">{icon}</span>
            <span className="eval-label">{label}</span>

            <style jsx>{`
                .move-evaluation {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    margin-left: 8px;
                    cursor: default;
                    transition: all 0.2s ease;
                    text-transform: capitalize;
                    letter-spacing: 0.5px;
                }

                .eval-icon {
                    font-family: 'Courier New', monospace;
                    font-weight: 900;
                }

                .excellent {
                    background: rgba(34, 197, 94, 0.15);
                    color: #22c55e;
                    border: 1px solid rgba(34, 197, 94, 0.3);
                }
                .excellent:hover {
                    background: rgba(34, 197, 94, 0.25);
                    box-shadow: 0 0 12px rgba(34, 197, 94, 0.3);
                }

                .good {
                    background: rgba(59, 130, 246, 0.15);
                    color: #3b82f6;
                    border: 1px solid rgba(59, 130, 246, 0.3);
                }
                .good:hover {
                    background: rgba(59, 130, 246, 0.25);
                    box-shadow: 0 0 12px rgba(59, 130, 246, 0.3);
                }

                .inaccurate {
                    background: rgba(234, 179, 8, 0.15);
                    color: #eab308;
                    border: 1px solid rgba(234, 179, 8, 0.3);
                }
                .inaccurate:hover {
                    background: rgba(234, 179, 8, 0.25);
                    box-shadow: 0 0 12px rgba(234, 179, 8, 0.3);
                }

                .mistake {
                    background: rgba(249, 115, 22, 0.15);
                    color: #f97316;
                    border: 1px solid rgba(249, 115, 22, 0.3);
                }
                .mistake:hover {
                    background: rgba(249, 115, 22, 0.25);
                    box-shadow: 0 0 12px rgba(249, 115, 22, 0.3);
                }

                .blunder {
                    background: rgba(239, 68, 68, 0.15);
                    color: #ef4444;
                    border: 1px solid rgba(239, 68, 68, 0.3);
                }
                .blunder:hover {
                    background: rgba(239, 68, 68, 0.25);
                    box-shadow: 0 0 12px rgba(239, 68, 68, 0.3);
                }

                @media (max-width: 480px) {
                    .eval-label {
                        display: none;
                    }
                    .move-evaluation {
                        padding: 2px 4px;
                    }
                }
            `}</style>
        </span>
    );
}
