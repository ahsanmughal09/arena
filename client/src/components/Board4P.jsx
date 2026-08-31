import React, { useState, useEffect } from 'react';
import { sounds } from '../utils/audio';
import { getRotationAngle4P, rotatePoint } from '../utils/orientation';

// 52 step perimeter path (col, row) on 15x15 grid (cell size = 40px)
const MAIN_TRACK_4P = [
  // Red start to corner top (0..5)
  { c: 1, r: 6 }, { c: 2, r: 6 }, { c: 3, r: 6 }, { c: 4, r: 6 }, { c: 5, r: 6 },
  { c: 6, r: 5 }, { c: 6, r: 4 }, { c: 6, r: 3 }, { c: 6, r: 2 }, { c: 6, r: 1 }, { c: 6, r: 0 },
  { c: 7, r: 0 }, // top tip (11)
  { c: 8, r: 0 }, { c: 8, r: 1 }, { c: 8, r: 2 }, { c: 8, r: 3 }, { c: 8, r: 4 }, { c: 8, r: 5 }, // Green start at step 13 (8, 1)
  { c: 9, r: 6 }, { c: 10, r: 6 }, { c: 11, r: 6 }, { c: 12, r: 6 }, { c: 13, r: 6 }, { c: 14, r: 6 },
  { c: 14, r: 7 }, // right tip (24)
  { c: 14, r: 8 }, { c: 13, r: 8 }, { c: 12, r: 8 }, { c: 11, r: 8 }, { c: 10, r: 8 }, { c: 9, r: 8 }, // Yellow start at step 26 (13, 8)
  { c: 8, r: 9 }, { c: 8, r: 10 }, { c: 8, r: 11 }, { c: 8, r: 12 }, { c: 8, r: 13 }, { c: 8, r: 14 },
  { c: 7, r: 14 }, // bottom tip (37)
  { c: 6, r: 14 }, { c: 6, r: 13 }, { c: 6, r: 12 }, { c: 6, r: 11 }, { c: 6, r: 10 }, { c: 6, r: 9 }, // Blue start at step 39 (6, 13)
  { c: 5, r: 8 }, { c: 4, r: 8 }, { c: 3, r: 8 }, { c: 2, r: 8 }, { c: 1, r: 8 }, { c: 0, r: 8 },
  { c: 0, r: 7 }, { c: 0, r: 6 }, // left tip (50) & 1 square before Red start (51)
];

// Home paths for each color (steps 52..57)
const HOME_PATHS_4P = {
  red: [{ c: 1, r: 7 }, { c: 2, r: 7 }, { c: 3, r: 7 }, { c: 4, r: 7 }, { c: 5, r: 7 }, { c: 6, r: 7 }],
  green: [{ c: 7, r: 1 }, { c: 7, r: 2 }, { c: 7, r: 3 }, { c: 7, r: 4 }, { c: 7, r: 5 }, { c: 7, r: 6 }],
  yellow: [{ c: 13, r: 7 }, { c: 12, r: 7 }, { c: 11, r: 7 }, { c: 10, r: 7 }, { c: 9, r: 7 }, { c: 8, r: 7 }],
  blue: [{ c: 7, r: 13 }, { c: 7, r: 12 }, { c: 7, r: 11 }, { c: 7, r: 10 }, { c: 7, r: 9 }, { c: 7, r: 8 }]
};

// Yard token display coords (col, row)
const YARD_SPOTS_4P = {
  red: [{ c: 0.8, r: 0.8 }, { c: 4.2, r: 0.8 }, { c: 0.8, r: 4.2 }, { c: 4.2, r: 4.2 }],
  green: [{ c: 9.8, r: 0.8 }, { c: 13.2, r: 0.8 }, { c: 9.8, r: 4.2 }, { c: 13.2, r: 4.2 }],
  yellow: [{ c: 9.8, r: 9.8 }, { c: 13.2, r: 9.8 }, { c: 9.8, r: 13.2 }, { c: 13.2, r: 13.2 }],
  blue: [{ c: 0.8, r: 9.8 }, { c: 4.2, r: 9.8 }, { c: 0.8, r: 13.2 }, { c: 4.2, r: 13.2 }]
};

// Safe star spots indices on main track (0..51)
const STAR_SPOTS_4P = [
  { c: 1, r: 6 },  // Red start (step 0)
  { c: 6, r: 2 },  // Step 8 (Green domain safe)
  { c: 8, r: 1 },  // Green start (step 13)
  { c: 12, r: 6 }, // Step 21 (Yellow domain safe)
  { c: 13, r: 8 }, // Yellow start (step 26)
  { c: 8, r: 12 }, // Step 34 (Blue domain safe)
  { c: 6, r: 13 }, // Blue start (step 39)
  { c: 2, r: 8 },  // Step 47 (Red domain safe)
];

const COLOR_HEX_4P = {
  red: '#FF4757',
  green: '#2ED573',
  yellow: '#FFA502',
  blue: '#1E90FF'
};

