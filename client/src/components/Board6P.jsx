import React from 'react';
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

export default function Board6P({ gameState, myColor, onMoveToken }) {
  if (!gameState) return null;

  const { players, validMoves, activeColor } = gameState;
  const isMyTurn = (activeColor === myColor);

  const cx = 400;
  const cy = 400;

  // Calculate Cartesian position for 72 main track steps
  // 6 Sectors, 60 deg each (0..5). Each sector has 12 track nodes.
  const getTrackCoords = (stepIndex) => {
    const totalSteps = 72;
    // Step angle around full circle (starting from top -90 deg)
    const angleRad = ((stepIndex / totalSteps) * 360 - 90) * (Math.PI / 180);
    const radius = 290;
    return {
      x: cx + radius * Math.cos(angleRad),
      y: cy + radius * Math.sin(angleRad)
    };
  };

  // Calculate Home Stretch path coords (steps 0..5 leading into center)
  const getHomePathCoords = (color, stepIndex) => {
    const cIdx = PLAYER_COLORS.indexOf(color);
    const sectorAngleRad = ((cIdx * 60) - 90) * (Math.PI / 180);
    // Home stretch moves from radius 240 down to radius 60
    const rStart = 250;
    const rEnd = 60;
    const radius = rStart - ((stepIndex / 6) * (rStart - rEnd));
    return {
      x: cx + radius * Math.cos(sectorAngleRad),
      y: cy + radius * Math.sin(sectorAngleRad)
    };
  };

  // Yard display positions for 4 tokens per color
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

  const getTokenCoords = (color, step, tokenIndex) => {
    if (step === -1) {
      return getYardCoords(color, tokenIndex);
    }
    if (step < 72) {
      const cIdx = PLAYER_COLORS.indexOf(color);
      const startStep = cIdx * 12;
      const absStep = (startStep + step) % 72;
      const pos = getTrackCoords(absStep);
      // Small jitter for stacked tokens
      const stackOffset = (tokenIndex % 4) * 4 - 6;
      return { x: pos.x + stackOffset, y: pos.y + stackOffset };
    }
    // Home stretch (72..77)
    const homeStep = step - 72;
    return getHomePathCoords(color, Math.min(homeStep, 5));
  };

  const handleTokenClick = (color, tokenIndex) => {
    if (!isMyTurn || color !== activeColor) return;
    if (validMoves.includes(tokenIndex)) {
      sounds.playTokenStep();
      onMoveToken(tokenIndex);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '720px', margin: '0 auto' }}>
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
        {players && Object.keys(players).map(color => {
          const player = players[color];
          if (!player) return null;

          return player.tokens.map((step, tIdx) => {
            const coords = getTokenCoords(color, step, tIdx);
            const isMoveable = isMyTurn && color === activeColor && validMoves.includes(tIdx);

            return (
              <g 
                key={`token-${color}-${tIdx}`} 
                onClick={() => handleTokenClick(color, tIdx)}
                style={{ cursor: isMoveable ? 'pointer' : 'default', transition: 'all 0.3s ease' }}
              >
                {isMoveable && (
                  <>
                    <circle cx={coords.x} cy={coords.y} r="18" fill="none" stroke="#FFF" strokeWidth="3" className="active-turn-ring" />
                    <g style={{ animation: 'floatArrow 0.8s infinite alternate' }}>
                      <polygon 
                        points={`${coords.x},${coords.y - 22} ${coords.x - 6},${coords.y - 34} ${coords.x + 6},${coords.y - 34}`} 
                        fill="#FFF" 
                        stroke="#6366F1" 
                        strokeWidth="1.5" 
                      />
                    </g>
                  </>
                )}
                <circle 
                  cx={coords.x} 
                  cy={coords.y} 
                  r="13" 
                  className={`token-${color} ${isMoveable ? 'token-moveable' : ''}`} 
                  stroke="#FFF" 
                  strokeWidth="2" 
                />
                <circle cx={coords.x} cy={coords.y} r="5" fill="#FFF" opacity="0.8" />
              </g>
            );
          });
        })}

      </svg>
    </div>
  );
}
