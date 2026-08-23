import React, { useState, useEffect } from 'react';
import { sounds } from '../utils/audio';

function SingleDiceCube({ val, rolling, isMyTurn, canRoll, showingSixDelay, theme = 'standard', label = 'Dice' }) {
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

  let bgStyle = (isMyTurn && canRoll && !showingSixDelay) ? 'linear-gradient(145deg, #FFFFFF, #E2E8F0)' : '#334155';
  let borderStyle = '2px solid rgba(255,255,255,0.4)';
  let dotFill = (isMyTurn && canRoll && !showingSixDelay) ? '#0F172A' : '#F8FAFC';
  let shadowStyle = (isMyTurn && canRoll && !showingSixDelay) ? '0 10px 25px rgba(255, 255, 255, 0.25), inset 0 2px 4px #FFF' : 'none';

  if (theme === 'purple') {
    bgStyle = 'linear-gradient(145deg, #A855F7, #6B21A8)';
    borderStyle = '2px solid #E9D5FF';
    dotFill = '#FFFFFF';
    shadowStyle = '0 10px 25px rgba(168, 85, 247, 0.4), inset 0 2px 4px #F3E8FF';
  } else if (theme === 'white') {
    bgStyle = 'linear-gradient(145deg, #FFFFFF, #E2E8F0)';
    borderStyle = '2px solid #94A3B8';
    dotFill = '#0F172A';
    shadowStyle = '0 10px 25px rgba(255, 255, 255, 0.3), inset 0 2px 4px #FFF';
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
      <div 
        style={{
          width: '68px',
          height: '68px',
          borderRadius: '16px',
          background: bgStyle,
          boxShadow: shadowStyle,
          border: borderStyle,
          transform: rolling ? 'rotate(360deg) scale(1.1)' : 'scale(1)',
          transition: 'all 0.4s ease',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative'
        }}
      >
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
          {val && getDiceDots(val).map((dot, idx) => (
            <circle key={`dot-${idx}`} cx={dot.x} cy={dot.y} r="8" fill={dotFill} />
          ))}
          {!val && !rolling && (
            <text x="50" y="58" fill={theme === 'purple' ? '#FFFFFF' : ((isMyTurn && canRoll) ? '#0F172A' : '#94A3B8')} fontSize="30" fontWeight="bold" textAnchor="middle">
              ?
            </text>
          )}
        </svg>
      </div>

      {val !== null && val !== undefined && (
        <span style={{ 
          fontSize: '0.75rem', 
          fontWeight: 800, 
          color: theme === 'purple' ? '#E9D5FF' : (val === 6 ? '#22C55E' : '#F8FAFC'), 
          background: 'rgba(30, 41, 59, 0.9)', 
          padding: '2px 8px', 
          borderRadius: '10px', 
          border: '1px solid rgba(255,255,255,0.2)',
          whiteSpace: 'nowrap'
        }}>
          {theme === 'purple' ? '🟣' : theme === 'white' ? '⚪' : '🎲'} {label}: {val}
        </span>
      )}
    </div>
  );
}

