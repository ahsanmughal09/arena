import React, { useState, useEffect } from 'react';
import { sounds } from '../utils/audio';

function SingleDiceCube({ val, rolling, isMyTurn, canRoll, showingSixDelay, theme = 'standard', label = 'Dice', size = 68 }) {
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
      <div 
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: `${Math.round(size * 0.24)}px`,
          background: bgStyle,
          boxShadow: shadowStyle,
          border: borderStyle,
          transform: rolling ? 'rotate(360deg) scale(1.1)' : 'scale(1)',
          transition: 'all 0.4s ease',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          touchAction: 'manipulation'
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

      {val !== null && val !== undefined && size > 50 && (
        <span style={{ 
          fontSize: '0.7rem', 
          fontWeight: 800, 
          color: theme === 'purple' ? '#E9D5FF' : (val === 6 ? '#22C55E' : '#F8FAFC'), 
          background: 'rgba(30, 41, 59, 0.9)', 
          padding: '1px 6px', 
          borderRadius: '8px', 
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
  isHomeDiceSelectionMode = false,
  timeLeft = null,
  maxTime = 30,
  compact = false
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

  // When player can roll and showingSixDelay has ended, show ? ? to indicate ready for next roll!
  const isReadyToRoll = canRoll && !showingSixDelay && !rolling;

  if (isDualDice) {
    if (isReadyToRoll) {
      displayVal1 = null;
      displayVal2 = null;
    } else {
      const arr = Array.isArray(currentDice) ? currentDice : [null, null];
      displayVal1 = (arr[0] !== null && arr[0] !== undefined) ? arr[0] : (dicePool[0] || null);
      displayVal2 = (arr[1] !== null && arr[1] !== undefined) ? arr[1] : (dicePool[1] || null);
    }
  } else {
    if (isReadyToRoll) {
      displayDiceVal = null;
    } else {
      displayDiceVal = (currentDice !== null && currentDice !== undefined) 
        ? currentDice 
        : (dicePool[selectedRollIndex] !== undefined ? dicePool[selectedRollIndex] : (dicePool.length > 0 ? dicePool[0] : null));
    }
  }

  const showBalance = !isHomeDiceSelectionMode && !allTokensInHome && dicePool && dicePool.length > 1;

  const diceSize = compact ? 42 : 68;

  if (compact) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', height: '100%', width: '100%', boxSizing: 'border-box' }}>
        
        {/* Top: Slim Real-Time Turn Timer */}
        {timeLeft !== undefined && timeLeft !== null && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', padding: '0 2px' }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#94A3B8' }}>
                ⏳ {isMyTurn ? 'Your Turn' : `${activeColor?.toUpperCase()}'s Turn`}
              </span>
              <span style={{ 
                fontSize: '0.75rem', 
                fontWeight: 900, 
                color: timeLeft <= 5 ? '#FF4757' : (timeLeft <= 10 ? '#FFA502' : '#2ED573')
              }}>
                {timeLeft}s
              </span>
            </div>
            <div style={{ width: '100%', height: '3px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${Math.max(0, Math.min(100, (timeLeft / (maxTime || 30)) * 100))}%`,
                background: timeLeft <= 5 
                  ? 'linear-gradient(90deg, #FF4757, #FF6B81)' 
                  : (timeLeft <= 10 ? 'linear-gradient(90deg, #FFA502, #FF7F50)' : 'linear-gradient(90deg, #2ED573, #10B981)'),
                borderRadius: '2px',
                transition: 'width 0.4s linear, background 0.3s ease'
              }} />
            </div>
          </div>
        )}

        {/* Center Row: Fixed 46px height with Dice Cubes + Inline Balance */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', height: '46px', width: '100%' }}>
          
          {/* Pre-roll Home choice prompt if applicable */}
          {allTokensInHome && canRoll && isDualDice ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#E9D5FF' }}>🏠 Choose:</span>
              <button
                onClick={() => handleRoll(0)}
                style={{
                  background: 'linear-gradient(135deg, #A855F7, #6B21A8)',
                  color: '#FFF',
                  border: '1.5px solid #E9D5FF',
                  padding: '3px 6px',
                  borderRadius: '6px',
                  fontWeight: 800,
                  fontSize: '0.68rem',
                  cursor: 'pointer'
                }}
              >
                🟣 Purple
              </button>
              <button
                onClick={() => handleRoll(1)}
                style={{
                  background: 'linear-gradient(135deg, #FFFFFF, #E2E8F0)',
                  color: '#0F172A',
                  border: '1.5px solid #94A3B8',
                  padding: '3px 6px',
                  borderRadius: '6px',
                  fontWeight: 800,
                  fontSize: '0.68rem',
                  cursor: 'pointer'
                }}
              >
                ⚪ White
              </button>
            </div>
          ) : (
            <>
              {/* Dice Cube(s) */}
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                {isDualDice ? (
                  <>
                    <div 
                      onClick={() => handleRoll(0)}
                      style={{ cursor: (isMyTurn && canRoll && !showingSixDelay) ? 'pointer' : 'default' }}
                    >
                      <SingleDiceCube val={displayVal1} rolling={rolling} isMyTurn={isMyTurn} canRoll={canRoll} showingSixDelay={showingSixDelay} theme="purple" label="Purple" size={diceSize} />
                    </div>
                    <div 
                      onClick={() => handleRoll(0)}
                      style={{ cursor: (isMyTurn && canRoll && !showingSixDelay) ? 'pointer' : 'default' }}
                    >
                      <SingleDiceCube val={displayVal2} rolling={rolling} isMyTurn={isMyTurn} canRoll={canRoll} showingSixDelay={showingSixDelay} theme="white" label="White" size={diceSize} />
                    </div>
                  </>
                ) : (
                  <div 
                    onClick={() => handleRoll(0)}
                    style={{ cursor: (isMyTurn && canRoll && !showingSixDelay) ? 'pointer' : 'default' }}
                  >
                    <SingleDiceCube val={displayDiceVal} rolling={rolling} isMyTurn={isMyTurn} canRoll={canRoll} showingSixDelay={showingSixDelay} theme="standard" label="Dice" size={diceSize} />
                  </div>
                )}
              </div>

              {/* Inline Balance Badges (rendered next to dice cubes with zero height impact) */}
              {showBalance && (
                <div style={{ 
                  display: 'flex', 
                  gap: '4px', 
                  alignItems: 'center', 
                  background: 'rgba(30, 41, 59, 0.9)', 
                  padding: '2px 6px', 
                  borderRadius: '12px', 
                  border: '1px solid rgba(255,255,255,0.15)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                }}>
                  <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>
                    Bal:
                  </span>
                  {dicePool.map((val, idx) => {
                    const isSelected = (idx === selectedRollIndex && !canRoll);
                    return (
                      <button
                        key={`pool-roll-${idx}`}
                        onClick={() => isMyTurn && !canRoll && onSelectRoll && onSelectRoll(idx)}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          border: isSelected ? '2px solid #6366F1' : '1px solid rgba(255,255,255,0.2)',
                          background: isSelected 
                            ? 'linear-gradient(135deg, #6366F1, #4F46E5)' 
                            : (val === 6 ? '#22C55E' : '#334155'),
                          color: '#FFFFFF',
                          fontWeight: 800,
                          fontSize: '0.75rem',
                          cursor: (isMyTurn && !canRoll) ? 'pointer' : 'default',
                          boxShadow: isSelected ? '0 0 8px rgba(99, 102, 241, 0.8)' : 'none',
                          transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          padding: 0
                        }}
                      >
                        {val}
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Bottom: Fixed 14px Helper Text */}
        <div style={{ height: '14px', lineHeight: '14px', fontSize: '0.7rem', fontWeight: 700, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
          {isMyTurn ? (
            canRoll ? (
              <span style={{ color: '#2ED573', animation: 'pulse 1s infinite' }}>
                {dicePool.length > 0 ? '🎲 Roll Again!' : '⚡ Tap Dice to Roll!'}
              </span>
            ) : (dicePool && dicePool.length > 0) ? (
              <span style={{ color: '#FFA502' }}>
                {(allTokensInHome || isHomeDiceSelectionMode)
                  ? '🏠 Select a dice then tap home token!'
                  : '👉 Tap glowing token on board!'}
              </span>
            ) : (
              <span style={{ color: '#94A3B8' }}>No valid moves.</span>
            )
          ) : (
            <span style={{ color: '#94A3B8' }}>Waiting for {activeColor?.toUpperCase()}...</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', width: '100%' }}>
      
      {/* Real-Time Turn Timer Gauge */}
      {timeLeft !== undefined && timeLeft !== null && (
        <div style={{
          width: '100%',
          background: 'rgba(15, 23, 42, 0.85)',
          borderRadius: '12px',
          border: '1.5px solid rgba(255, 255, 255, 0.15)',
          padding: '8px 12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '5px',
          boxSizing: 'border-box',
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '4px' }}>
              ⏳ {isMyTurn ? 'Your Turn:' : `${activeColor?.toUpperCase()}'s Turn:`}
            </span>
            <span style={{ 
              fontSize: '0.95rem', 
              fontWeight: 900, 
              color: timeLeft <= 5 ? '#FF4757' : (timeLeft <= 10 ? '#FFA502' : '#2ED573'),
              animation: timeLeft <= 5 ? 'pulse 0.6s infinite' : 'none'
            }}>
              {timeLeft}s
            </span>
          </div>

          {/* Smooth Shrinking Progress Bar */}
          <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${Math.max(0, Math.min(100, (timeLeft / (maxTime || 30)) * 100))}%`,
              background: timeLeft <= 5 
                ? 'linear-gradient(90deg, #FF4757, #FF6B81)' 
                : (timeLeft <= 10 ? 'linear-gradient(90deg, #FFA502, #FF7F50)' : 'linear-gradient(90deg, #2ED573, #10B981)'),
              borderRadius: '3px',
              transition: 'width 0.4s linear, background 0.3s ease'
            }} />
          </div>
        </div>
      )}
      
      {/* Pre-Roll Single Dice Selection Prompt (All Tokens in Home) */}
      {allTokensInHome && canRoll && isDualDice && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.25), rgba(99, 102, 241, 0.25))',
          border: '1.5px solid #A855F7',
          borderRadius: '12px',
          padding: '8px 12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          boxShadow: '0 4px 15px rgba(168, 85, 247, 0.3)',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#E9D5FF', textAlign: 'center' }}>
            🏠 Tokens in Home! Choose 1 Dice:
          </span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => handleRoll(0)}
              style={{
                background: 'linear-gradient(135deg, #A855F7, #6B21A8)',
                color: '#FFF',
                border: '2px solid #E9D5FF',
                padding: '4px 8px',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '0.75rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(168, 85, 247, 0.4)'
              }}
            >
              🟣 Purple
            </button>
            <button
              onClick={() => handleRoll(1)}
              style={{
                background: 'linear-gradient(135deg, #FFFFFF, #E2E8F0)',
                color: '#0F172A',
                border: '2px solid #94A3B8',
                padding: '4px 8px',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '0.75rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(255, 255, 255, 0.3)'
              }}
            >
              ⚪ White
            </button>
          </div>
        </div>
      )}

      {/* Dice Pool / Balance Badges */}
      {showBalance && (
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', background: '#1E293B', padding: '6px 14px', borderRadius: '16px', border: '1px solid #334155' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Bal:
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
                  transform: isSelected ? 'scale(1.1)' : 'scale(1)',
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
              onClick={() => handleRoll(0)}
              style={{ cursor: (isMyTurn && canRoll && !showingSixDelay) ? 'pointer' : 'default' }}
            >
              <SingleDiceCube val={displayVal1} rolling={rolling} isMyTurn={isMyTurn} canRoll={canRoll} showingSixDelay={showingSixDelay} theme="purple" label="Purple" size={diceSize} />
            </div>
            <div 
              onClick={() => handleRoll(0)}
              style={{ cursor: (isMyTurn && canRoll && !showingSixDelay) ? 'pointer' : 'default' }}
            >
              <SingleDiceCube val={displayVal2} rolling={rolling} isMyTurn={isMyTurn} canRoll={canRoll} showingSixDelay={showingSixDelay} theme="white" label="White" size={diceSize} />
            </div>
          </>
        ) : (
          <div 
            onClick={() => handleRoll(0)}
            style={{ cursor: (isMyTurn && canRoll && !showingSixDelay) ? 'pointer' : 'default' }}
          >
            <SingleDiceCube val={displayDiceVal} rolling={rolling} isMyTurn={isMyTurn} canRoll={canRoll} showingSixDelay={showingSixDelay} theme="standard" label="Dice" size={diceSize} />
          </div>
        )}
      </div>

      {/* Helper text */}
      <div style={{ fontSize: '0.85rem', fontWeight: 600, textAlign: 'center' }}>
        {isMyTurn ? (
          canRoll ? (
            <span style={{ color: '#2ED573', animation: 'pulse 1s infinite' }}>
              {dicePool.length > 0 ? '🎲 Roll Again!' : '⚡ Tap Dice to Roll!'}
            </span>
          ) : (dicePool && dicePool.length > 0) ? (
            <span style={{ color: '#FFA502' }}>
              {(allTokensInHome || isHomeDiceSelectionMode)
                ? '🏠 Select a dice then tap home token!'
                : '👉 Tap glowing token on board!'}
            </span>
          ) : (
            <span style={{ color: '#94A3B8' }}>No valid moves.</span>
          )
        ) : (
          <span style={{ color: '#94A3B8' }}>Waiting for {activeColor?.toUpperCase()}...</span>
        )}
      </div>
    </div>
  );
}
