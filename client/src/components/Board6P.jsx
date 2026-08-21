import React, { useState, useEffect } from 'react';
import { sounds } from '../utils/audio';

const PLAYER_COLORS = ['red', 'green', 'yellow', 'blue', 'orange', 'purple'];
const COLOR_HEX = {
  red: '#FF4757',
  green: '#2ED573',
  yellow: '#FFA502',
  blue: '#1E90FF',
  orange: '#FF6B81',
  purple: '#A55EEA'
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

function getValidRollOptionsForToken(player, tokenIndex, dicePool, finishStep = 77) {
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

export default function Board6P({ gameState, myColor, onMoveToken }) {
  const [activePopup, setActivePopup] = useState(null);

  useEffect(() => {
    const anim = requestAnimationFrame(() => setActivePopup(null));
    return () => cancelAnimationFrame(anim);
  }, [gameState?.activeColor, gameState?.dicePool?.length]);

  if (!gameState) return null;

  const { players, activeColor } = gameState;
  const isMyTurn = (activeColor === myColor);

  const cx = 400;
  const cy = 400;

  // Calculate Cartesian position for 72 main track steps
  const getTrackCoords = (stepIndex) => {
    const totalSteps = 72;
    const angleRad = ((stepIndex / totalSteps) * 360 - 90) * (Math.PI / 180);
    const radius = 290;
    return {
      x: cx + radius * Math.cos(angleRad),
      y: cy + radius * Math.sin(angleRad)
    };
  };

  // Calculate Home Stretch path coords
  const getHomePathCoords = (color, stepIndex) => {
    const cIdx = PLAYER_COLORS.indexOf(color);
    const sectorAngleRad = ((cIdx * 60) - 90) * (Math.PI / 180);
    const rStart = 250;
    const rEnd = 60;
    const radius = rStart - ((stepIndex / 6) * (rStart - rEnd));
    return {
      x: cx + radius * Math.cos(sectorAngleRad),
      y: cy + radius * Math.sin(sectorAngleRad)
    };
  };

  // Yard display positions
  const getYardCoords = (color, tokenIndex) => {
    const cIdx = PLAYER_COLORS.indexOf(color);
    const angleRad = ((cIdx * 60) - 90) * (Math.PI / 180);
    const baseRadius = 345;
    const baseX = cx + baseRadius * Math.cos(angleRad);
    const baseY = cy + baseRadius * Math.sin(angleRad);

    const offsets = [
      { x: -14, y: -14 },
      { x: 14, y: -14 },
      { x: -14, y: 14 },
      { x: 14, y: 14 }
    ];
    const off = offsets[tokenIndex % 4];
    return { x: baseX + off.x, y: baseY + off.y };
  };

  const handleTokenClick = (color, tokenIndex, tokCx, tokCy) => {
    if (!isMyTurn || color !== activeColor || gameState.canRoll) return;

    const player = players[color];
    const options = getValidRollOptionsForToken(player, tokenIndex, gameState.dicePool, 77);

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

  // Group all tokens by their cell location for sub-grid multi-token positioning
  const cellOccupants = {};
  const allRenderTokens = [];

  if (players) {
    Object.keys(players).forEach(color => {
      const player = players[color];
      if (!player) return;

      player.tokens.forEach((step, tIdx) => {
        let key;
        let basePos = { x: 400, y: 400 };
        let isYard = false;

        if (step === -1) {
          isYard = true;
          basePos = getYardCoords(color, tIdx);
          key = `yard-${color}-${tIdx}`;
        } else if (step < 72) {
          const cIdx = PLAYER_COLORS.indexOf(color);
          const startStep = cIdx * 12;
          const absStep = (startStep + step) % 72;
          basePos = getTrackCoords(absStep);
          key = `main-${absStep}`;
        } else {
          const homeStep = step - 72;
          basePos = getHomePathCoords(color, Math.min(homeStep, 5));
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
          baseCx: basePos.x,
          baseCy: basePos.y,
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
      style={{ position: 'relative', width: '100%', maxWidth: 'min(620px, calc(100vh - 100px))', margin: '0 auto' }}
    >
      <svg viewBox="0 0 800 800" style={{ width: '100%', height: 'auto', borderRadius: '24px', background: '#0F172A', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
        
        <defs>
          <filter id="glowHex" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Hexagonal Star Background Structure */}
        <polygon 
          points={PLAYER_COLORS.map((_, i) => {
            const rad = ((i * 60) - 90) * (Math.PI / 180);
            return `${cx + 380 * Math.cos(rad)},${cy + 380 * Math.sin(rad)}`;
          }).join(' ')} 
          fill="#161E2E" 
          stroke="rgba(255,255,255,0.1)" 
          strokeWidth="2" 
        />

        {/* 6 Yard Base Circles */}
        {PLAYER_COLORS.map((color, i) => {
          const rad = ((i * 60) - 90) * (Math.PI / 180);
          const bx = cx + 345 * Math.cos(rad);
          const by = cy + 345 * Math.sin(rad);
          return (
            <g key={`yard-base-${color}`}>
              <circle cx={bx} cy={by} r="34" fill={COLOR_HEX[color]} opacity="0.85" />
              <circle cx={bx} cy={by} r="26" fill="#0F172A" stroke="#FFF" strokeWidth="2" />
            </g>
          );
        })}

        {/* 6 Home Stretch Corridors */}
        {PLAYER_COLORS.map(color => (
          [0, 1, 2, 3, 4].map(hStep => {
            const pos = getHomePathCoords(color, hStep);
            return (
              <circle 
                key={`home-path-${color}-${hStep}`} 
                cx={pos.x} 
                cy={pos.y} 
                r="13" 
                fill={COLOR_HEX[color]} 
                opacity="0.75" 
                stroke="#0F172A" 
                strokeWidth="1.5" 
              />
            );
          })
        ))}

        {/* 72 Main Loop Track Nodes */}
        {Array.from({ length: 72 }).map((_, stepIdx) => {
          const pos = getTrackCoords(stepIdx);
          const sectorColorIdx = Math.floor(stepIdx / 12);
          const isStartNode = (stepIdx % 12 === 0);
          const isStarNode = (stepIdx % 12 === 8);
          const colorName = PLAYER_COLORS[sectorColorIdx];

          let fill = '#1E293B';
          if (isStartNode) fill = COLOR_HEX[colorName];

          return (
            <g key={`track-node-${stepIdx}`}>
              <circle 
                cx={pos.x} 
                cy={pos.y} 
                r={isStartNode || isStarNode ? 14 : 12} 
                fill={fill} 
                stroke="#334155" 
                strokeWidth="1.5" 
              />
              {(isStartNode || isStarNode) && (
                <text x={pos.x} y={pos.y + 5} fill="#FFF" fontSize="14" textAnchor="middle">★</text>
              )}
            </g>
          );
        })}

        {/* Central Hexagon Finish Hub */}
        <polygon 
          points={PLAYER_COLORS.map((_, i) => {
            const rad = ((i * 60) - 90) * (Math.PI / 180);
            return `${cx + 50 * Math.cos(rad)},${cy + 50 * Math.sin(rad)}`;
          }).join(' ')} 
          fill="#0F172A" 
          stroke="#6366F1" 
          strokeWidth="4" 
          filter="url(#glowHex)"
        />
        <text x={cx} y={cy + 6} fill="#F8FAFC" fontSize="20" fontWeight="bold" textAnchor="middle">LUDO 6P</text>

        {/* Tokens Rendering */}
        {allRenderTokens.map(tok => {
          const totalOccupants = cellOccupants[tok.cellKey]?.length || 1;
          const offsetInfo = tok.isYard 
            ? { dx: 0, dy: 0, r: 13 } 
            : getOccupantOffset(tok.occIdx, totalOccupants);

          const tokCx = tok.baseCx + offsetInfo.dx;
          const tokCy = tok.baseCy + offsetInfo.dy;
          const r = offsetInfo.r;

          const player = players[tok.color];
          const options = (isMyTurn && tok.color === activeColor && !gameState.canRoll)
            ? getValidRollOptionsForToken(player, tok.tIdx, gameState.dicePool, 77)
            : [];
          const isMoveable = options.length > 0;
          const colorHex = COLOR_HEX[tok.color] || '#FFF';

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
              />
            </g>
          );
        })}

        {/* Contextual Roll Selection Popover near clicked token */}
        {activePopup && (
          <g 
            transform={`translate(${activePopup.coords.x}, ${Math.max(40, activePopup.coords.y - 36)})`}
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
