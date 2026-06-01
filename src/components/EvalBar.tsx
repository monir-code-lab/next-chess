'use client';

import React, { useEffect, useState } from 'react';

interface EvalBarProps {
    score: number;
    mateIn: number | null;
}

function EvalBar({ score, mateIn }: EvalBarProps) {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth <= 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    let percentage = 50;
    let evalText = '0.0';
    let textColor = '#333';
    let textPos = '90%';

    if (mateIn !== null) {
        percentage = mateIn > 0 ? 100 : 0;
        evalText = `M${Math.abs(mateIn)}`;
        textColor = (mateIn < 0) ? '#eee' : '#333';
        textPos = (mateIn < 0) ? '10%' : '90%';
    } else {
        const clamped = Math.max(-10, Math.min(10, score));
        percentage = 50 + (clamped / 20) * 100; // Map -10/10 to 0/100
        evalText = (score > 0 ? '+' : '') + score.toFixed(1);
        if (percentage < 30) {
            textColor = '#eee';
            textPos = '15%';
        } else if (percentage > 70) {
            textColor = '#333';
            textPos = '85%';
        } else {
            textColor = '#888';
            textPos = '50%';
        }
    }

    const fillStyle = isMobile 
        ? { width: `${percentage}%`, height: '100%', transition: 'width 0.5s ease' }
        : { height: `${percentage}%`, width: '100%', transition: 'height 0.5s ease' };

    const textStyle = isMobile
        ? { left: textPos, top: '50%', transform: 'translate(-50%, -50%)', color: textColor }
        : { top: `calc(100% - ${textPos})`, left: '50%', transform: 'translate(-50%, -50%) rotate(-90deg)', color: textColor };

    return (
        <div className={`eval-bar-container ${isMobile ? 'horizontal' : ''}`}>
            <div className="eval-fill" style={fillStyle}></div>
            <div className="eval-text" style={textStyle}>
                {evalText}
            </div>
        </div>
    );
}

export default React.memo(EvalBar);