export default function DiceRoller({ 
  currentDice, 
  dicePool = [], 
  selectedRollIndex = 0, 
  canRoll = true, 
  isMyTurn, 
  activeColor, 
  onRollDice, 
  onSelectRoll,
  diceCount = 1,
  allTokensInHome = false,
  isHomeDiceSelectionMode = false
}) {
  const [rolling, setRolling] = useState(false);
  const [showingSixDelay, setShowingSixDelay] = useState(false);

  useEffect(() => {
    let timer;
    let anim;
    const hasSixRolled = Array.isArray(currentDice) ? currentDice.includes(6) : (currentDice === 6);
    if (canRoll && hasSixRolled && !rolling) {
      anim = requestAnimationFrame(() => {
        setShowingSixDelay(true);
      });
      timer = setTimeout(() => {
        setShowingSixDelay(false);
      }, 1000);
    }
    return () => {
      if (anim) cancelAnimationFrame(anim);
      if (timer) clearTimeout(timer);
      setShowingSixDelay(false);
    };
  }, [currentDice, canRoll, dicePool.length, rolling]);

  const handleRoll = (selectedIdx = 0) => {
    if (!isMyTurn || !canRoll || rolling || showingSixDelay) return;
    setRolling(true);
    sounds.playDiceRoll();

    setTimeout(() => {
      onRollDice(selectedIdx);
      setRolling(false);
    }, 600);
  };

  const isDualDice = (diceCount === 2) || Array.isArray(currentDice);
  let displayVal1 = null;
  let displayVal2 = null;
  let displayDiceVal = null;

  if (isDualDice) {
    const arr = Array.isArray(currentDice) ? currentDice : [null, null];
    displayVal1 = (arr[0] !== null && arr[0] !== undefined) ? arr[0] : (dicePool[0] || null);
    displayVal2 = (arr[1] !== null && arr[1] !== undefined) ? arr[1] : (dicePool[1] || null);
  } else {
    displayDiceVal = (currentDice !== null && currentDice !== undefined) 
      ? currentDice 
      : (dicePool[selectedRollIndex] !== undefined ? dicePool[selectedRollIndex] : (dicePool.length > 0 ? dicePool[0] : null));
  }

  const showBalance = !isHomeDiceSelectionMode && !allTokensInHome && dicePool && dicePool.length > 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
      
      {/* Pre-Roll Single Dice Selection Prompt (All Tokens in Home) */}
      {allTokensInHome && canRoll && isDualDice && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.25), rgba(99, 102, 241, 0.25))',
          border: '1.5px solid #A855F7',
          borderRadius: '16px',
          padding: '8px 12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '6px',
          boxShadow: '0 4px 15px rgba(168, 85, 247, 0.3)',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#E9D5FF', textAlign: 'center' }}>
            🏠 Tokens in Home! Choose 1 Dice to Roll:
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => handleRoll(0)}
              style={{
                background: 'linear-gradient(135deg, #A855F7, #6B21A8)',
                color: '#FFF',
                border: '2px solid #E9D5FF',
                padding: '5px 12px',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '0.8rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(168, 85, 247, 0.4)'
              }}
            >
              🟣 Roll Purple Dice
            </button>
            <button
              onClick={() => handleRoll(1)}
              style={{
                background: 'linear-gradient(135deg, #FFFFFF, #E2E8F0)',
                color: '#0F172A',
                border: '2px solid #94A3B8',
                padding: '5px 12px',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '0.8rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(255, 255, 255, 0.3)'
              }}
            >
              ⚪ Roll White Dice
            </button>
          </div>
        </div>
      )}

      {/* Dice Pool / Balance Badges */}
      {showBalance && (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: '#1E293B', padding: '6px 14px', borderRadius: '20px', border: '1px solid #334155' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Balance:
          </span>
          {dicePool.map((val, idx) => {
            const isSelected = (idx === selectedRollIndex && !canRoll);
            return (
              <button
                key={`pool-roll-${idx}`}
                onClick={() => isMyTurn && !canRoll && onSelectRoll && onSelectRoll(idx)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: isSelected ? '2px solid #6366F1' : '1px solid rgba(255,255,255,0.2)',
                  background: isSelected 
                    ? 'linear-gradient(135deg, #6366F1, #4F46E5)' 
                    : (val === 6 ? '#22C55E' : '#334155'),
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  cursor: (isMyTurn && !canRoll) ? 'pointer' : 'default',
                  boxShadow: isSelected ? '0 0 12px rgba(99, 102, 241, 0.6)' : 'none',
                  transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                {val}
              </button>
            );
          })}
        </div>
      )}

      {/* Main Dice Cube(s) */}
      <div 
        style={{ display: 'flex', gap: '12px' }}
      >
        {isDualDice ? (
          <>
            <div 
              onClick={() => (allTokensInHome && canRoll) ? handleRoll(0) : handleRoll(0)}
              style={{ cursor: (isMyTurn && canRoll && !showingSixDelay) ? 'pointer' : 'default' }}
            >
              <SingleDiceCube val={displayVal1} rolling={rolling} isMyTurn={isMyTurn} canRoll={canRoll} showingSixDelay={showingSixDelay} theme="purple" label="Purple" />
            </div>
            <div 
              onClick={() => (allTokensInHome && canRoll) ? handleRoll(1) : handleRoll(0)}
              style={{ cursor: (isMyTurn && canRoll && !showingSixDelay) ? 'pointer' : 'default' }}
            >
              <SingleDiceCube val={displayVal2} rolling={rolling} isMyTurn={isMyTurn} canRoll={canRoll} showingSixDelay={showingSixDelay} theme="white" label="White" />
            </div>
          </>
        ) : (
          <div 
            onClick={() => handleRoll(0)}
            style={{ cursor: (isMyTurn && canRoll && !showingSixDelay) ? 'pointer' : 'default' }}
          >
            <SingleDiceCube val={displayDiceVal} rolling={rolling} isMyTurn={isMyTurn} canRoll={canRoll} showingSixDelay={showingSixDelay} theme="standard" label="Dice" />
          </div>
        )}
      </div>

      {/* Helper text */}
      <div style={{ fontSize: '0.85rem', fontWeight: 600, textAlign: 'center' }}>
        {isMyTurn ? (
          canRoll ? (
            <span style={{ color: '#2ED573', animation: 'pulse 1s infinite' }}>
              {dicePool.length > 0 ? '🎲 Double 6s! Tap Dice to Roll Again!' : '⚡ Tap Dice to Roll!'}
            </span>
          ) : (dicePool && dicePool.length > 0) ? (
            <span style={{ color: '#FFA502' }}>
              {(allTokensInHome || isHomeDiceSelectionMode)
                ? '🏠 Select a dice above then tap your home token!'
                : '👉 Tap any glowing token on the board to move!'}
            </span>
          ) : (
            <span style={{ color: '#94A3B8' }}>No valid moves available.</span>
          )
        ) : (
          <span style={{ color: '#94A3B8' }}>Waiting for {activeColor?.toUpperCase()}'s turn...</span>
        )}
      </div>
    </div>
  );
}
