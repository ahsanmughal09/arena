import React, { useEffect } from 'react';
import { sounds } from '../utils/audio';

export default function ExtraTurnBanner({ notice, onClose }) {
  useEffect(() => {
    if (notice) {
      if (notice.isPenalty) {
        sounds.playCapture();
      } else {
        sounds.playExtraTurn();
      }
      const timer = setTimeout(() => {
        if (onClose) onClose();
      }, 1700);
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

  const mainHex = notice.isPenalty ? '#EF4444' : (colorHexMap[notice.color] || '#818CF8');

  return (
    <div 
      style={{
        position: 'fixed',
        top: '10px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        pointerEvents: 'none',
        animation: 'extraTurnSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        maxWidth: '92vw',
        userSelect: 'none'
      }}
    >
      <div 
        style={{
          background: notice.isPenalty 
            ? 'linear-gradient(135deg, rgba(127, 29, 29, 0.95), rgba(69, 10, 10, 0.98))' 
            : 'linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(30, 41, 59, 0.96))',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: `1.5px solid ${mainHex}`,
          borderRadius: '30px',
          padding: '5px 14px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: notice.isPenalty 
            ? '0 6px 20px rgba(239, 68, 68, 0.5), 0 0 12px rgba(220, 38, 38, 0.4)' 
            : `0 6px 20px rgba(0,0,0,0.7), 0 0 14px ${mainHex}70`,
          color: '#FFF',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}
      >
        <span style={{
          fontSize: '1.1rem',
          lineHeight: 1,
          animation: 'spinPulse 0.6s ease-in-out infinite alternate',
          pointerEvents: 'none',
          flexShrink: 0
        }}>
          {notice.icon || (notice.isPenalty ? '🚫' : '🔥')}
        </span>

        <span style={{
          fontSize: '0.8rem',
          fontWeight: 900,
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
          color: notice.isPenalty ? '#FCA5A5' : mainHex,
          pointerEvents: 'none',
          flexShrink: 0
        }}>
          {notice.title || (notice.isPenalty ? 'CANCELLED' : 'EXTRA TURN')}
        </span>

        <span style={{
          fontSize: '0.75rem',
          color: '#E2E8F0',
          fontWeight: 600,
          pointerEvents: 'none',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          • {notice.subtitle}
        </span>
      </div>
    </div>
  );
}
