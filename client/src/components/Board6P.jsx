import React, { useState, useEffect } from 'react';
import { sounds } from '../utils/audio';

const PLAYER_COLORS = ['red', 'green', 'yellow', 'blue', 'orange', 'purple'];
const COLOR_HEX_6P = {
  red: '#FF4757',
  green: '#2ED573',
  yellow: '#FFA502',
  blue: '#1E90FF',
  orange: '#FF7F50',
  purple: '#A855F7'
};

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

function getValidRollOptionsForToken(player, tokenIndex, dicePool, finishStep = 76, killRequired = false, gameState = null, color = null) {
  if (!player || !player.tokens || !dicePool || dicePool.length === 0) return [];
  const step = player.tokens[tokenIndex];
  if (step === undefined) return [];

  const outerLen = 71;
  const lastSafeStep = 68;
  const hasKill = ((player.kills || 0) > 0);

  const options = [];
  const seenValues = new Set();

  dicePool.forEach((roll, rIdx) => {
    let isValid = false;
    if (step === -1) {
      if (roll === 6) isValid = true;
    } else if (step >= outerLen) {
      if (step + roll <= finishStep) isValid = true;
    } else {
      const targetStep = step + roll;
      if (!killRequired || hasKill) {
        if (targetStep <= finishStep) isValid = true;
      } else {
        if (targetStep <= lastSafeStep) {
          isValid = true;
        } else if (targetStep < outerLen) {
          // Check if landing on opponent token to kill it!
          if (gameState && gameState.players && color) {
            const colors = ['red', 'green', 'yellow', 'blue', 'orange', 'purple'];
            const cIdx = colors.indexOf(color);
            const startPos = (cIdx >= 0 ? cIdx : 0) * 12;
            const targetAbs = (startPos + targetStep) % 72;
            const safeSpots = [0, 8, 12, 20, 24, 32, 36, 44, 48, 56, 60, 68];

            if (!safeSpots.includes(targetAbs)) {
              let hasOpponent = false;
              Object.keys(gameState.players).forEach(otherColor => {
                if (otherColor !== color) {
                  const otherPlayer = gameState.players[otherColor];
                  if (otherPlayer && otherPlayer.tokens) {
                    const oIdx = colors.indexOf(otherColor);
                    const otherStart = (oIdx >= 0 ? oIdx : 0) * 12;
                    otherPlayer.tokens.forEach(otherStep => {
                      if (otherStep >= 0 && otherStep < 71) {
                        const otherAbs = (otherStart + otherStep) % 72;
                        if (otherAbs === targetAbs) hasOpponent = true;
                      }
                    });
                  }
                }
              });
              if (hasOpponent) isValid = true;
            }
          }
        }
      }
    }

    if (isValid && !seenValues.has(roll)) {
      seenValues.add(roll);
      options.push({ rollIndex: rIdx, val: roll });
    }
  });

  return options;
}

function YardPlayerCard6P({ color, player, isActive, isMe, teamName, finishStep = 76, onOpenThrowMenu }) {
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
          : player ? 'rgba(15, 23, 42, 0.85)' : 'rgba(15, 23, 42, 0.4)',
        borderRadius: '10px',
        border: isActive ? `2px solid ${COLOR_HEX_6P[color] || '#6366F1'}` : '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: isActive ? `0 0 14px ${COLOR_HEX_6P[color]}90` : '0 4px 10px rgba(0, 0, 0, 0.5)',
        padding: '4px 6px',
        color: '#FFF',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        fontSize: '9px',
        userSelect: 'none'
      }}
    >
      {/* Top Row: Name & Active Turn Badge & Target Throw Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '3px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0 }}>
          <div style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: player && player.connected ? '#2ED573' : '#64748B',
            boxShadow: player && player.connected ? '0 0 5px #2ED573' : 'none',
            flexShrink: 0
          }} />
          <span style={{ 
            fontWeight: 800, 
            fontSize: '10px',
            whiteSpace: 'nowrap', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis',
            color: isActive ? COLOR_HEX_6P[color] : player ? '#F8FAFC' : '#94A3B8'
          }}>
            {playerName} {isMe ? '(You)' : ''}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
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
                borderRadius: '5px',
                color: '#FFF',
                fontSize: '10px',
                padding: '1px 4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                lineHeight: 1
              }}
            >
              🎯
            </button>
          )}
          {isActive && (
            <span style={{
              background: COLOR_HEX_6P[color],
              color: '#0F172A',
              fontSize: '7px',
              fontWeight: 900,
              padding: '1px 4px',
              borderRadius: '4px',
              textTransform: 'uppercase',
              flexShrink: 0
            }}>
              TURN
            </span>
          )}
        </div>
      </div>

      {/* Middle Row: Team Name & Winner Status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '8px', color: '#94A3B8' }}>
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{teamName || color.toUpperCase()}</span>
        {isWinner && <span style={{ color: '#F59E0B', fontWeight: 800 }}>🏆 WINNER</span>}
      </div>

      {/* Bottom Row: Kills, Home, Appeals Badges */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2px', paddingTop: '2px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <span title="Kills" style={{ fontSize: '8px', color: '#EF4444', fontWeight: 700 }}>
          ⚔️ {player?.kills || 0}
        </span>
        <span title="Tokens in Home" style={{ fontSize: '8px', color: '#10B981', fontWeight: 700 }}>
          🏠 {finishedCount}/4
        </span>
        <span title="Appeals Remaining" style={{ fontSize: '8px', color: '#F59E0B', fontWeight: 700 }}>
          ⚖️ {player?.appealsLeft ?? 3}
        </span>
      </div>
    </div>
  );
}

