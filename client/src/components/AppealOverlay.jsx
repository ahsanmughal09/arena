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

  // 1. Non-Blocking Right-Side Appeal Card (Active until next player rolls dice)
  if (!inDemo && canAppealLastTurn) {
    const isOffender = myColor === lastTurnOffendingColor;
    const canAppeal = !isOffender && (playerAppealsLeft > 0);

    return (
      <div 
        className="glass-panel" 
        style={{
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          border: '1.5px solid rgba(245, 158, 11, 0.6)',
          boxShadow: '0 6px 20px rgba(245, 158, 11, 0.2)',
          flexShrink: 0,
          animation: 'fadeIn 0.2s ease-out'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.2rem' }}>⚖️</span>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Missed Kill Appeal
          </h3>
        </div>

        <span style={{ fontSize: '0.78rem', color: '#E2E8F0', textAlign: 'center', fontWeight: 600 }}>
          {isOffender 
            ? `Your turn (${lastTurnOffendingColor?.toUpperCase()}) is appealable until next roll.` 
            : 'Opponent may have missed a kill opportunity!'}
        </span>

        {canAppeal && (
          <button
            onClick={onSubmitAppeal}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              padding: '8px 14px',
              fontSize: '0.82rem',
              fontWeight: '900',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            ⚖️ Click to Appeal ({playerAppealsLeft} Left)
          </button>
        )}
      </div>
    );
  }

  // 2. Demonstration Mode Timer & Status Card (Right-Side Section)
  if (inDemo) {
    const appealingColor = appealState?.appealingColor;
    const offendingColor = appealState?.offendingColor;
    const demoTimeLeft = appealState?.demoTimeLeft;
    const isAppealer = myColor === appealingColor;

    return (
      <div 
        className="glass-panel" 
        style={{
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          background: isAppealer 
            ? 'linear-gradient(135deg, rgba(30, 27, 75, 0.95), rgba(49, 46, 129, 0.95))' 
            : 'rgba(15, 23, 42, 0.95)',
          border: '1.5px solid #818CF8',
          boxShadow: '0 8px 25px rgba(99, 102, 241, 0.3)',
          flexShrink: 0,
          animation: 'fadeIn 0.2s ease-out'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.2rem', animation: 'pulse 1s infinite' }}>⏳</span>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 900, color: '#818CF8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            DEMO TIMER: <span style={{ color: '#2ED573', fontSize: '1rem' }}>{demoTimeLeft ?? 10}s</span>
          </h3>
        </div>

        <span style={{ fontSize: '0.78rem', fontWeight: '600', color: '#E2E8F0', textAlign: 'center' }}>
          {isAppealer 
            ? `Tap ${offendingColor?.toUpperCase()}'s token on the board to prove missed kill!` 
            : `${appealingColor?.toUpperCase()} is demonstrating missed kill by ${offendingColor?.toUpperCase()}...`}
        </span>
      </div>
    );
  }

  return null;
}
