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
  { c: 14, r: 7 }, // right tip (25)
  { c: 14, r: 8 }, { c: 13, r: 8 }, { c: 12, r: 8 }, { c: 11, r: 8 }, { c: 10, r: 8 }, { c: 9, r: 8 }, // Yellow start at step 26 (13, 8)
  { c: 8, r: 9 }, { c: 8, r: 10 }, { c: 8, r: 11 }, { c: 8, r: 12 }, { c: 8, r: 13 }, { c: 8, r: 14 },
  { c: 7, r: 14 }, // bottom tip (38)
  { c: 6, r: 14 }, { c: 6, r: 13 }, { c: 6, r: 12 }, { c: 6, r: 11 }, { c: 6, r: 10 }, { c: 6, r: 9 }, // Blue start at step 39 (6, 13)
  { c: 5, r: 8 }, { c: 4, r: 8 }, { c: 3, r: 8 }, { c: 2, r: 8 }, { c: 1, r: 8 }, { c: 0, r: 8 },
  { c: 0, r: 7 }, // left tip (51)
];

// Home paths for each color (steps 52..57)
const HOME_PATHS_4P = {
  red:    [{ c: 1, r: 7 }, { c: 2, r: 7 }, { c: 3, r: 7 }, { c: 4, r: 7 }, { c: 5, r: 7 }, { c: 6, r: 7 }],
  green:  [{ c: 7, r: 1 }, { c: 7, r: 2 }, { c: 7, r: 3 }, { c: 7, r: 4 }, { c: 7, r: 5 }, { c: 7, r: 6 }],
  yellow: [{ c: 13, r: 7 }, { c: 12, r: 7 }, { c: 11, r: 7 }, { c: 10, r: 7 }, { c: 9, r: 7 }, { c: 8, r: 7 }],
  blue:   [{ c: 7, r: 13 }, { c: 7, r: 12 }, { c: 7, r: 11 }, { c: 7, r: 10 }, { c: 7, r: 9 }, { c: 7, r: 8 }]
};

// Yard token display coords (col, row)
const YARD_SPOTS_4P = {
  red:    [{ c: 1.5, r: 1.5 }, { c: 3.5, r: 1.5 }, { c: 1.5, r: 3.5 }, { c: 3.5, r: 3.5 }],
  green:  [{ c: 10.5, r: 1.5 }, { c: 12.5, r: 1.5 }, { c: 10.5, r: 3.5 }, { c: 12.5, r: 3.5 }],
  yellow: [{ c: 10.5, r: 10.5 }, { c: 12.5, r: 10.5 }, { c: 10.5, r: 12.5 }, { c: 12.5, r: 12.5 }],
  blue:   [{ c: 1.5, r: 10.5 }, { c: 3.5, r: 10.5 }, { c: 1.5, r: 12.5 }, { c: 3.5, r: 12.5 }]
};

const SAFE_INDICES_4P = [0, 8, 13, 21, 26, 34, 39, 47];
const STAR_SPOTS_4P = SAFE_INDICES_4P.map(idx => MAIN_TRACK_4P[idx]);

const COLOR_HEX_4P = {
  red: '#FF4757',
  green: '#2ED573',
  yellow: '#FFA502',
  blue: '#1E90FF'
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

function getValidRollOptionsForToken(player, tokenIndex, dicePool, finishStep = 57) {
  if (!player || !player.tokens || !dicePool || dicePool.length === 0) return [];
  const step = player.tokens[tokenIndex];
  if (step === undefined) return [];

  const options = [];
  const seenValues = new Set();

  dicePool.forEach((roll, rIdx) => {
    let isValid = false;
    if (step === -1) {
      if (roll === 6) isValid = true;
    } else if (step < finishStep) {
      if (step + roll <= finishStep) isValid = true;
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

  useEffect(() => {
    const anim = requestAnimationFrame(() => setActivePopup(null));
    return () => cancelAnimationFrame(anim);
  }, [gameState?.activeColor, gameState?.dicePool?.length]);

  if (!gameState) return null;

  const { players, activeColor } = gameState;
  const isMyTurn = (activeColor === myColor);

  const handleTokenClick = (color, tokenIndex, tokCx, tokCy) => {
    if (!isMyTurn || color !== activeColor || gameState.canRoll) return;

    const player = players[color];
    const options = getValidRollOptionsForToken(player, tokenIndex, gameState.dicePool, 57);

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
        let key;
        let baseCx = 300;
        let baseCy = 300;
        let isYard = false;

        if (step === -1) {
          isYard = true;
          const spot = YARD_SPOTS_4P[color][tIdx];
          baseCx = spot.c * cs + cs / 2;
          baseCy = spot.r * cs + cs / 2;
          key = `yard-${color}-${tIdx}`;
        } else if (step < 52) {
          const startPos = color === 'red' ? 0 : color === 'green' ? 13 : color === 'yellow' ? 26 : 39;
          const absIndex = (startPos + step) % 52;
          const cell = MAIN_TRACK_4P[absIndex];
          baseCx = cell.c * cs + cs / 2;
          baseCy = cell.r * cs + cs / 2;
          key = `main-${absIndex}`;
        } else {
          const homeStep = step - 52;
          const cell = HOME_PATHS_4P[color][Math.min(homeStep, 5)];
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
          step,
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
      style={{ position: 'relative', width: '100%', maxWidth: '600px', margin: '0 auto' }}
    >
      <svg viewBox="0 0 600 600" style={{ width: '100%', height: 'auto', borderRadius: '16px', background: '#0F172A', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
        
        {/* Background Grid Cells */}
        <defs>
          <radialGradient id="centerGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#6366F1" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0F172A" stopOpacity="1" />
          </radialGradient>
        </defs>

        {/* 4 Corner Yards */}
        <rect x="0" y="0" width="240" height="240" fill="#FF4757" opacity="0.85" rx="12" />
        <rect x="30" y="30" width="180" height="180" fill="#0F172A" rx="16" />
        
        <rect x="360" y="0" width="240" height="240" fill="#2ED573" opacity="0.85" rx="12" />
        <rect x="390" y="30" width="180" height="180" fill="#0F172A" rx="16" />

        <rect x="360" y="360" width="240" height="240" fill="#FFA502" opacity="0.85" rx="12" />
        <rect x="390" y="390" width="180" height="180" fill="#0F172A" rx="16" />

        <rect x="0" y="360" width="240" height="240" fill="#1E90FF" opacity="0.85" rx="12" />
        <rect x="30" y="390" width="180" height="180" fill="#0F172A" rx="16" />

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
          const isRedStart = idx === 0;
          const isGreenStart = idx === 13;
          const isYellowStart = idx === 26;
          const isBlueStart = idx === 39;
          const isSafe8thSquare = [8, 21, 34, 47].includes(idx);
          
          let fillColor = '#1E293B';
          if (isRedStart) fillColor = '#FF4757';
          else if (isGreenStart) fillColor = '#2ED573';
          else if (isYellowStart) fillColor = '#FFA502';
          else if (isBlueStart) fillColor = '#1E90FF';
          else if (isSafe8thSquare) fillColor = '#334155';

          return (
            <g key={`track-${idx}`}>
              <rect x={cell.c * 40} y={cell.r * 40} width="40" height="40" fill={fillColor} opacity={fillColor === '#1E293B' ? 0.9 : 0.8} stroke="#334155" strokeWidth="1" />
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
            ? getValidRollOptionsForToken(player, tok.tIdx, gameState.dicePool, 57)
            : [];
          const isMoveable = options.length > 0;
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
