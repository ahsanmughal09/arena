import React from 'react';
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

export default function Board4P({ gameState, myColor, onMoveToken }) {
  if (!gameState) return null;

  const { players, validMoves, activeColor } = gameState;
  const isMyTurn = (activeColor === myColor);

  const getPixelCoords = (color, step, tokenIndex) => {
    const cs = 40;
    if (step === -1) {
      const spot = YARD_SPOTS_4P[color][tokenIndex];
      return { x: spot.c * cs + cs / 2, y: spot.r * cs + cs / 2 };
    }
    
    let cell;
    if (step < 52) {
      const startPos = gameState.safeSpots ? (color === 'red' ? 0 : color === 'green' ? 13 : color === 'yellow' ? 26 : 39) : 0;
      const absIndex = (startPos + step) % 52;
      cell = MAIN_TRACK_4P[absIndex];
    } else {
      const homeStep = step - 52;
      cell = HOME_PATHS_4P[color][Math.min(homeStep, 5)];
    }

    if (!cell) return { x: 300, y: 300 };

    // Small offset for multiple stacked tokens
    const stackOffset = (tokenIndex % 4) * 4 - 6;
    return {
      x: cell.c * cs + cs / 2 + stackOffset,
      y: cell.r * cs + cs / 2 + stackOffset
    };
  };

  const handleTokenClick = (color, tokenIndex) => {
    if (!isMyTurn || color !== activeColor) return;
    if (validMoves.includes(tokenIndex)) {
      sounds.playTokenStep();
      onMoveToken(tokenIndex);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '600px', margin: '0 auto' }}>
      <svg viewBox="0 0 600 600" style={{ width: '100%', height: 'auto', borderRadius: '16px', background: '#0F172A', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
        
        {/* Background Grid Cells */}
        <defs>
          <radialGradient id="centerGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#6366F1" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0F172A" stopOpacity="1" />
          </radialGradient>
        </defs>

        {/* 4 Corner Yards */}
        {/* Red Yard */}
        <rect x="0" y="0" width="240" height="240" fill="url(#redYard)" rx="12" />
        <rect x="0" y="0" width="240" height="240" fill="#FF4757" opacity="0.85" rx="12" />
        <rect x="30" y="30" width="180" height="180" fill="#0F172A" rx="16" />
        
        {/* Green Yard */}
        <rect x="360" y="0" width="240" height="240" fill="#2ED573" opacity="0.85" rx="12" />
        <rect x="390" y="30" width="180" height="180" fill="#0F172A" rx="16" />

        {/* Yellow Yard */}
        <rect x="360" y="360" width="240" height="240" fill="#FFA502" opacity="0.85" rx="12" />
        <rect x="390" y="390" width="180" height="180" fill="#0F172A" rx="16" />

        {/* Blue Yard */}
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
        {players && Object.keys(players).map(color => {
          const player = players[color];
          if (!player) return null;

          return player.tokens.map((step, tIdx) => {
            const coords = getPixelCoords(color, step, tIdx);
            const isMoveable = isMyTurn && color === activeColor && validMoves.includes(tIdx);

            return (
              <g 
                key={`token-${color}-${tIdx}`} 
                onClick={() => handleTokenClick(color, tIdx)}
                style={{ cursor: isMoveable ? 'pointer' : 'default', transition: 'all 0.3s ease' }}
              >
                {/* Outer Glow Ring & Floating Turn Arrow for Moveable Token */}
                {isMoveable && (
                  <>
                    <circle cx={coords.x} cy={coords.y} r="18" fill="none" stroke="#FFF" strokeWidth="3" className="active-turn-ring" />
                    <g style={{ animation: 'floatArrow 0.8s infinite alternate' }}>
                      <polygon 
                        points={`${coords.x},${coords.y - 24} ${coords.x - 7},${coords.y - 36} ${coords.x + 7},${coords.y - 36}`} 
                        fill="#FFF" 
                        stroke="#6366F1" 
                        strokeWidth="1.5" 
                      />
                    </g>
                  </>
                )}
                {/* Token Circle */}
                <circle 
                  cx={coords.x} 
                  cy={coords.y} 
                  r="14" 
                  className={`token-${color} ${isMoveable ? 'token-moveable' : ''}`} 
                  stroke="#FFF" 
                  strokeWidth="2" 
                />
                <circle cx={coords.x} cy={coords.y} r="6" fill="#FFF" opacity="0.8" />
              </g>
            );
          });
        })}

      </svg>
    </div>
  );
}
