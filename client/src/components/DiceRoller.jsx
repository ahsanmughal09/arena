import React, { useState } from 'react';
import { sounds } from '../utils/audio';

export default function DiceRoller({ 
  currentDice, 
  dicePool = [], 
  selectedRollIndex = 0, 
  canRoll = true, 
  isMyTurn, 
  activeColor, 
  onRollDice, 
  onSelectRoll, 
  validMoves 
}) {
  const [rolling, setRolling] = useState(false);

  const handleRoll = () => {
    if (!isMyTurn || !canRoll || rolling) return;
    setRolling(true);
    sounds.playDiceRoll();

    setTimeout(() => {
      onRollDice();
      setRolling(false);
    }, 600);
  };

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

  const displayDiceVal = currentDice || (dicePool.length > 0 ? dicePool[selectedRollIndex] : null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      
      {/* Dice Pool / Balance Badges */}
      {dicePool && dicePool.length > 0 && (
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

      {/* Main Dice Cube */}
      <div 
        onClick={handleRoll}
        style={{
          width: '76px',
          height: '76px',
          borderRadius: '16px',
          background: (isMyTurn && canRoll) ? 'linear-gradient(145deg, #FFFFFF, #E2E8F0)' : '#334155',
          boxShadow: (isMyTurn && canRoll) ? '0 10px 25px rgba(255, 255, 255, 0.25), inset 0 2px 4px #FFF' : 'none',
          border: '2px solid rgba(255,255,255,0.4)',
          cursor: (isMyTurn && canRoll) ? 'pointer' : 'default',
          transform: rolling ? 'rotate(360deg) scale(1.1)' : 'scale(1)',
          transition: 'all 0.4s ease',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative'
        }}
      >
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
          {displayDiceVal && getDiceDots(displayDiceVal).map((dot, idx) => (
            <circle key={`dot-${idx}`} cx={dot.x} cy={dot.y} r="8" fill={(isMyTurn && canRoll) ? '#0F172A' : '#F8FAFC'} />
          ))}
          {!displayDiceVal && !rolling && (
            <text x="50" y="58" fill={(isMyTurn && canRoll) ? '#0F172A' : '#94A3B8'} fontSize="32" fontWeight="bold" textAnchor="middle">
              ?
            </text>
          )}
        </svg>
      </div>

      {/* Helper text */}
      <div style={{ fontSize: '0.9rem', fontWeight: 600, textAlign: 'center' }}>
        {isMyTurn ? (
          canRoll ? (
            <span style={{ color: '#2ED573', animation: 'pulse 1s infinite' }}>
              {dicePool.length > 0 ? '🎲 Rolled 6! Tap Dice to Roll Again!' : '⚡ Tap Dice to Roll!'}
            </span>
          ) : validMoves && validMoves.length > 0 ? (
            <span style={{ color: '#FFA502' }}>👉 Select a roll balance & click a glowing token!</span>
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
