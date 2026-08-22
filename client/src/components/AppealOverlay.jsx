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

  // 1. Non-Blocking Floating Appeal Button (Active until next player rolls dice)
  if (!inDemo && canAppealLastTurn) {
    const isOffender = myColor === lastTurnOffendingColor;
    const canAppeal = !isOffender && (playerAppealsLeft > 0);

    return (
      <div style={{
        position: 'absolute',
        top: '15px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        animation: 'fadeIn 0.2s ease-out'
      }}>
        <div style={{
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1.5px solid rgba(245, 158, 11, 0.6)',
          borderRadius: '16px',
          padding: '8px 20px',
          color: '#F8FAFC',
          fontSize: '13px',
          fontWeight: '700',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{ fontSize: '18px' }}>⚖️</span>
          <span>{isOffender ? `Your Turn (${lastTurnOffendingColor?.toUpperCase()}) Is Appealable` : 'Missed Kill Opportunity?'}</span>

          {canAppeal ? (
            <button
              onClick={onSubmitAppeal}
              style={{
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '10px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: '900',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              Appeal Turn (⚖️ {playerAppealsLeft} Left)
            </button>
          ) : isOffender ? (
            <span style={{ fontSize: '11px', color: '#CBD5E1', fontWeight: 600, background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '8px' }}>
              Opponents may appeal until next roll
            </span>
          ) : null}
        </div>
      </div>
    );
  }

  // 2. Demonstration Mode (10 seconds)
  if (inDemo) {
    const isAppealer = myColor === appealingColor;

    return (
      <div style={{
        position: 'absolute',
        top: '15px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px',
        animation: 'fadeIn 0.2s ease-out'
      }}>
        <div style={{
          background: isAppealer 
            ? 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)' 
            : 'rgba(15, 23, 42, 0.95)',
          border: '2px solid #818CF8',
          borderRadius: '20px',
          padding: '10px 24px',
          color: '#F8FAFC',
          boxShadow: '0 10px 30px rgba(99, 102, 241, 0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{ fontSize: '22px' }}>⚖️</span>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '14px', fontWeight: '900', color: '#818CF8' }}>
              DEMONSTRATION MODE ({demoTimeLeft || 10}s)
            </span>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#E2E8F0' }}>
              {isAppealer 
                ? `Click ${offendingColor?.toUpperCase()}'s token to demonstrate missed kill!` 
                : `${appealingColor?.toUpperCase()} is demonstrating a missed kill by ${offendingColor?.toUpperCase()}...`}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