function YardPlayerCard({ color, player, isActive, isMe, teamName, finishStep, onOpenThrowMenu }) {
  const playerName = player ? player.name : `Empty (${color.toUpperCase()})`;
  const finishedCount = player && player.tokens ? player.tokens.filter(s => s === finishStep).length : 0;
  const isWinner = finishedCount === 4;
  const canThrowAtPlayer = player && player.connected && !isMe;

  return (
    <div 
      data-player-color={color}
      style={{
        background: isActive
          ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98))'
          : player ? 'rgba(15, 23, 42, 0.88)' : 'rgba(15, 23, 42, 0.4)',
        borderRadius: '14px',
        border: isActive ? `2.5px solid ${COLOR_HEX_4P[color] || '#6366F1'}` : '1.5px solid rgba(255, 255, 255, 0.25)',
        boxShadow: isActive ? `0 0 24px ${COLOR_HEX_4P[color]}C0, 0 0 10px ${COLOR_HEX_4P[color]}` : '0 6px 16px rgba(0, 0, 0, 0.6)',
        padding: '6px 10px',
        color: '#FFF',
        height: '100%',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: '3px',
        fontSize: '10px',
        userSelect: 'none'
      }}
    >
      {/* Top Row: Online Dot + Player Name + Target Throw Button & Turn Badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: 0 }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: player && player.connected ? (isActive ? COLOR_HEX_4P[color] : '#2ED573') : '#64748B',
            boxShadow: player && player.connected ? `0 0 6px ${isActive ? COLOR_HEX_4P[color] : '#2ED573'}` : 'none',
            flexShrink: 0
          }} />
          <span style={{
            fontWeight: 800,
            fontSize: '12px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            color: isActive ? COLOR_HEX_4P[color] : player ? '#F8FAFC' : '#94A3B8'
          }}>
            {playerName} {isMe ? '(You)' : ''}
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {canThrowAtPlayer && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenThrowMenu) onOpenThrowMenu(color, playerName);
              }}
              title={`Throw item at ${playerName}`}
              style={{
                background: 'rgba(255, 255, 255, 0.18)',
                border: '1px solid rgba(255, 255, 255, 0.35)',
                borderRadius: '6px',
                color: '#FFF',
                fontSize: '11px',
                padding: '2px 5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                transition: 'all 0.2s ease',
                lineHeight: 1
              }}
            >
              🎯
            </button>
          )}
          {isActive && (
            <span style={{
              background: COLOR_HEX_4P[color],
              color: '#0F172A',
              fontSize: '8px',
              fontWeight: 900,
              padding: '2px 6px',
              borderRadius: '5px',
              textTransform: 'uppercase',
              flexShrink: 0,
              boxShadow: `0 0 8px ${COLOR_HEX_4P[color]}`,
              animation: 'pulse 1s infinite'
            }}>
              ⚡ TURN
            </span>
          )}
        </div>
      </div>

      {/* Middle Row: Team Name & Winner Status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '9px', color: '#94A3B8' }}>
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{teamName || color.toUpperCase()}</span>
        {isWinner && <span style={{ color: '#F59E0B', fontWeight: 800 }}>🏆 WINNER</span>}
      </div>

      {/* Bottom Row: Kills, Home, Appeals Badges */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2px', paddingTop: '3px', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
        <span title="Kills" style={{ fontSize: '10px', color: '#EF4444', fontWeight: 700 }}>
          ⚔️ {player?.kills || 0}
        </span>
        <span title="Tokens in Home" style={{ fontSize: '10px', color: '#10B981', fontWeight: 700 }}>
          🏠 {finishedCount}/4
        </span>
        <span title="Appeals Remaining" style={{ fontSize: '10px', color: '#F59E0B', fontWeight: 700 }}>
          ⚖️ {player?.appealsLeft ?? 3}
        </span>
      </div>
    </div>
  );
}

function getOccupantOffset(occupantIndex, totalOccupants) {
  if (totalOccupants <= 1) {
    return { dx: 0, dy: 0, r: 13 };
  }
  if (totalOccupants === 2) {
    const dx = occupantIndex === 0 ? -10 : 10;
    return { dx, dy: 0, r: 10 };
  }
  if (totalOccupants === 3) {
    const offsets = [
      { dx: 0, dy: -9 },
      { dx: -10, dy: 7 },
      { dx: 10, dy: 7 }
    ];
    return { ...offsets[occupantIndex % 3], r: 9 };
  }
  const offsets = [
    { dx: -10, dy: -10 },
    { dx: 10, dy: -10 },
    { dx: -10, dy: 10 },
    { dx: 10, dy: 10 }
  ];
  return { ...offsets[occupantIndex % 4], r: 8.5 };
}

function canTokenMoveWithRoll4P(step, roll, killRequired, hasKill, color, gameState) {
  if (step === undefined || step === null || roll === undefined || roll === null) return false;
  if (step === -1) return roll === 6;
  if (step === 56) return false; // already in home finished
  if (step >= 51) return (step + roll <= 56);

  const targetStep = step + roll;
  if (!killRequired || hasKill) {
    return targetStep <= 56;
  } else {
    if (targetStep <= 47) return true;
    if (targetStep < 51) {
      if (gameState && gameState.players && color) {
        const startPos = color === 'red' ? 0 : color === 'green' ? 13 : color === 'yellow' ? 26 : 39;
        const targetAbs = (startPos + targetStep) % 52;
        const safeSpots = [0, 8, 13, 21, 26, 34, 39, 47];
        if (!safeSpots.includes(targetAbs)) {
          let hasOpponent = false;
          Object.keys(gameState.players).forEach(otherColor => {
            if (otherColor !== color) {
              const otherPlayer = gameState.players[otherColor];
              if (otherPlayer && otherPlayer.tokens) {
                const otherStart = otherColor === 'red' ? 0 : otherColor === 'green' ? 13 : otherColor === 'yellow' ? 26 : 39;
                otherPlayer.tokens.forEach(otherStep => {
                  if (otherStep >= 0 && otherStep < 51) {
                    const otherAbs = (otherStart + otherStep) % 52;
                    if (otherAbs === targetAbs) hasOpponent = true;
                  }
                });
              }
            }
          });
          if (hasOpponent) return true;
        }
      }
    }
    return false;
  }
}

