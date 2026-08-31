import React, { useState, useEffect } from 'react';
import { sounds } from '../utils/audio';

const COLOR_HEX = {
  red: '#FF4757',
  green: '#2ED573',
  yellow: '#FFA502',
  blue: '#1E90FF'
};

const COLOR_BG_GRADIENT = {
  red: 'linear-gradient(135deg, rgba(255, 71, 87, 0.22), rgba(15, 23, 42, 0.95))',
  green: 'linear-gradient(135deg, rgba(46, 213, 115, 0.22), rgba(15, 23, 42, 0.95))',
  yellow: 'linear-gradient(135deg, rgba(255, 165, 2, 0.22), rgba(15, 23, 42, 0.95))',
  blue: 'linear-gradient(135deg, rgba(30, 144, 255, 0.22), rgba(15, 23, 42, 0.95))'
};

function SpaciousDiceCube({ val, rolling, isMyTurn, canRoll, showingSixDelay, theme = 'standard', size = 34 }) {
  const getDiceDots = (num) => {
    switch (num) {
      case 1: return [{ x: 50, y: 50 }];
      case 2: return [{ x: 30, y: 30 }, { x: 70, y: 70 }];
      case 3: return [{ x: 25, y: 25 }, { x: 50, y: 50 }, { x: 75, y: 75 }];
      case 4: return [{ x: 30, y: 30 }, { x: 70, y: 30 }, { x: 30, y: 70 }, { x: 70, y: 70 }];
      case 5: return [{ x: 25, y: 25 }, { x: 75, y: 25 }, { x: 50, y: 50 }, { x: 25, y: 75 }, { x: 75, y: 75 }];
      case 6: return [{ x: 30, y: 25 }, { x: 30, y: 50 }, { x: 30, y: 75 }, { x: 70, y: 25 }, { x: 70, y: 50 }, { x: 70, y: 75 }];
      default: return [{ x: 50, y: 50 }];
    }
  };

  let bg = (isMyTurn && canRoll && !showingSixDelay) ? 'linear-gradient(145deg, #FFFFFF, #E2E8F0)' : '#1E293B';
  let border = (isMyTurn && canRoll && !showingSixDelay) ? '2px solid #6366F1' : '1.5px solid rgba(255,255,255,0.25)';
  let dotFill = (isMyTurn && canRoll && !showingSixDelay) ? '#0F172A' : '#F8FAFC';
  let shadow = (isMyTurn && canRoll && !showingSixDelay) ? '0 0 12px rgba(99, 102, 241, 0.8), inset 0 1px 2px #FFF' : '0 2px 5px rgba(0,0,0,0.3)';

  if (theme === 'purple') {
    bg = 'linear-gradient(145deg, #A855F7, #6B21A8)';
    border = '1.5px solid #E9D5FF';
    dotFill = '#FFFFFF';
    shadow = '0 0 10px rgba(168, 85, 247, 0.5)';
  } else if (theme === 'white') {
    bg = 'linear-gradient(145deg, #FFFFFF, #E2E8F0)';
    border = '1.5px solid #94A3B8';
    dotFill = '#0F172A';
  }

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '8px',
        background: bg,
        border,
        boxShadow: shadow,
        transform: rolling ? 'rotate(360deg) scale(1.12)' : 'scale(1)',
        transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        cursor: (isMyTurn && canRoll && !showingSixDelay) ? 'pointer' : 'default',
        touchAction: 'manipulation',
        flexShrink: 0,
        position: 'relative'
      }}
    >
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
        {val && getDiceDots(val).map((dot, idx) => (
          <circle key={`sd-${idx}`} cx={dot.x} cy={dot.y} r="8.5" fill={dotFill} />
        ))}
        {!val && !rolling && (
          <text x="50" y="62" fill={(isMyTurn && canRoll) ? '#4F46E5' : '#94A3B8'} fontSize="32" fontWeight="900" textAnchor="middle">
            🎲
          </text>
        )}
      </svg>
    </div>
  );
}

