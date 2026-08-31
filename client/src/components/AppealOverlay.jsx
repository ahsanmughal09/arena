import React from 'react';

export default function AppealOverlay({ 
  appealState, 
  canAppealLastTurn,
  lastTurnOffendingColor,
  myColor, 
  playerAppealsLeft, 
  onSubmitAppeal 
}) {
  const inDemo = appealState?.inDemo;

  // 1. Non-Blocking Fixed Floating Toast (Takes 0px document height, NEVER shrinks the board)
  if (!inDemo && canAppealLastTurn) {
    const isOffender = myColor === lastTurnOffendingColor;
    const canAppeal = !isOffender && (playerAppealsLeft > 0);

    return (
      <div 
        style={{
          position: 'fixed',
          top: '48px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 150,
          pointerEvents: 'auto',
          width: '90%',
          maxWidth: '440px',
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.96), rgba(180, 83, 9, 0.96))',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderRadius: '24px',
          border: '1.5px solid rgba(254, 240, 138, 0.8)',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6), 0 0 15px rgba(245, 158, 11, 0.5)',
          padding: '5px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          color: '#FFF',
          animation: 'slideDown 0.2s ease-out',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
          <span style={{ fontSize: '1.1rem' }}>⚖️</span>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase', color: '#FEF08A' }}>
              Missed Kill
            </span>
            <span style={{ fontSize: '0.65rem', color: '#FEF9C3', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 600 }}>
              {isOffender ? 'Your turn is appealable.' : `${lastTurnOffendingColor?.toUpperCase()} missed a kill!`}
            </span>
          </div>
        </div>

        {canAppeal && (
          <button
            onClick={onSubmitAppeal}
            style={{
              background: '#FFFFFF',
              color: '#B45309',
              border: 'none',
              borderRadius: '20px',
              padding: '4px 10px',
              fontSize: '0.72rem',
              fontWeight: 900,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              flexShrink: 0,
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.04)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            ⚡ Appeal ({playerAppealsLeft})
          </button>
        )}
      </div>
    );
  }

  // 2. Demonstration Mode Fixed Floating Toast
  if (inDemo) {
    const appealingColor = appealState?.appealingColor;
    const offendingColor = appealState?.offendingColor;
    const demoTimeLeft = appealState?.demoTimeLeft;
    const isAppealer = myColor === appealingColor;

    return (
      <div 
        style={{
          position: 'fixed',
          top: '48px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 150,
          pointerEvents: 'auto',
          width: '90%',
          maxWidth: '440px',
          background: isAppealer 
            ? 'linear-gradient(135deg, rgba(79, 70, 229, 0.96), rgba(99, 102, 241, 0.96))'
            : 'linear-gradient(135deg, rgba(30, 41, 59, 0.96), rgba(15, 23, 42, 0.96))',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderRadius: '24px',
          border: isAppealer ? '1.5px solid #C7D2FE' : '1.5px solid rgba(255,255,255,0.2)',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6), 0 0 15px rgba(99, 102, 241, 0.4)',
          padding: '5px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          color: '#FFF',
          animation: 'slideDown 0.2s ease-out',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
          <span style={{ fontSize: '1.1rem', animation: 'pulse 1s infinite' }}>⏳</span>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase', color: '#E0E7FF' }}>
              Appeal Demo
            </span>
            <span style={{ fontSize: '0.65rem', color: '#C7D2FE', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 600 }}>
              {isAppealer 
                ? `Tap ${offendingColor?.toUpperCase()}'s token to prove kill!` 
                : `${appealingColor?.toUpperCase()} proving kill on ${offendingColor?.toUpperCase()}...`}
            </span>
          </div>
        </div>

        <div style={{
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(255,255,255,0.25)',
          padding: '3px 8px',
          borderRadius: '12px',
          fontSize: '0.8rem',
          fontWeight: 900,
          color: demoTimeLeft <= 5 ? '#FF4757' : '#2ED573',
          flexShrink: 0
        }}>
          {demoTimeLeft ?? 10}s
        </div>
      </div>
    );
  }

  return null;
}
