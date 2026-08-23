import React, { useState, useEffect } from 'react';
import { sounds } from '../utils/audio';

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

function YardPlayerCard({ color, player, isActive, isMe, teamName, finishStep }) {
  if (!player) {
    return (
      <div style={{
        background: 'rgba(15, 23, 42, 0.85)',
        borderRadius: '12px',
        border: '1px dashed rgba(255,255,255,0.2)',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#64748B',
        fontSize: '10px',
        fontWeight: 600
      }}>
        Empty Slot
      </div>
    );
  }

  const finishedCount = player.tokens ? player.tokens.filter(s => s === finishStep).length : 0;
  const isWinner = finishedCount === 4;

  return (
    <div style={{
      background: isActive
        ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98))'
        : 'rgba(15, 23, 42, 0.88)',
      borderRadius: '14px',
      border: isActive ? `2px solid ${COLOR_HEX_4P[color] || '#6366F1'}` : '1.5px solid rgba(255, 255, 255, 0.25)',
      boxShadow: isActive ? `0 0 20px ${COLOR_HEX_4P[color]}A0` : '0 6px 16px rgba(0, 0, 0, 0.6)',
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
    }}>
      {/* Top Row: Online Dot + Player Name + Turn Badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: 0 }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: player.connected ? '#2ED573' : '#64748B',
            boxShadow: player.connected ? '0 0 6px #2ED573' : 'none',
            flexShrink: 0
          }} />
          <span style={{
            fontWeight: 800,
            fontSize: '12px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            color: isActive ? COLOR_HEX_4P[color] : '#F8FAFC'
          }}>
            {player.name} {isMe ? '(You)' : ''}
          </span>
        </div>
        {isActive && (
          <span style={{
            background: COLOR_HEX_4P[color],
            color: '#0F172A',
            fontSize: '8px',
            fontWeight: 900,
            padding: '1px 5px',
            borderRadius: '5px',
            textTransform: 'uppercase',
            flexShrink: 0
          }}>
            TURN
          </span>
        )}
      </div>

      {/* Middle Row: Team Name & Winner Status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '9px', color: '#94A3B8' }}>
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{teamName || color.toUpperCase()}</span>
        {isWinner && <span style={{ color: '#F59E0B', fontWeight: 800 }}>🏆 WINNER</span>}
      </div>

      {/* Bottom Row: Kills, Home, Appeals Badges */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2px', paddingTop: '3px', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
        <span title="Kills" style={{ fontSize: '10px', color: '#EF4444', fontWeight: 700 }}>
          ⚔️ {player.kills || 0}
        </span>
        <span title="Tokens in Home" style={{ fontSize: '10px', color: '#10B981', fontWeight: 700 }}>
          🏠 {finishedCount}/4
        </span>
        <span title="Appeals Remaining" style={{ fontSize: '10px', color: '#F59E0B', fontWeight: 700 }}>
          ⚖️ {player.appealsLeft ?? 3}
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

function getValidRollOptionsForToken(player, tokenIndex, dicePool, finishStep = 56, killRequired = false, gameState = null, color = null) {
  if (!player || !player.tokens || !dicePool || dicePool.length === 0) return [];
  const step = player.tokens[tokenIndex];
  if (step === undefined) return [];

  const outerLen = 51;
  const lastSafeStep = 47;
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

export default function Board4P({ gameState, myColor, onMoveToken }) {
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
    if (!action || action.type !== 'MOVE') return;

    const { color, tokenIndex, oldStep, newStep, captured } = action;
    const key = `${color}-${tokenIndex}`;

    let current = oldStep === -1 ? 0 : oldStep;
    const target = newStep;

    if (current === target) return;

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

        if (captured) {
          sounds.playCapture();
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
    }, 120);

    return () => {
      clearTimeout(timer);
      clearInterval(stepInterval);
    };
  }, [gameState?.lastAction]);

  if (!gameState) return null;

  const { players, activeColor } = gameState;
  const isMyTurn = (activeColor === myColor);
  const killRequired = !!gameState.customRules?.killRequiredToEnterHome;
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
      setActivePopup({
        tokenIndex,
        coords: { x: tokCx, y: tokCy },
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
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        maxWidth: 'calc(100vh - 65px)',
        maxHeight: 'calc(100vh - 65px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        margin: '0 auto'
      }}
    >
      <svg
        viewBox="0 0 600 600"
        style={{
          width: '100%',
          height: '100%',
          maxHeight: 'calc(100vh - 65px)',
          borderRadius: '20px',
          background: 'radial-gradient(circle at center, #1E293B 0%, #0F172A 100%)',
          border: '2px solid rgba(99, 102, 241, 0.4)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6), inset 0 0 30px rgba(99, 102, 241, 0.15)'
        }}
      >

        {/* Background Grid Cells */}
        <defs>
          <radialGradient id="centerGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#6366F1" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0F172A" stopOpacity="1" />
          </radialGradient>
        </defs>

        {/* 4 Corner Yards */}
        <rect x="0" y="0" width="240" height="240" fill="#FF4757" opacity="0.85" rx="12" />
        <rect x="20" y="20" width="200" height="200" fill="#0F172A" rx="16" />

        <rect x="360" y="0" width="240" height="240" fill="#2ED573" opacity="0.85" rx="12" />
        <rect x="380" y="20" width="200" height="200" fill="#0F172A" rx="16" />

        <rect x="360" y="360" width="240" height="240" fill="#FFA502" opacity="0.85" rx="12" />
        <rect x="380" y="380" width="200" height="200" fill="#0F172A" rx="16" />

        <rect x="0" y="360" width="240" height="240" fill="#1E90FF" opacity="0.85" rx="12" />
        <rect x="20" y="380" width="200" height="200" fill="#0F172A" rx="16" />

        {/* Centered Integrated Yard Player Cards */}
        <foreignObject x="35" y="75" width="170" height="90">
          <YardPlayerCard color="red" player={players['red']} isActive={activeColor === 'red'} isMe={myColor === 'red'} teamName={gameState.teams?.['red']} finishStep={56} />
        </foreignObject>

        <foreignObject x="395" y="75" width="170" height="90">
          <YardPlayerCard color="green" player={players['green']} isActive={activeColor === 'green'} isMe={myColor === 'green'} teamName={gameState.teams?.['green']} finishStep={56} />
        </foreignObject>

        <foreignObject x="395" y="435" width="170" height="90">
          <YardPlayerCard color="yellow" player={players['yellow']} isActive={activeColor === 'yellow'} isMe={myColor === 'yellow'} teamName={gameState.teams?.['yellow']} finishStep={56} />
        </foreignObject>

        <foreignObject x="35" y="435" width="170" height="90">
          <YardPlayerCard color="blue" player={players['blue']} isActive={activeColor === 'blue'} isMe={myColor === 'blue'} teamName={gameState.teams?.['blue']} finishStep={56} />
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
        <text x="300" y="306" fill="#F8FAFC" fontSize="16" fontWeight="bold" textAnchor="middle">LUDO</text>

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
          const options = (isMyTurn && tok.color === activeColor && !gameState.canRoll)
            ? getValidRollOptionsForToken(player, tok.tIdx, gameState.dicePool, 56, killRequired)
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
            >
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

        {/* Contextual Roll Selection Popover near clicked token */}
        {activePopup && (
          <g
            transform={`translate(${activePopup.coords.x}, ${Math.max(30, activePopup.coords.y - 36)})`}
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