export default function MiniCornerPod({
  color,
  player,
  teamName,
  isMe,
  isActive,
  isMyTurn,
  gameState,
  onRollDice,
  onSelectRoll,
  onOpenThrowMenu,
  onSubmitAppeal
}) {
  const [rolling, setRolling] = useState(false);
  const [showingSixDelay, setShowingSixDelay] = useState(false);

  const colorHex = COLOR_HEX[color] || '#818CF8';
  const playerName = player ? player.name : `Empty (${color.toUpperCase()})`;
  const isConnected = player && player.connected;
  const canThrowAtPlayer = isConnected && !isMe;

  const currentDice = gameState?.currentDice;
  const dicePool = gameState?.dicePool || [];
  const selectedRollIndex = gameState?.selectedRollIndex || 0;
  const canRoll = gameState?.canRoll;
  const diceCount = gameState?.customRules?.diceCount || 1;
  const isDualDice = (diceCount === 2) || Array.isArray(currentDice);
  const timeLeft = gameState?.timeLeft;

  useEffect(() => {
    let timer;
    const hasSix = Array.isArray(currentDice) ? currentDice.includes(6) : (currentDice === 6);
    if (canRoll && hasSix && !rolling) {
      setShowingSixDelay(true);
      timer = setTimeout(() => setShowingSixDelay(false), 800);
    }
    return () => {
      if (timer) clearTimeout(timer);
      setShowingSixDelay(false);
    };
  }, [currentDice, canRoll, dicePool.length, rolling]);

  const handleRollClick = (selectedIdx = 0) => {
    if (!isMyTurn || !canRoll || rolling || showingSixDelay) return;
    setRolling(true);
    sounds.playDiceRoll();

    setTimeout(() => {
      if (onRollDice) onRollDice(selectedIdx);
      setRolling(false);
    }, 500);
  };

  let displayVal1 = null;
  let displayVal2 = null;
  let displayDiceVal = null;
  const isReadyToRoll = canRoll && !showingSixDelay && !rolling;

  if (isDualDice) {
    if (isReadyToRoll) {
      displayVal1 = null;
      displayVal2 = null;
    } else if (Array.isArray(currentDice)) {
      displayVal1 = currentDice[0] !== undefined ? currentDice[0] : null;
      displayVal2 = currentDice[1] !== undefined ? currentDice[1] : null;
    } else {
      displayVal1 = dicePool[0] !== undefined ? dicePool[0] : null;
      displayVal2 = dicePool[1] !== undefined ? dicePool[1] : null;
    }
  } else {
    displayDiceVal = isReadyToRoll ? null : ((currentDice !== null && currentDice !== undefined) ? currentDice : (dicePool[selectedRollIndex] || null));
  }

  const showBalance = !gameState?.isHomeDiceSelectionMode && dicePool && dicePool.length > 1;

  const canAppealLastTurn = gameState?.canAppealLastTurn;
  const lastTurnOffendingColor = gameState?.lastTurnOffendingColor;
  const myAppealsLeft = gameState?.players?.[gameState?.myColor || (isMe ? color : '')]?.appealsLeft ?? 3;
  const amIOffender = lastTurnOffendingColor && ((isMe && color === lastTurnOffendingColor) || (gameState?.myColor === lastTurnOffendingColor));
  const isThisPodOffender = (lastTurnOffendingColor === color);
  
  // Show Appeal button on player's own pod AND on the offending player's pod
  const canAppeal = canAppealLastTurn && !amIOffender && myAppealsLeft > 0 && (isMe || isThisPodOffender);
  
  const inDemo = gameState?.appealState?.inDemo;
  const demoTimeLeft = gameState?.appealState?.demoTimeLeft;
  const isAppealingColor = gameState?.appealState?.appealingColor === color;
  const isOffendingColor = gameState?.appealState?.offendingColor === color;

  return (
    <div
      data-corner-pod={color}
      className={`mini-corner-pod ${isActive ? 'pod-active' : ''} ${isMyTurn ? 'my-pod-active' : ''}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: isActive ? COLOR_BG_GRADIENT[color] : 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: '14px',
        border: isMyTurn 
          ? '2.5px solid #2ED573' 
          : (isActive ? `2.5px solid ${colorHex}` : (isThisPodOffender && canAppealLastTurn) ? '2px solid #F59E0B' : '1px solid rgba(255, 255, 255, 0.12)'),
        boxShadow: isMyTurn
          ? `0 0 22px rgba(46, 213, 115, 0.8), 0 0 10px ${colorHex}A0`
          : (isActive ? `0 0 18px ${colorHex}80, 0 8px 24px rgba(0,0,0,0.5)` : (isThisPodOffender && canAppealLastTurn) ? '0 0 16px rgba(245, 158, 11, 0.6)' : '0 4px 12px rgba(0,0,0,0.35)'),
        padding: '5px 8px',
        color: '#FFF',
        userSelect: 'none',
        position: 'relative',
        boxSizing: 'border-box',
        width: '100%',
        transition: 'all 0.25s ease'
      }}
    >
      {/* 1st Line: Left = User Name, (YOU), 🎯 Throw | Right = ⚖️ Appeal / ⏳ Demo / TURN */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '6px' }}>
        
        {/* Top Left: Avatar Dot, Player Name, (YOU), 🎯 Throw */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: 0, overflow: 'hidden' }}>
          <div style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: isConnected ? (isMyTurn ? '#2ED573' : colorHex) : '#64748B',
            boxShadow: isConnected ? `0 0 6px ${isMyTurn ? '#2ED573' : colorHex}` : 'none',
            flexShrink: 0
          }} />
          <span style={{
            fontWeight: 800,
            fontSize: '0.8rem',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            color: isActive ? colorHex : isConnected ? '#F8FAFC' : '#94A3B8',
            maxWidth: '90px'
          }}>
            {playerName}
          </span>
          {isMe && (
            <span style={{
              background: 'rgba(255, 255, 255, 0.15)',
              color: '#F8FAFC',
              fontSize: '0.6rem',
              fontWeight: 800,
              padding: '1px 4px',
              borderRadius: '4px',
              flexShrink: 0
            }}>
              YOU
            </span>
          )}
          {canThrowAtPlayer && onOpenThrowMenu && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenThrowMenu(color, playerName);
              }}
              title={`Throw item at ${playerName}`}
              style={{
                background: 'rgba(255, 255, 255, 0.14)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                borderRadius: '5px',
                color: '#FFF',
                fontSize: '0.7rem',
                padding: '1px 4px',
                cursor: 'pointer',
                lineHeight: 1,
                flexShrink: 0,
                transition: 'all 0.15s ease'
              }}
            >
              🎯
            </button>
          )}
        </div>

        {/* Top Right: ⚖️ Appeal / ⏳ Demo / TURN badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          {canAppeal && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onSubmitAppeal) onSubmitAppeal();
              }}
              title="Appeal missed kill!"
              style={{
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                border: '1px solid #FEF08A',
                borderRadius: '16px',
                color: '#FFFFFF',
                fontSize: '0.65rem',
                padding: '2px 7px',
                cursor: 'pointer',
                fontWeight: 900,
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                boxShadow: '0 0 10px rgba(245, 158, 11, 0.85)',
                animation: 'pulse 1s infinite',
                flexShrink: 0,
                whiteSpace: 'nowrap'
              }}
            >
              <span>⚖️</span>
              <span>Appeal</span>
            </button>
          )}

          {inDemo && (isAppealingColor || isOffendingColor) && (
            <span style={{
              background: '#4F46E5',
              border: '1px solid #C7D2FE',
              borderRadius: '6px',
              color: '#FFF',
              fontSize: '0.62rem',
              fontWeight: 900,
              padding: '1px 5px',
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              flexShrink: 0
            }}>
              ⏳ {demoTimeLeft}s
            </span>
          )}

          {isActive && !inDemo && (
            <span style={{
              background: isMyTurn ? 'linear-gradient(135deg, #2ED573, #10B981)' : colorHex,
              color: '#0F172A',
              fontSize: '0.62rem',
              fontWeight: 900,
              padding: '2px 6px',
              borderRadius: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              flexShrink: 0,
              boxShadow: isMyTurn ? '0 0 8px #2ED573' : 'none',
              animation: isMyTurn ? 'pulse 1s infinite' : 'none'
            }}>
              {isMyTurn ? '⚡ YOUR TURN' : 'TURN'}
            </span>
          )}
        </div>
      </div>

      {/* 2nd Line: Left (Below User Name) = 🎲 Dice Cube & Roll | Right (Other Corner) = 🔢 Balance Pills */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: '2px' }}>
        
        {/* Bottom Left (Below User): Dice Cube + "ROLL" Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          {isActive ? (
            <div 
              onClick={() => handleRollClick(0)}
              style={{
                display: 'flex',
                gap: '4px',
                alignItems: 'center',
                cursor: (isMyTurn && canRoll && !showingSixDelay) ? 'pointer' : 'default',
                flexShrink: 0
              }}
            >
              {isDualDice ? (
                <>
                  <SpaciousDiceCube val={displayVal1} rolling={rolling} isMyTurn={isMyTurn} canRoll={canRoll} showingSixDelay={showingSixDelay} theme="purple" size={32} />
                  <SpaciousDiceCube val={displayVal2} rolling={rolling} isMyTurn={isMyTurn} canRoll={canRoll} showingSixDelay={showingSixDelay} theme="white" size={32} />
                </>
              ) : (
                <SpaciousDiceCube val={displayDiceVal} rolling={rolling} isMyTurn={isMyTurn} canRoll={canRoll} showingSixDelay={showingSixDelay} size={34} />
              )}

              {isMyTurn && canRoll && (
                <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#2ED573', animation: 'pulse 1s infinite', textTransform: 'uppercase', flexShrink: 0 }}>
                  ROLL
                </span>
              )}
            </div>
          ) : (
            <span style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 700 }}>
              WAITING
            </span>
          )}
        </div>

        {/* Bottom Right (Other Corner): Balance Badges Strip */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', minWidth: 0 }}>
          {isActive && showBalance && (
            <div 
              style={{ 
                display: 'flex', 
                gap: '3px', 
                alignItems: 'center', 
                maxWidth: '120px', 
                overflowX: 'auto', 
                scrollbarWidth: 'none', 
                msOverflowStyle: 'none',
                padding: '1px 0'
              }}
            >
              {dicePool.map((val, idx) => {
                const isSelected = idx === selectedRollIndex;
                const isSix = val === 6;
                return (
                  <button
                    key={`spd-bal-${idx}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isMyTurn && !canRoll && onSelectRoll) onSelectRoll(idx);
                    }}
                    title={`Select ${val}`}
                    style={{
                      minWidth: '20px',
                      height: '20px',
                      borderRadius: '6px',
                      border: isSelected 
                        ? '2px solid #6366F1' 
                        : isSix 
                          ? '1.5px solid #22C55E' 
                          : '1px solid rgba(255,255,255,0.25)',
                      background: isSelected 
                        ? '#6366F1' 
                        : isSix 
                          ? 'linear-gradient(135deg, #166534, #15803D)' 
                          : '#334155',
                      color: '#FFF',
                      fontSize: '10px',
                      fontWeight: 900,
                      cursor: (isMyTurn && !canRoll) ? 'pointer' : 'default',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 4px',
                      flexShrink: 0,
                      boxShadow: isSelected ? '0 0 8px #6366F1' : (isSix ? '0 0 6px rgba(34, 197, 94, 0.4)' : 'none'),
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {val}
                  </button>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Bottom Turn Timer Line */}
      {isActive && timeLeft !== undefined && timeLeft !== null && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'rgba(255,255,255,0.1)'
        }}>
          <div style={{
            height: '100%',
            width: `${Math.max(0, Math.min(100, (timeLeft / (gameState?.turnTimer || 30)) * 100))}%`,
            background: timeLeft <= 5 ? '#FF4757' : (timeLeft <= 10 ? '#FFA502' : '#2ED573'),
            transition: 'width 0.4s linear'
          }} />
        </div>
      )}
    </div>
  );
}