export default function Board6P({ gameState, myColor, onMoveToken, onOpenThrowMenu, onActionComplete }) {
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

      const isForward = target > current;
      const stepDelta = isForward ? 1 : -1;

      const stepInterval = setInterval(() => {
        current += stepDelta;
        sounds.playTokenStep();
        setDisplaySteps(prev => ({ ...prev, [key]: current }));

        if (current === target) {
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

    const isForward = target > current;
    const stepDelta = isForward ? 1 : -1;

    const stepInterval = setInterval(() => {
      current += stepDelta;
      sounds.playTokenStep();
      setDisplaySteps(prev => ({ ...prev, [key]: current }));

      if (current === target) {
        clearInterval(stepInterval);
        notifyCompletion();

        if (captured) {
          const capKey = `${captured.color}-${captured.tokenIndex}`;
          let capCurrent = captured.oldStep !== undefined ? captured.oldStep : 0;
          const capTarget = -1;

          const capInterval = setInterval(() => {
            capCurrent -= 1;
            setDisplaySteps(prev => ({ ...prev, [capKey]: capCurrent }));

            if (capCurrent <= capTarget) {
              clearInterval(capInterval);
              setCapturedLocks(prev => {
                const next = { ...prev };
                delete next[capKey];
                return next;
              });
              setTimeout(() => {
                setDisplaySteps(prev => {
                  const next = { ...prev };
                  delete next[capKey];
                  delete next[key];
                  return next;
                });
              }, 40);
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
      clearInterval(stepInterval);
    };
  }, [gameState?.lastAction]);

  if (!gameState) return null;

  const { players, activeColor } = gameState;
  const isMyTurn = (activeColor === myColor);
  const killRequired = !!gameState.customRules?.killRequiredToEnterHome;

  const cx = 400;
  const cy = 400;

  // Calculate Cartesian position for 72 main track steps
  const getTrackCoords = (stepIndex) => {
    const totalSteps = 72;
    const angleRad = ((stepIndex / totalSteps) * 360 - 90) * (Math.PI / 180);
    const radius = 295;
    return {
      x: cx + radius * Math.cos(angleRad),
      y: cy + radius * Math.sin(angleRad)
    };
  };

  // Home path coordinates for each color
  const getHomePathCoords = (color, stepIndex) => {
    const cIdx = PLAYER_COLORS.indexOf(color);
    const validCIdx = cIdx >= 0 ? cIdx : 0;
    const sectorAngleRad = ((validCIdx * 60) - 90) * (Math.PI / 180);
    const rStart = 270;
    const rEnd = 75;
    const radius = rStart - ((stepIndex / 6) * (rStart - rEnd));
    return {
      x: cx + radius * Math.cos(sectorAngleRad),
      y: cy + radius * Math.sin(sectorAngleRad)
    };
  };

  // Yard display positions (4 corners surrounding centered info card)
  const getYardCoords = (color, tokenIndex) => {
    const cIdx = PLAYER_COLORS.indexOf(color);
    const validCIdx = cIdx >= 0 ? cIdx : 0;
    const angleRad = ((validCIdx * 60) - 90) * (Math.PI / 180);
    const baseRadius = 345;
    const baseX = cx + baseRadius * Math.cos(angleRad);
    const baseY = cy + baseRadius * Math.sin(angleRad);

    const offsets = [
      { x: -50, y: -45 },
      { x: 50, y: -45 },
      { x: -50, y: 45 },
      { x: 50, y: 45 }
    ];
    const off = offsets[tokenIndex % 4];
    return { x: baseX + off.x, y: baseY + off.y };
  };

  const handleTokenClick = (color, tokenIndex, tokCx, tokCy) => {
    let targetColor = activeColor;
    let isClickable = (isMyTurn && color === activeColor && !gameState.canRoll);

    if (gameState.appealState && gameState.appealState.inDemo) {
      if (myColor === gameState.appealState.appealingColor && color === gameState.appealState.offendingColor) {
        isClickable = true;
        targetColor = gameState.appealState.offendingColor;
      }
    }

    if (!isClickable) return;

    const player = players[targetColor];
    if (!player) return;

    const options = getValidRollOptionsForToken(player, tokenIndex, gameState.dicePool, 76, killRequired, gameState, targetColor);

    if (options.length === 0) return;

    if (options.length === 1) {
      setActivePopup(null);
      sounds.playTokenStep();
      onMoveToken(tokenIndex, options[0].rollIndex);
    } else {
      sounds.playClick();
      setActivePopup({
        tokenIndex,
        coords: { x: tokCx, y: tokCy },
        options
      });
    }
  };

  // Calculate sector center for 6 radial yard bases
  const sectors = PLAYER_COLORS.map((c, idx) => {
    const angleRad = ((idx * 60) - 90) * (Math.PI / 180);
    const baseRadius = 345;
    return {
      color: c,
      x: cx + baseRadius * Math.cos(angleRad),
      y: cy + baseRadius * Math.sin(angleRad),
      hex: COLOR_HEX_6P[c] || '#6366F1'
    };
  });

  // Group all tokens by their cell location for multi-token offset positioning
  const cellOccupants = {};
  const allRenderTokens = [];

  if (players) {
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
        let baseCx = cx;
        let baseCy = cy;
        let isYard = false;

        if (stepToRender === -1) {
          isYard = true;
          const pos = getYardCoords(color, tIdx);
          baseCx = pos.x;
          baseCy = pos.y;
          key = `yard-${color}-${tIdx}`;
        } else if (stepToRender < 71) {
          const cIdx = PLAYER_COLORS.indexOf(color);
          const startTrackIdx = (cIdx >= 0 ? cIdx : 0) * 12;
          const absIndex = (startTrackIdx + stepToRender) % 72;
          const pos = getTrackCoords(absIndex);
          baseCx = pos.x;
          baseCy = pos.y;
          key = `main-${absIndex}`;
        } else {
          const homeStep = stepToRender - 71;
          const pos = getHomePathCoords(color, Math.min(homeStep, 5));
          baseCx = pos.x;
          baseCy = pos.y;
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
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        maxHeight: 'calc(100vh - 55px)',
        aspectRatio: '1 / 1',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        margin: '0 auto'
      }}
    >
      <svg 
        viewBox="0 0 800 800" 
        style={{ 
          width: '100%', 
          height: '100%', 
          maxHeight: 'calc(100vh - 55px)', 
          borderRadius: '24px', 
          background: 'radial-gradient(circle at center, #1E293B 0%, #0F172A 100%)', 
          border: '2px solid rgba(99, 102, 241, 0.4)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6), inset 0 0 30px rgba(99, 102, 241, 0.15)' 
        }}
      >
        
        {/* Outer Hexagon Background */}
        <polygon 
          points={PLAYER_COLORS.map((_, i) => {
            const rad = ((i * 60) - 90) * (Math.PI / 180);
            return `${cx + 380 * Math.cos(rad)},${cy + 380 * Math.sin(rad)}`;
          }).join(' ')} 
          fill="#1E293B" 
          stroke="#334155" 
          strokeWidth="4" 
        />

        {/* 6 Color Sector Bases */}
        {sectors.map((sec, idx) => (
          <g key={`sec-group-${idx}`}>
            <circle cx={sec.x} cy={sec.y} r="54" fill={sec.hex} opacity="0.85" stroke="#FFFFFF" strokeWidth="2" />
            <foreignObject x={sec.x - 65} y={sec.y - 50} width="130" height="70">
              <YardPlayerCard6P 
                color={sec.color} 
                player={players[sec.color]} 
                isActive={activeColor === sec.color} 
                isMe={myColor === sec.color} 
                teamName={gameState.teams?.[sec.color]} 
                finishStep={76} 
                onOpenThrowMenu={onOpenThrowMenu}
              />
            </foreignObject>
          </g>
        ))}

        {/* 72 Track Spots */}
        {Array.from({ length: 72 }).map((_, idx) => {
          const coords = getTrackCoords(idx);
          const isStart = (idx % 12 === 0);
          const isSafe8th = (idx % 12 === 8);
          const isStar = isStart || isSafe8th;
          const colorIdx = Math.floor(idx / 12);
          const colorName = PLAYER_COLORS[colorIdx];
          const fillColor = isStar ? COLOR_HEX_6P[colorName] : '#0F172A';

          return (
            <g key={`spot-${idx}`}>
              <circle cx={coords.x} cy={coords.y} r="15" fill={fillColor} opacity={isStar ? 0.9 : 0.85} stroke="#334155" strokeWidth="1.5" />
              {isSafe8th && (
                <text x={coords.x} y={coords.y + 5} fill="#F8FAFC" fontSize="14" textAnchor="middle" opacity="0.8">★</text>
              )}
            </g>
          );
        })}

        {/* 6 Home Stretch Corridors */}
        {PLAYER_COLORS.map((color, _cIdx) => {
          return Array.from({ length: 6 }).map((_, sIdx) => {
            const coords = getHomePathCoords(color, sIdx);
            return (
              <circle key={`home-spot-${color}-${sIdx}`} cx={coords.x} cy={coords.y} r="14" fill={COLOR_HEX_6P[color]} opacity="0.8" stroke="#0F172A" strokeWidth="1.5" />
            );
          });
        })}

        {/* Central Home Finish Ring */}
        <circle cx={cx} cy={cy} r="45" fill="#0F172A" stroke="#6366F1" strokeWidth="4" />
        <text x={cx} y={cy + 6} fill="#F8FAFC" fontSize="16" fontWeight="bold" textAnchor="middle">LUDO</text>

        {/* Tokens Rendering */}
        {allRenderTokens.map(tok => {
          const totalOccupants = cellOccupants[tok.cellKey]?.length || 1;
          const offsetInfo = tok.isYard 
            ? { dx: 0, dy: 0, r: 14 } 
            : getOccupantOffset(tok.occIdx, totalOccupants);

          const tokCx = tok.baseCx + offsetInfo.dx;
          const tokCy = tok.baseCy + offsetInfo.dy;
          const r = offsetInfo.r;

          const player = players[tok.color];
          const options = (isMyTurn && tok.color === activeColor && !gameState.canRoll)
            ? getValidRollOptionsForToken(player, tok.tIdx, gameState.dicePool, 76, killRequired)
            : [];
          let isMoveable = options.length > 0;
          if (gameState.appealState && gameState.appealState.inDemo) {
            if (myColor === gameState.appealState.appealingColor && tok.color === gameState.appealState.offendingColor) {
              isMoveable = true;
            }
          }
          const colorHex = COLOR_HEX_6P[tok.color] || '#FFF';

          return (
            <g 
              key={tok.key} 
              onClick={(e) => {
                e.stopPropagation();
                handleTokenClick(tok.color, tok.tIdx, tokCx, tokCy);
              }}
              className={isMoveable ? 'token-g-moveable' : ''}
            >
              {/* Outer Pulsing Ring for Moveable Tokens */}
              {isMoveable && (
                <circle 
                  cx={tokCx} 
                  cy={tokCy} 
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
                cx={tokCx} 
                cy={tokCy} 
                r={r} 
                fill={colorHex} 
                stroke="#FFFFFF" 
                strokeWidth="2" 
                className="token-body"
              />
              {/* Glossy Center Specular Dot */}
              <circle 
                cx={tokCx - r * 0.25} 
                cy={tokCy - r * 0.25} 
                r={r * 0.35} 
                fill="#FFFFFF" 
                opacity="0.5" 
                className="token-specular"
              />
            </g>
          );
        })}

        {/* Contextual Roll Selection Popover near clicked token */}
        {activePopup && (
          <g 
            transform={`translate(${activePopup.coords.x}, ${Math.max(35, activePopup.coords.y - 38)})`}
          >
            <rect 
              x={- (activePopup.options.length * 38 + 12) / 2} 
              y="-18" 
              width={activePopup.options.length * 38 + 12} 
              height="36" 
              rx="18" 
              fill="#0F172A" 
              stroke="#6366F1" 
              strokeWidth="2" 
              filter="drop-shadow(0 8px 16px rgba(0,0,0,0.7))"
            />
            {activePopup.options.map((opt, idx) => {
              const btnX = - (activePopup.options.length * 38) / 2 + idx * 38 + 19;
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
                  <circle cx={btnX} cy="0" r="14" fill={opt.val === 6 ? '#22C55E' : '#6366F1'} stroke="#FFFFFF" strokeWidth="1.5" />
                  <text x={btnX} y="4" fill="#FFFFFF" fontSize="12" fontWeight="bold" textAnchor="middle">{opt.val}</text>
                </g>
              );
            })}
          </g>
        )}

      </svg>
    </div>
  );
}