function canConsumeAllDice4P(currentTokens, remainingDicePool, hasKill, killRequired, color, gameState) {
  if (remainingDicePool.length === 0) return true;

  for (let rIdx = 0; rIdx < remainingDicePool.length; rIdx++) {
    const roll = remainingDicePool[rIdx];
    for (let tIdx = 0; tIdx < currentTokens.length; tIdx++) {
      const step = currentTokens[tIdx];
      if (canTokenMoveWithRoll4P(step, roll, killRequired, hasKill, color, gameState)) {
        const nextStep = (step === -1) ? 0 : (step + roll);
        const nextTokens = [...currentTokens];
        nextTokens[tIdx] = nextStep;

        let nextHasKill = hasKill;
        if (!hasKill && nextStep >= 0 && nextStep < 51) {
          const startPos = color === 'red' ? 0 : color === 'green' ? 13 : color === 'yellow' ? 26 : 39;
          const targetAbs = (startPos + nextStep) % 52;
          const safeSpots = [0, 8, 13, 21, 26, 34, 39, 47];
          if (!safeSpots.includes(targetAbs)) {
            let hasOpponent = false;
            if (gameState && gameState.players) {
              Object.keys(gameState.players).forEach(otherColor => {
                if (otherColor !== color) {
                  const otherPlayer = gameState.players[otherColor];
                  if (otherPlayer && otherPlayer.tokens) {
                    const otherStart = otherColor === 'red' ? 0 : otherColor === 'green' ? 13 : otherColor === 'yellow' ? 26 : 39;
                    otherPlayer.tokens.forEach(otherStep => {
                      if (otherStep >= 0 && otherStep < 51) {
                        const otherAbs = (otherStart + otherStep) % 52;
                        if (otherAbs === targetAbs) hasOpponent = true;
                      }
                    });
                  }
                }
              });
            }
            if (hasOpponent) nextHasKill = true;
          }
        }

        const nextPool = remainingDicePool.slice(0, rIdx).concat(remainingDicePool.slice(rIdx + 1));
        if (canConsumeAllDice4P(nextTokens, nextPool, nextHasKill, killRequired, color, gameState)) {
          return true;
        }
      }
    }
  }
  return false;
}

function getValidRollOptionsForToken(player, tokenIndex, dicePool, finishStep = 56, killRequired = false, gameState = null, color = null) {
  if (!player || !player.tokens || !dicePool || dicePool.length === 0) return [];
  const currentTokens = [...player.tokens];
  const step = currentTokens[tokenIndex];
  if (step === undefined) return [];

  const hasKill = ((player.kills || 0) > 0);
  const options = [];
  const seenValues = new Set();

  for (let rIdx = 0; rIdx < dicePool.length; rIdx++) {
    const roll = dicePool[rIdx];
    if (canTokenMoveWithRoll4P(step, roll, killRequired, hasKill, color, gameState)) {
      const nextStep = (step === -1) ? 0 : (step + roll);
      const nextTokens = [...currentTokens];
      nextTokens[tokenIndex] = nextStep;

      let nextHasKill = hasKill;
      if (!hasKill && nextStep >= 0 && nextStep < 51) {
        const startPos = color === 'red' ? 0 : color === 'green' ? 13 : color === 'yellow' ? 26 : 39;
        const targetAbs = (startPos + nextStep) % 52;
        const safeSpots = [0, 8, 13, 21, 26, 34, 39, 47];
        if (!safeSpots.includes(targetAbs)) {
          let hasOpponent = false;
          if (gameState && gameState.players) {
            Object.keys(gameState.players).forEach(otherColor => {
              if (otherColor !== color) {
                const otherPlayer = gameState.players[otherColor];
                if (otherPlayer && otherPlayer.tokens) {
                  const otherStart = otherColor === 'red' ? 0 : otherColor === 'green' ? 13 : otherColor === 'yellow' ? 26 : 39;
                  otherPlayer.tokens.forEach(otherStep => {
                    if (otherStep >= 0 && otherStep < 51) {
                      const otherAbs = (otherStart + otherStep) % 52;
                      if (otherAbs === targetAbs) hasOpponent = true;
                    }
                  });
                }
              }
            });
          }
          if (hasOpponent) nextHasKill = true;
        }
      }

      const nextPool = dicePool.slice(0, rIdx).concat(dicePool.slice(rIdx + 1));
      if (canConsumeAllDice4P(nextTokens, nextPool, nextHasKill, killRequired, color, gameState)) {
        if (!seenValues.has(roll)) {
          seenValues.add(roll);
          options.push({ rollIndex: rIdx, val: roll });
        }
      }
    }
  }

  return options;
}

