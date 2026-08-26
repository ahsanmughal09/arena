import React, { useEffect } from 'react';
import { sounds } from '../utils/audio';

export default function ExtraTurnBanner({ notice, onClose }) {
  useEffect(() => {
    if (notice) {
      sounds.playExtraTurn();
      const timer = setTimeout(() => {
        if (onClose) onClose();
      }, 2400);
      return () => clearTimeout(timer);
    }
  }, [notice]);

  if (!notice) return null;

  const colorHexMap = {
    red: '#FF4757',
    green: '#2ED573',
    yellow: '#FFA502',
    blue: '#1E90FF',
    orange: '#FF6B81',
    purple: '#A55EEA'
  };

  const mainHex = colorHexMap[notice.color] || '#818CF8';

  return (
    <div style={{
      position: 'fixed',
      top: '70px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9995,
      pointerEvents: 'none',
      animation: 'extraTurnBounce 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
    }}>
      <div style={{
        background: `linear-gradient(135deg, ${mainHex}, #0F172A)`,
        border: `2px solid ${mainHex}`,
        borderRadius: '50px',
        padding: '10px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: `0 10px 30px rgba(0,0,0,0.8), 0 0 25px ${mainHex}90`,
        color: '#FFF'
      }}>
        <div style={{
          fontSize: '2rem',
          animation: 'spinPulse 0.8s ease-in-out infinite alternate'
        }}>
          {notice.icon || '🔥'}
        </div>

        <div>
          <div style={{
            fontSize: '1.1rem',
            fontWeight: 900,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            background: 'linear-gradient(135deg, #FFF, #FCD34D)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))'
          }}>
            {notice.title || 'EXTRA TURN!'}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#E2E8F0', fontWeight: 600 }}>
            {notice.subtitle}
          </div>
        </div>
      </div>
    </div>
  );
}