export default function Board4P({ 
  gameState, 
  myColor, 
  onMoveToken, 
  onRollDice, 
  onSelectRoll, 
  onOpenThrowMenu, 
  onSubmitAppeal, 
  onActionComplete 
}) {
  const [activePopup, setActivePopup] = useState(null);
  const [displaySteps, setDisplaySteps] = useState({});
  const [capturedLocks, setCapturedLocks] = useState({});

  useEffect(() => {
    const anim = requestAnimationFrame(() => setActivePopup(null));
    return () => cancelAnimationFrame(anim);
  }, [gameState?.activeColor, gameState?.dicePool?.length]);

  // Synchronously lock captured token's starting step when a capture move occurs
  useEffect(() => {
    const action = gameState?.lastAction;
    if (action && action.type === 'MOVE' && action.captured) {
      const capKey = `${action.captured.color}-${action.captured.tokenIndex}`;
      if (action.captured.oldStep !== undefined) {
        setTimeout(() => {
          setCapturedLocks(prev => ({ ...prev, [capKey]: action.captured.oldStep }));
        }, 0);
      }
    }
  }, [gameState?.lastAction]);

  // Step-by-Step animated movement & capture return loop
  useEffect(() => {
    const action = gameState?.lastAction;
    if (!action || (action.type !== 'MOVE' && action.type !== 'DEMO_MOVE')) return;

    if (action.type === 'DEMO_MOVE') {
      const { color, tokenIndex, oldStep, targetStep, appealingColor, penalized, postMoveTokens } = action;
      const key = `${color}-${tokenIndex}`;

      let current = oldStep === -1 ? 0 : oldStep;
      const target = targetStep;

      const triggerDemoBanner = () => {
        sounds.playCapture();
        if (onActionComplete) {
          onActionComplete({
            color: appealingColor || color,
            title: '🎯 MISSED KILL PROVEN!',
            subtitle: `${color.toUpperCase()}'s token penalized to yard! Turn granted to ${(appealingColor || color).toUpperCase()}! 🎯`,
            icon: '🎯'
          });
        }
      };

      const runReturnToYard = () => {
        let retStep = target;
        const retInterval = setInterval(() => {
          retStep = Math.max(-1, retStep - 2);
          setDisplaySteps(prev => ({ ...prev, [key]: retStep }));

          if (retStep <= -1) {
            clearInterval(retInterval);
            setDisplaySteps(prev => {
              const next = { ...prev };
              delete next[key];
              return next;
            });

            // STAGE 3: Animate offending player's other token to postMove location
            if (postMoveTokens && postMoveTokens.length > 0) {
              postMoveTokens.forEach((pmTarget, pmIdx) => {
                if (pmIdx !== tokenIndex && pmTarget >= 0) {
                  const pmKey = `${color}-${pmIdx}`;
                  let pmCurrent = 0;
                  const pmInterval = setInterval(() => {
                    pmCurrent += 2;
                    if (pmCurrent > pmTarget) pmCurrent = pmTarget;
                    sounds.playTokenStep();
                    setDisplaySteps(prev => ({ ...prev, [pmKey]: pmCurrent }));
                    if (pmCurrent >= pmTarget) {
                      clearInterval(pmInterval);
                      setTimeout(() => {
                        setDisplaySteps(prev => {
                          const next = { ...prev };
                          delete next[pmKey];
                          return next;
                        });
                      }, 100);
                    }
                  }, 60);
                }
              });
            }
          }
        }, 40);
      };

      if (current === target && oldStep >= 0) {
        triggerDemoBanner();
        if (penalized) runReturnToYard();
        return;
      }

      const timer = setTimeout(() => {
        setDisplaySteps(prev => ({ ...prev, [key]: current }));
      }, 0);

      const isLoopAround = (oldStep >= 0 && oldStep < 51 && target < oldStep);

      const stepInterval = setInterval(() => {
        if (isLoopAround) {
          current = (current + 1) % 51;
        } else {
          current++;
        }
        sounds.playTokenStep();
        setDisplaySteps(prev => ({ ...prev, [key]: current }));

        if (current >= target) {
          clearInterval(stepInterval);
          triggerDemoBanner();

          if (penalized) {
            runReturnToYard();
          } else {
            setTimeout(() => {
              setDisplaySteps(prev => {
                const next = { ...prev };
                delete next[key];
                return next;
              });
            }, 100);
          }
        }
      }, 120);

      return () => {
        clearTimeout(timer);
        clearInterval(stepInterval);
      };
    }

    const { color, tokenIndex, oldStep, newStep, captured, reachesHome } = action;
    const key = `${color}-${tokenIndex}`;

    let current = oldStep === -1 ? 0 : oldStep;
    const target = newStep;

    const notifyCompletion = () => {
      if (captured) {
        sounds.playCapture();
        if (onActionComplete) {
          onActionComplete({
            color: color || action.color,
            title: 'EXTRA TURN!',
            subtitle: `${(color || action.color).toUpperCase()} captured an opponent! ⚔️`,
            icon: '⚔️'
          });
        }
      } else if (reachesHome) {
        sounds.playExtraTurn();
        if (onActionComplete) {
          onActionComplete({
            color: color || action.color,
            title: 'EXTRA TURN!',
            subtitle: `${(color || action.color).toUpperCase()}'s token reached Home! 🏠`,
            icon: '🏠'
          });
        }
      }
    };

    if (current === target) {
      notifyCompletion();
      return;
    }

    const timer = setTimeout(() => {
      setDisplaySteps(prev => ({ ...prev, [key]: current }));
    }, 0);

    const isLoopAround = (oldStep >= 0 && oldStep < 51 && target < oldStep);

    const stepInterval = setInterval(() => {
      if (isLoopAround) {
        current = (current + 1) % 51;
      } else {
        current++;
      }
      sounds.playTokenStep();
      setDisplaySteps(prev => ({ ...prev, [key]: current }));

      if (current === target) {
        clearInterval(stepInterval);
        notifyCompletion();

        if (captured) {
          const capKey = `${captured.color}-${captured.tokenIndex}`;
          let capStep = (captured.oldStep !== undefined && captured.oldStep >= 0) ? captured.oldStep : target;

          setDisplaySteps(prev => ({ ...prev, [capKey]: capStep }));

          const capInterval = setInterval(() => {
            capStep = capStep - 1;
            setDisplaySteps(prev => ({ ...prev, [capKey]: capStep }));
            if (capStep <= -1) {
              clearInterval(capInterval);
              setCapturedLocks(prev => {
                const next = { ...prev };
                delete next[capKey];
                return next;
              });
              setDisplaySteps(prev => {
                const next = { ...prev };
                delete next[capKey];
                delete next[key];
                return next;
              });
            }
          }, 40);
        } else {
          setTimeout(() => {
            setDisplaySteps(prev => {
              const next = { ...prev };
              delete next[key];
              return next;
            });
          }, 150);
        }
      }
    }, 90);

    return () => {
      clearTimeout(timer);
      clearInterval(stepInterval);
    };
  }, [gameState?.lastAction]);

  if (!gameState) return null;

  const { players, activeColor } = gameState;
  const isMyTurn = (activeColor === myColor);
  const killRequired = !!gameState.customRules?.killRequiredToEnterHome;
  const rotationAngle = getRotationAngle4P(myColor);

  const handleTokenClick = (color, tokenIndex, tokCx, tokCy) => {
    let targetColor = activeColor;
    let isClickable = (isMyTurn && color === activeColor && (gameState.dicePool?.length > 0 || !gameState.canRoll));

    if (gameState.appealState && gameState.appealState.inDemo) {
      if (myColor === gameState.appealState.appealingColor && color === gameState.appealState.offendingColor) {
        isClickable = true;
        targetColor = gameState.appealState.offendingColor;
      }
    }

    if (!isClickable) return;

    const player = players[targetColor];
    if (!player) return;

    const options = getValidRollOptionsForToken(player, tokenIndex, gameState.dicePool, 56, killRequired, gameState, targetColor);

    if (options.length === 0) return;

    if (options.length === 1) {
      // Direct move if only 1 roll choice is valid for this token
      setActivePopup(null);
      sounds.playTokenStep();
      onMoveToken(tokenIndex, options[0].rollIndex);
    } else {
      // Open contextual menu near token if multiple roll choices exist
      sounds.playClick();
      const popupPos = rotatePoint(tokCx, tokCy, 300, 300, rotationAngle);
      setActivePopup({
        tokenIndex,
        coords: popupPos,
        options
      });
    }
  };

  // Group all tokens by their cell location for sub-grid multi-token positioning
  const cellOccupants = {};
  const allRenderTokens = [];

  if (players) {
    const cs = 40;
    Object.keys(players).forEach(color => {
      const player = players[color];
      if (!player) return;

      player.tokens.forEach((step, tIdx) => {
        const tokenKey = `${color}-${tIdx}`;
        const stepToRender = displaySteps[tokenKey] !== undefined
          ? displaySteps[tokenKey]
          : (capturedLocks[tokenKey] !== undefined
            ? capturedLocks[tokenKey]
            : step);

        let key;
        let baseCx = 300;
        let baseCy = 300;
        let isYard = false;

        if (stepToRender === -1) {
          isYard = true;
          const spots = YARD_SPOTS_4P[color] || YARD_SPOTS_4P.red;
          const spot = spots[tIdx] || spots[0];
          baseCx = spot.c * cs + cs / 2;
          baseCy = spot.r * cs + cs / 2;
          key = `yard-${color}-${tIdx}`;
        } else if (stepToRender < 51) {
          const startPos = color === 'red' ? 0 : color === 'green' ? 13 : color === 'yellow' ? 26 : 39;
          const absIndex = (startPos + stepToRender) % 52;
          const cell = MAIN_TRACK_4P[absIndex] || MAIN_TRACK_4P[0];
          baseCx = cell.c * cs + cs / 2;
          baseCy = cell.r * cs + cs / 2;
          key = `main-${absIndex}`;
        } else {
          const homeStep = stepToRender - 51;
          const path = HOME_PATHS_4P[color] || HOME_PATHS_4P.red;
          const cell = path[Math.min(homeStep, 5)] || path[5];
          baseCx = cell.c * cs + cs / 2;
          baseCy = cell.r * cs + cs / 2;
          key = `home-${color}-${homeStep}`;
        }

        if (!cellOccupants[key]) cellOccupants[key] = [];
        const occIdx = cellOccupants[key].length;
        cellOccupants[key].push(1);

        allRenderTokens.push({
          key: `token-${color}-${tIdx}`,
          color,
          tIdx,
          step: stepToRender,
          baseCx,
          baseCy,
          cellKey: key,
          occIdx,
          isYard
        });
      });
    });
  }

  return (
    <div
      onClick={() => setActivePopup(null)}
      className="board-4p-wrapper"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        maxWidth: '100%',
        maxHeight: '100%',
        aspectRatio: '1 / 1',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        margin: '0 auto'
      }}
    >
      <svg
        viewBox="0 0 600 600"
        preserveAspectRatio="xMidYMid meet"
        style={{
          width: '100%',
          height: '100%',
          maxWidth: '100%',
          maxHeight: '100%',
          borderRadius: '16px',
          background: 'radial-gradient(circle at center, #1E293B 0%, #0F172A 100%)',
          border: '2px solid rgba(99, 102, 241, 0.4)',
          boxShadow: '0 12px 35px rgba(0,0,0,0.6), inset 0 0 30px rgba(99, 102, 241, 0.15)',
          touchAction: 'manipulation'
        }}
      >

        {/* Background Grid Cells */}
        <defs>
          <radialGradient id="centerGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#6366F1" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0F172A" stopOpacity="1" />
          </radialGradient>
        </defs>

        {/* Main Rotated Board Presentation Group */}
        <g transform={`rotate(${rotationAngle}, 300, 300)`}>

        {/* 4 Corner Yards */}
        <rect x="0" y="0" width="240" height="240" fill="#FF4757" opacity="0.85" rx="12" />
        <rect x="20" y="20" width="200" height="200" fill="#0F172A" rx="16" />

        <rect x="360" y="0" width="240" height="240" fill="#2ED573" opacity="0.85" rx="12" />
        <rect x="380" y="20" width="200" height="200" fill="#0F172A" rx="16" />

        <rect x="360" y="360" width="240" height="240" fill="#FFA502" opacity="0.85" rx="12" />
        <rect x="380" y="380" width="200" height="200" fill="#0F172A" rx="16" />

        <rect x="0" y="360" width="240" height="240" fill="#1E90FF" opacity="0.85" rx="12" />
        <rect x="20" y="380" width="200" height="200" fill="#0F172A" rx="16" />

        {/* 4 Corner Yards Bases & Integrated Player Stats Cards */}
        {/* Red Yard Bases & Stats */}
        <circle cx="52" cy="52" r="22" fill="#0F172A" stroke="#FF4757" strokeWidth="2.5" />
        <circle cx="188" cy="52" r="22" fill="#0F172A" stroke="#FF4757" strokeWidth="2.5" />
        <circle cx="52" cy="188" r="22" fill="#0F172A" stroke="#FF4757" strokeWidth="2.5" />
        <circle cx="188" cy="188" r="22" fill="#0F172A" stroke="#FF4757" strokeWidth="2.5" />
        <foreignObject x="55" y="75" width="130" height="76" transform={`rotate(${-rotationAngle}, 120, 113)`}>
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(8px)',
            borderRadius: '12px',
            border: activeColor === 'red' ? '2px solid #FF4757' : '1px solid rgba(255, 71, 87, 0.35)',
            boxShadow: activeColor === 'red' ? '0 0 12px rgba(255, 71, 87, 0.6)' : '0 4px 10px rgba(0,0,0,0.5)',
            padding: '5px 8px',
            boxSizing: 'border-box',
            color: '#FFF',
            userSelect: 'none'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
              <span style={{ fontSize: '10px', fontWeight: 900, color: '#FF4757', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                {players['red']?.name || 'RED'}
              </span>
              <span style={{ fontSize: '7.5px', color: '#94A3B8', fontWeight: 600 }}>
                {gameState?.teams?.['red'] || 'RED'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '8.5px', fontWeight: 800, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '3px' }}>
              <span style={{ color: '#EF4444' }} title="Kills">⚔️ {players['red']?.kills || 0}</span>
              <span style={{ color: '#10B981' }} title="Home Tokens">🏠 {players['red']?.tokens?.filter(s => s === 56).length || 0}/4</span>
              <span style={{ color: '#F59E0B' }} title="Appeals Left">⚖️ {players['red']?.appealsLeft ?? 3}</span>
            </div>
          </div>
        </foreignObject>

        {/* Green Yard Bases & Stats */}
        <circle cx="412" cy="52" r="22" fill="#0F172A" stroke="#2ED573" strokeWidth="2.5" />
        <circle cx="548" cy="52" r="22" fill="#0F172A" stroke="#2ED573" strokeWidth="2.5" />
        <circle cx="412" cy="188" r="22" fill="#0F172A" stroke="#2ED573" strokeWidth="2.5" />
        <circle cx="548" cy="188" r="22" fill="#0F172A" stroke="#2ED573" strokeWidth="2.5" />
        <foreignObject x="415" y="75" width="130" height="76" transform={`rotate(${-rotationAngle}, 480, 113)`}>
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(8px)',
            borderRadius: '12px',
            border: activeColor === 'green' ? '2px solid #2ED573' : '1px solid rgba(46, 213, 115, 0.35)',
            boxShadow: activeColor === 'green' ? '0 0 12px rgba(46, 213, 115, 0.6)' : '0 4px 10px rgba(0,0,0,0.5)',
            padding: '5px 8px',
            boxSizing: 'border-box',
            color: '#FFF',
            userSelect: 'none'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
              <span style={{ fontSize: '10px', fontWeight: 900, color: '#2ED573', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                {players['green']?.name || 'GREEN'}
              </span>
              <span style={{ fontSize: '7.5px', color: '#94A3B8', fontWeight: 600 }}>
                {gameState?.teams?.['green'] || 'GREEN'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '8.5px', fontWeight: 800, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '3px' }}>
              <span style={{ color: '#EF4444' }} title="Kills">⚔️ {players['green']?.kills || 0}</span>
              <span style={{ color: '#10B981' }} title="Home Tokens">🏠 {players['green']?.tokens?.filter(s => s === 56).length || 0}/4</span>
              <span style={{ color: '#F59E0B' }} title="Appeals Left">⚖️ {players['green']?.appealsLeft ?? 3}</span>
            </div>
          </div>
        </foreignObject>

        {/* Yellow Yard Bases & Stats */}
        <circle cx="412" cy="412" r="22" fill="#0F172A" stroke="#FFA502" strokeWidth="2.5" />
        <circle cx="548" cy="412" r="22" fill="#0F172A" stroke="#FFA502" strokeWidth="2.5" />
        <circle cx="412" cy="548" r="22" fill="#0F172A" stroke="#FFA502" strokeWidth="2.5" />
        <circle cx="548" cy="548" r="22" fill="#0F172A" stroke="#FFA502" strokeWidth="2.5" />
        <foreignObject x="415" y="435" width="130" height="76" transform={`rotate(${-rotationAngle}, 480, 473)`}>
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(8px)',
            borderRadius: '12px',
            border: activeColor === 'yellow' ? '2px solid #FFA502' : '1px solid rgba(255, 165, 2, 0.35)',
            boxShadow: activeColor === 'yellow' ? '0 0 12px rgba(255, 165, 2, 0.6)' : '0 4px 10px rgba(0,0,0,0.5)',
            padding: '5px 8px',
            boxSizing: 'border-box',
            color: '#FFF',
            userSelect: 'none'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
              <span style={{ fontSize: '10px', fontWeight: 900, color: '#FFA502', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                {players['yellow']?.name || 'YELLOW'}
              </span>
              <span style={{ fontSize: '7.5px', color: '#94A3B8', fontWeight: 600 }}>
                {gameState?.teams?.['yellow'] || 'YELLOW'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '8.5px', fontWeight: 800, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '3px' }}>
              <span style={{ color: '#EF4444' }} title="Kills">⚔️ {players['yellow']?.kills || 0}</span>
              <span style={{ color: '#10B981' }} title="Home Tokens">🏠 {players['yellow']?.tokens?.filter(s => s === 56).length || 0}/4</span>
              <span style={{ color: '#F59E0B' }} title="Appeals Left">⚖️ {players['yellow']?.appealsLeft ?? 3}</span>
            </div>
          </div>
        </foreignObject>

        {/* Blue Yard Bases & Stats */}
        <circle cx="52" cy="412" r="22" fill="#0F172A" stroke="#1E90FF" strokeWidth="2.5" />
        <circle cx="188" cy="412" r="22" fill="#0F172A" stroke="#1E90FF" strokeWidth="2.5" />
        <circle cx="52" cy="548" r="22" fill="#0F172A" stroke="#1E90FF" strokeWidth="2.5" />
        <circle cx="188" cy="548" r="22" fill="#0F172A" stroke="#1E90FF" strokeWidth="2.5" />
        <foreignObject x="55" y="435" width="130" height="76" transform={`rotate(${-rotationAngle}, 120, 473)`}>
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(8px)',
            borderRadius: '12px',
            border: activeColor === 'blue' ? '2px solid #1E90FF' : '1px solid rgba(30, 144, 255, 0.35)',
            boxShadow: activeColor === 'blue' ? '0 0 12px rgba(30, 144, 255, 0.6)' : '0 4px 10px rgba(0,0,0,0.5)',
            padding: '5px 8px',
            boxSizing: 'border-box',
            color: '#FFF',
            userSelect: 'none'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
              <span style={{ fontSize: '10px', fontWeight: 900, color: '#1E90FF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                {players['blue']?.name || 'BLUE'}
              </span>
              <span style={{ fontSize: '7.5px', color: '#94A3B8', fontWeight: 600 }}>
                {gameState?.teams?.['blue'] || 'BLUE'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '8.5px', fontWeight: 800, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '3px' }}>
              <span style={{ color: '#EF4444' }} title="Kills">⚔️ {players['blue']?.kills || 0}</span>
              <span style={{ color: '#10B981' }} title="Home Tokens">🏠 {players['blue']?.tokens?.filter(s => s === 56).length || 0}/4</span>
              <span style={{ color: '#F59E0B' }} title="Appeals Left">⚖️ {players['blue']?.appealsLeft ?? 3}</span>
            </div>
          </div>
        </foreignObject>

        {/* Home Stretch Highlight Track Cells */}
        {HOME_PATHS_4P.red.slice(0, 5).map((cell, idx) => (
          <rect key={`hr-${idx}`} x={cell.c * 40} y={cell.r * 40} width="40" height="40" fill="#FF4757" opacity="0.75" stroke="#0F172A" strokeWidth="1" />
        ))}
        {HOME_PATHS_4P.green.slice(0, 5).map((cell, idx) => (
          <rect key={`hg-${idx}`} x={cell.c * 40} y={cell.r * 40} width="40" height="40" fill="#2ED573" opacity="0.75" stroke="#0F172A" strokeWidth="1" />
        ))}
        {HOME_PATHS_4P.yellow.slice(0, 5).map((cell, idx) => (
          <rect key={`hy-${idx}`} x={cell.c * 40} y={cell.r * 40} width="40" height="40" fill="#FFA502" opacity="0.75" stroke="#0F172A" strokeWidth="1" />
        ))}
        {HOME_PATHS_4P.blue.slice(0, 5).map((cell, idx) => (
          <rect key={`hb-${idx}`} x={cell.c * 40} y={cell.r * 40} width="40" height="40" fill="#1E90FF" opacity="0.75" stroke="#0F172A" strokeWidth="1" />
        ))}

        {/* Track Grid Lines */}
        {MAIN_TRACK_4P.map((cell, idx) => {
          // Color start spot & safe spot 5 steps before each color's opening with that color's hex
          let fillColor = '#1E293B';
          if (idx === 0 || idx === 47) fillColor = '#FF4757'; // Red domain (Start 0 & Safe 47)
          else if (idx === 13 || idx === 8) fillColor = '#2ED573'; // Green domain (Start 13 & Safe 8)
          else if (idx === 26 || idx === 21) fillColor = '#FFA502'; // Yellow domain (Start 26 & Safe 21)
          else if (idx === 39 || idx === 34) fillColor = '#1E90FF'; // Blue domain (Start 39 & Safe 34)

          return (
            <g key={`track-${idx}`}>
              <rect x={cell.c * 40} y={cell.r * 40} width="40" height="40" fill={fillColor} opacity={fillColor === '#1E293B' ? 0.9 : 0.85} stroke="#334155" strokeWidth="1" />
            </g>
          );
        })}

        {/* Safe Stars */}
        {STAR_SPOTS_4P.map((star, i) => (
          <text key={`star-${i}`} x={star.c * 40 + 20} y={star.r * 40 + 28} fill="#F8FAFC" fontSize="22" textAnchor="middle" opacity="0.7">★</text>
        ))}

        {/* Central Home Triangle Hub */}
        <polygon points="240,240 360,240 300,300" fill="#2ED573" />
        <polygon points="360,240 360,360 300,300" fill="#FFA502" />
        <polygon points="360,360 240,360 300,300" fill="#1E90FF" />
        <polygon points="240,360 240,240 300,300" fill="#FF4757" />
        <circle cx="300" cy="300" r="28" fill="#0F172A" stroke="#F8FAFC" strokeWidth="3" />
        <text x="300" y="306" fill="#F8FAFC" fontSize="16" fontWeight="bold" textAnchor="middle" transform={`rotate(${-rotationAngle}, 300, 300)`}>LUDO</text>

        {/* Tokens Rendering */}
        {allRenderTokens.map(tok => {
          const totalOccupants = cellOccupants[tok.cellKey]?.length || 1;
          const offsetInfo = tok.isYard
            ? { dx: 0, dy: 0, r: 14 }
            : getOccupantOffset(tok.occIdx, totalOccupants);

          const cx = tok.baseCx + offsetInfo.dx;
          const cy = tok.baseCy + offsetInfo.dy;
          const r = offsetInfo.r;

          const player = players[tok.color];
          const options = (isMyTurn && tok.color === activeColor && (gameState.dicePool?.length > 0 || !gameState.canRoll))
            ? getValidRollOptionsForToken(player, tok.tIdx, gameState.dicePool, 56, killRequired, gameState, tok.color)
            : [];
          let isMoveable = options.length > 0;
          if (gameState.appealState && gameState.appealState.inDemo) {
            if (myColor === gameState.appealState.appealingColor && tok.color === gameState.appealState.offendingColor) {
              isMoveable = true;
            }
          }
          const colorHex = COLOR_HEX_4P[tok.color] || '#FFF';

          return (
            <g
              key={tok.key}
              onClick={(e) => {
                e.stopPropagation();
                handleTokenClick(tok.color, tok.tIdx, cx, cy);
              }}
              className={isMoveable ? 'token-g-moveable' : ''}
              style={{ cursor: isMoveable ? 'pointer' : 'default' }}
            >
              {/* Expanded Touch Target for Mobile */}
              <circle
                cx={cx}
                cy={cy}
                r={Math.max(r + 10, 20)}
                fill="transparent"
                style={{ pointerEvents: isMoveable ? 'all' : 'none' }}
              />
              {/* Outer Pulsing Ring for Moveable Tokens */}
              {isMoveable && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={r + 3.5}
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                  strokeDasharray="4 2"
                  className="token-moveable-ring"
                />
              )}
              {/* Main Token Circle */}
              <circle
                cx={cx}
                cy={cy}
                r={r}
                fill={colorHex}
                stroke="#FFFFFF"
                strokeWidth="2"
                className="token-body"
              />
              {/* Glossy Center Specular Dot */}
              <circle
                cx={cx - r * 0.25}
                cy={cy - r * 0.25}
                r={r * 0.35}
                fill="#FFFFFF"
                opacity="0.5"
                className="token-specular"
              />
            </g>
          );
        })}

        </g>

        {/* Contextual Roll Selection Popover near clicked token with Smart Clamping & Edge Flip */}
        {activePopup && (() => {
          const btnWidth = 40;
          const pad = 14;
          const popupWidth = activePopup.options.length * btnWidth + pad;
          const halfWidth = popupWidth / 2;
          
          // Smart X Clamping: prevents popover from ever overflowing left (x < 10) or right (x > 590)
          const clampedX = Math.max(10 + halfWidth, Math.min(590 - halfWidth, activePopup.coords.x));
          
          // Smart Y Placement: if near top edge (< 55), flips below token; if near bottom edge (> 545), stays above
          const isNearTop = activePopup.coords.y < 55;
          const isNearBottom = activePopup.coords.y > 545;
          let popY = isNearTop 
            ? activePopup.coords.y + 38 
            : isNearBottom 
              ? activePopup.coords.y - 38 
              : activePopup.coords.y - 36;
          popY = Math.max(24, Math.min(576, popY));

          return (
            <g
              transform={`translate(${clampedX}, ${popY})`}
              style={{ filter: 'drop-shadow(0 10px 25px rgba(0,0,0,0.85))' }}
            >
              <rect
                x={-halfWidth}
                y="-20"
                width={popupWidth}
                height="40"
                rx="20"
                fill="#0F172A"
                stroke="#6366F1"
                strokeWidth="2.5"
              />
              {activePopup.options.map((opt, idx) => {
                const btnX = -halfWidth + pad / 2 + idx * btnWidth + btnWidth / 2;
                return (
                  <g
                    key={`opt-${idx}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      sounds.playTokenStep();
                      onMoveToken(activePopup.tokenIndex, opt.rollIndex);
                      setActivePopup(null);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <circle cx={btnX} cy="0" r="18" fill="transparent" />
                    <circle cx={btnX} cy="0" r="15" fill={opt.val === 6 ? '#22C55E' : '#6366F1'} stroke="#FFFFFF" strokeWidth="1.5" />
                    <text x={btnX} y="4.5" fill="#FFFFFF" fontSize="13" fontWeight="900" textAnchor="middle">{opt.val}</text>
                  </g>
                );
              })}
            </g>
          );
        })()}

      </svg>
    </div>
  );
}
