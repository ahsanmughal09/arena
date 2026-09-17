import React, { useState, useEffect } from 'react';
import DiceRoller from './DiceRoller';
import SnakeItem from './SnakeItem';
import { sounds } from '../utils/audio';
import { Crown, Sparkles, Zap, MessageSquare } from 'lucide-react';

const LADDERS = {
  9: 31,
  20: 38,
  28: 84,
  40: 59,
  51: 73,
  63: 81,
  71: 91
};

const SNAKES = {
  17: 7,
  54: 34,
  62: 19,
  64: 60,
  87: 24,
  93: 73,
  95: 75,
  99: 78
};

const PLAYER_COLORS = {
  red: { hex: '#FF4757', border: '#FF6B81', name: 'Red', gradient: 'linear-gradient(135deg, #FF4757, #FF6B81)', glow: 'rgba(255, 71, 87, 0.6)' },
  yellow: { hex: '#FFA502', border: '#FFC048', name: 'Yellow', gradient: 'linear-gradient(135deg, #FFA502, #FFC048)', glow: 'rgba(255, 165, 2, 0.6)' },
  green: { hex: '#2ED573', border: '#7BED9F', name: 'Green', gradient: 'linear-gradient(135deg, #2ED573, #7BED9F)', glow: 'rgba(46, 213, 115, 0.6)' },
  blue: { hex: '#1E90FF', border: '#70A1FF', name: 'Blue', gradient: 'linear-gradient(135deg, #1E90FF, #70A1FF)', glow: 'rgba(30, 144, 255, 0.6)' }
};

// Rich tile color palette for 10x10 board grid
const TILE_PALETTE = [
  '#1E293B', '#0F172A', '#1E1B4B', '#172554', '#064E3B', 
  '#312E81', '#1E293B', '#365314', '#1E1B4B', '#0F172A'
];

/**
 * Calculates percentage center coordinates (x%, y%) inside a 100% x 100% 10x10 grid.
 * Boustrophedon path (Cell 1 bottom-left, Cell 10 bottom-right, Cell 11 above 10 going left, etc.)
 */
function getCellCoords(n) {
  if (n <= 0) return { x: 5, y: 105 }; // start dock off-board
  if (n > 100) n = 100;

  const rowFromBottom = Math.floor((n - 1) / 10);
  const isReverseRow = rowFromBottom % 2 === 1;
  const colIndex = (n - 1) % 10;

  const col = isReverseRow ? (9 - colIndex) : colIndex;
  const row = 9 - rowFromBottom;

  const x = (col + 0.5) * 10; // 5% to 95%
  const y = (row + 0.5) * 10; // 5% to 95%
  return { x, y, col, row, rowFromBottom };
}

export default function BoardSnakesLadders({
  gameState,
  myColor,
  slots,
  onRollDice,
  onMoveToken,
  timeLeft,
  onOpenThrowMenu,
  onOpenReactionPicker,
  onToggleMobileChat
}) {
  const [tokenPositions, setTokenPositions] = useState({});
  const [stepState, setStepState] = useState(null); // { color, isMoving }
  const [slidingColor, setSlidingColor] = useState(null);
  const lastProcessedMoveIdRef = React.useRef(null);
  const isAnimatingRef = React.useRef(false);
  const animationTimeoutIdsRef = React.useRef([]);

  const clearAllAnimationTimeouts = () => {
    animationTimeoutIdsRef.current.forEach(id => clearTimeout(id));
    animationTimeoutIdsRef.current = [];
  };

  useEffect(() => {
    return () => clearAllAnimationTimeouts();
  }, []);

  // Discrete Step-by-Step Box Hopping -> Pause on Climb/Bite Box -> Smooth Slide Along Ladder/Snake
  useEffect(() => {
    if (!gameState || !gameState.players) return;

    const moveRes = gameState.lastMoveResult;

    if (
      moveRes &&
      moveRes.success &&
      moveRes.from !== undefined &&
      moveRes.finalPos !== undefined &&
      moveRes.moveId &&
      moveRes.moveId !== lastProcessedMoveIdRef.current
    ) {
      lastProcessedMoveIdRef.current = moveRes.moveId;
      isAnimatingRef.current = true;
      clearAllAnimationTimeouts();

      const { color, from, landedOn, finalPos, isLadder, isSnake } = moveRes;

      // Build array of individual box steps: [from + 1, from + 2, ..., landedOn]
      const stepTiles = [];
      const startTile = Math.max(1, from + 1);
      for (let tile = startTile; tile <= landedOn; tile++) {
        stepTiles.push(tile);
      }

      // Lock starting visual position to 'from' tile immediately
      setTokenPositions(prev => ({ ...prev, [color]: from }));
      setStepState(null);
      setSlidingColor(null);

      let cumulativeDelay = 40; // initial delay before first hop

      // Schedule discrete box hops: 160ms hop + 200ms landing pause = 360ms per box step
      stepTiles.forEach((tile) => {
        // Hop phase: Lift up & move position to target tile over 160ms
        const hopTimeout = setTimeout(() => {
          setTokenPositions(prev => ({ ...prev, [color]: tile }));
          setStepState({ color, isMoving: true });
          if (sounds.playMove) sounds.playMove();
        }, cumulativeDelay);
        animationTimeoutIdsRef.current.push(hopTimeout);

        // Landing phase: Arrived at tile, snap down, set position transition to 'none' & rest for 200ms
        const landTimeout = setTimeout(() => {
          setStepState({ color, isMoving: false });
        }, cumulativeDelay + 160);
        animationTimeoutIdsRef.current.push(landTimeout);

        cumulativeDelay += 360;
      });

      // Schedule actions after box-by-box steps complete
      const finishWalkingTimeout = setTimeout(() => {
        setStepState(null);

        if (isLadder || isSnake) {
          // Pause 400ms on the climb/bite box so player clearly sees landing on base/head
          const slidePauseTimeout = setTimeout(() => {
            setSlidingColor(color);
            if (isLadder && sounds.playLadderClimb) sounds.playLadderClimb();
            else if (isSnake && sounds.playSnakeBite) sounds.playSnakeBite();
            else if (sounds.playMove) sounds.playMove();

            // Slide token from climb/bite box to final ladder top or snake tail
            setTokenPositions(prev => ({ ...prev, [color]: finalPos }));

            const finishSlideTimeout = setTimeout(() => {
              setSlidingColor(null);
              isAnimatingRef.current = false;
            }, 750);

            animationTimeoutIdsRef.current.push(finishSlideTimeout);
          }, 400);

          animationTimeoutIdsRef.current.push(slidePauseTimeout);
        } else {
          isAnimatingRef.current = false;
        }
      }, cumulativeDelay);

      animationTimeoutIdsRef.current.push(finishWalkingTimeout);
    } else {
      // Sync static positions ONLY when no animation sequence is actively running
      if (!isAnimatingRef.current) {
        setTokenPositions(prev => {
          const next = { ...prev };
          let changed = false;
          Object.keys(gameState.players).forEach(c => {
            const p = gameState.players[c];
            if (p && p.connected && next[c] !== p.position) {
              next[c] = p.position;
              changed = true;
            }
          });
          return changed ? next : prev;
        });
      }
    }
  }, [gameState?.lastMoveResult, gameState?.players]);

  if (!gameState) return null;

  const { activeColor, canRoll, currentDice, validMoves, players, gameOver } = gameState;
  const isMyTurn = activeColor === myColor;

  // Build 100 tiles (Row 10 to 1 top to bottom)
  const cells = [];
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      const rowFromBottom = 9 - r;
      const isReverseRow = rowFromBottom % 2 === 1;
      const colIndex = isReverseRow ? (9 - c) : c;
      const cellNum = rowFromBottom * 10 + colIndex + 1;

      const isFinish = cellNum === 100;
      const isStart = cellNum === 1;
      const ladderTarget = LADDERS[cellNum];
      const snakeTarget = SNAKES[cellNum];

      let bgStyle = 'linear-gradient(135deg, rgba(30, 41, 59, 0.85), rgba(15, 23, 42, 0.95))';
      let borderStyle = '1px solid rgba(255, 255, 255, 0.08)';

      if (isFinish) {
        bgStyle = 'linear-gradient(135deg, #FFD700 0%, #FF8C00 100%)';
        borderStyle = '2px solid #FFF';
      } else if (isStart) {
        bgStyle = 'linear-gradient(135deg, #10B981 0%, #059669 100%)';
        borderStyle = '2px solid #34D399';
      } else if (ladderTarget) {
        bgStyle = 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(180, 83, 9, 0.35))';
        borderStyle = '1px solid rgba(245, 158, 11, 0.5)';
      } else if (snakeTarget) {
        bgStyle = 'linear-gradient(135deg, rgba(239, 68, 68, 0.3), rgba(153, 27, 27, 0.45))';
        borderStyle = '1px solid rgba(239, 68, 68, 0.6)';
      } else {
        const palIdx = (cellNum + r) % TILE_PALETTE.length;
        bgStyle = `linear-gradient(135deg, ${TILE_PALETTE[palIdx]}, rgba(15, 23, 42, 0.9))`;
      }

      cells.push(
        <div
          key={cellNum}
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: bgStyle,
            border: borderStyle,
            borderRadius: '4px',
            userSelect: 'none',
            overflow: 'hidden',
            boxShadow: isFinish ? '0 0 20px rgba(255, 215, 0, 0.8)' : 'none'
          }}
        >
          {/* Tile Number - Bold High Contrast */}
          <span
            style={{
              position: 'absolute',
              top: '2px',
              left: '4px',
              fontSize: 'min(1.1vw, 13px)',
              fontWeight: 900,
              color: isFinish ? '#000' : isStart ? '#FFF' : 'rgba(255, 255, 255, 0.9)',
              textShadow: isFinish ? 'none' : '0 1px 3px rgba(0, 0, 0, 0.95)',
              letterSpacing: '-0.5px'
            }}
          >
            {cellNum}
          </span>

          {/* Goal 100 Badge */}
          {isFinish && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#000', marginTop: '6px' }}>
              <Crown size={26} color="#000" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' }} />
              <span style={{ fontSize: 'min(0.9vw, 11px)', fontWeight: 900 }}>100 GOAL</span>
            </div>
          )}

          {/* Start 1 Tile */}
          {isStart && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#FFF', marginTop: '6px' }}>
              <Sparkles size={16} />
              <span style={{ fontSize: 'min(0.8vw, 10px)', fontWeight: 900 }}>START</span>
            </div>
          )}

        </div>
      );
    }
  }

  // Draw Realistic SVG Snakes & 3D Ladders
  const renderSVGOverlay = () => {
    return (
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 10
        }}
      >
        <defs>
          {/* Ladder Metallic/Gold Gradient */}
          <linearGradient id="ladderRailGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FBBF24" />
            <stop offset="50%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#78350F" />
          </linearGradient>

          <linearGradient id="ladderRungGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>

          {/* Snake Gradients */}
          <linearGradient id="snakeRedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF4D4D" />
            <stop offset="50%" stopColor="#DC2626" />
            <stop offset="100%" stopColor="#7F1D1D" />
          </linearGradient>

          <linearGradient id="snakeGreenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="50%" stopColor="#059669" />
            <stop offset="100%" stopColor="#064E3B" />
          </linearGradient>

          <linearGradient id="snakePurpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C084FC" />
            <stop offset="50%" stopColor="#7E22CE" />
            <stop offset="100%" stopColor="#3B0764" />
          </linearGradient>

          {/* SVG Shadow */}
          <filter id="svgShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0.3" dy="0.6" stdDeviation="0.4" floodColor="#000" floodOpacity="0.75" />
          </filter>
        </defs>

        {/* Render Ladders (Bottom Start to Top End) */}
        {Object.keys(LADDERS).map(start => {
          const climbStartCell = parseInt(start, 10);
          const climbEndCell = LADDERS[climbStartCell];
          const startC = getCellCoords(climbStartCell);
          const endC = getCellCoords(climbEndCell);

          const dx = endC.x - startC.x;
          const dy = endC.y - startC.y;
          const len = Math.sqrt(dx * dx + dy * dy);

          // Perpendicular offset for rails
          const px = (-dy / len) * 1.8;
          const py = (dx / len) * 1.8;

          const r1Start = { x: startC.x + px, y: startC.y + py };
          const r1End = { x: endC.x + px, y: endC.y + py };
          const r2Start = { x: startC.x - px, y: startC.y - py };
          const r2End = { x: endC.x - px, y: endC.y - py };

          // Rungs
          const rungCount = Math.max(3, Math.floor(len / 6.5));
          const rungs = [];

          for (let i = 1; i <= rungCount; i++) {
            const t = i / (rungCount + 1);
            const rx1 = r1Start.x + t * (r1End.x - r1Start.x);
            const ry1 = r1Start.y + t * (r1End.y - r1Start.y);
            const rx2 = r2Start.x + t * (r2End.x - r2Start.x);
            const ry2 = r2Start.y + t * (r2End.y - r2Start.y);

            rungs.push(
              <line
                key={`rung_${climbStartCell}_${i}`}
                x1={rx1}
                y1={ry1}
                x2={rx2}
                y2={ry2}
                stroke="url(#ladderRungGrad)"
                strokeWidth="0.45"
                strokeLinecap="round"
                filter="url(#svgShadow)"
              />
            );
          }

          return (
            <g key={`ladder_${climbStartCell}`}>
              <line
                x1={r1Start.x}
                y1={r1Start.y}
                x2={r1End.x}
                y2={r1End.y}
                stroke="url(#ladderRailGrad)"
                strokeWidth="0.6"
                strokeLinecap="round"
                filter="url(#svgShadow)"
              />
              <line
                x1={r2Start.x}
                y1={r2Start.y}
                x2={r2End.x}
                y2={r2End.y}
                stroke="url(#ladderRailGrad)"
                strokeWidth="0.6"
                strokeLinecap="round"
                filter="url(#svgShadow)"
              />
              {rungs}
            </g>
          );
        })}

        {/* Render Modular Realistic Snakes (Snake Head at BITE cell, Snake Tail at DROP cell) */}
        {Object.keys(SNAKES).map((headKey, idx) => {
          const biteCell = parseInt(headKey, 10);
          const dropCell = SNAKES[biteCell];

          const headC = getCellCoords(biteCell);
          const tailC = getCellCoords(dropCell);
          const colorTheme = idx % 3 === 0 ? 'red' : idx % 3 === 1 ? 'green' : 'purple';

          return (
            <SnakeItem
              key={`snake_${biteCell}`}
              id={`snake_${biteCell}`}
              headCell={biteCell}
              tailCell={dropCell}
              headC={headC}
              tailC={tailC}
              colorTheme={colorTheme}
            />
          );
        })}
      </svg>
    );
  };

  // Render 3D Player Chips
  const renderPlayerTokens = () => {
    const cellOccupants = {};
    const colors = ['red', 'yellow', 'green', 'blue'];

    colors.forEach(color => {
      const pos = tokenPositions[color] !== undefined ? tokenPositions[color] : (players[color]?.position || 0);
      if (!cellOccupants[pos]) cellOccupants[pos] = [];
      cellOccupants[pos].push(color);
    });

    return colors.map(color => {
      const player = players[color];
      if (!player || !player.connected) return null;

      const pos = tokenPositions[color] !== undefined ? tokenPositions[color] : player.position;
      const coords = getCellCoords(pos);

      // Offset if multiple players are on the same cell
      const sharing = cellOccupants[pos] || [color];
      const idxInCell = sharing.indexOf(color);
      let offsetX = 0;
      let offsetY = 0;

      if (sharing.length > 1 && pos > 0) {
        const angle = (idxInCell / sharing.length) * 2 * Math.PI;
        offsetX = Math.cos(angle) * 2.2;
        offsetY = Math.sin(angle) * 2.2;
      }

      const isCurrentActive = activeColor === color;
      const isMyChip = color === myColor;

      const isHopping = stepState?.color === color && stepState.isMoving;
      const isLanding = stepState?.color === color && !stepState.isMoving;
      const isSliding = slidingColor === color;

      let transitionStyle = 'left 0.3s ease-out, top 0.3s ease-out, transform 0.3s ease-out';
      let transformStyle = isCurrentActive ? 'translate(-50%, -50%) scale(1.05)' : 'translate(-50%, -50%) scale(1.0)';

      if (isHopping) {
        transitionStyle = 'left 0.16s cubic-bezier(0.25, 1, 0.5, 1), top 0.16s cubic-bezier(0.25, 1, 0.5, 1), transform 0.16s ease-out';
        transformStyle = 'translate(-50%, -85%) scale(1.35)';
      } else if (isLanding) {
        transitionStyle = 'transform 0.1s ease-in';
        transformStyle = 'translate(-50%, -50%) scale(1.0)';
      } else if (isSliding) {
        transitionStyle = 'left 0.75s cubic-bezier(0.25, 1, 0.5, 1), top 0.75s cubic-bezier(0.25, 1, 0.5, 1)';
        transformStyle = 'translate(-50%, -50%) scale(1.1)';
      }

      return (
        <div
          key={`chip_${color}`}
          onClick={() => {
            if (isMyTurn && !canRoll && validMoves.length > 0 && isMyChip) {
              sounds.playClick();
              onMoveToken(0);
            }
          }}
          style={{
            position: 'absolute',
            left: `${coords.x + offsetX}%`,
            top: `${coords.y + offsetY}%`,
            transform: transformStyle,
            width: 'min(4.2vw, 38px)',
            height: 'min(4.2vw, 38px)',
            borderRadius: '50%',
            background: PLAYER_COLORS[color].gradient,
            border: `3px solid ${isCurrentActive ? '#FFF' : PLAYER_COLORS[color].border}`,
            boxShadow: isCurrentActive
              ? `0 0 20px ${PLAYER_COLORS[color].glow}, 0 6px 12px rgba(0,0,0,0.7)`
              : '0 4px 8px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFF',
            fontWeight: 900,
            fontSize: 'min(1.6vw, 15px)',
            cursor: (isMyTurn && !canRoll && validMoves.length > 0 && isMyChip) ? 'pointer' : 'default',
            transition: transitionStyle,
            zIndex: isCurrentActive ? 35 : 25
          }}
        >
          {player.name ? player.name.charAt(0).toUpperCase() : color.charAt(0).toUpperCase()}

          {/* Active Turn Pulsing Ring */}
          {isCurrentActive && (
            <div
              style={{
                position: 'absolute',
                inset: '-8px',
                borderRadius: '50%',
                border: `3px solid ${PLAYER_COLORS[color].hex}`,
                animation: 'pulseRing 1.2s infinite'
              }}
            />
          )}

          {/* Rank Badge */}
          {player.rank && (
            <div
              style={{
                position: 'absolute',
                top: '-10px',
                right: '-10px',
                background: '#FFD700',
                color: '#000',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                fontSize: '11px',
                fontWeight: 900,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1.5px solid #000'
              }}
            >
              #{player.rank}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="snakes-ladders-wrapper">

      {/* Center 10x10 Board Container */}
      <div className="snakes-ladders-board">
        {/* Inner Board Area (Precisely bounds Grid, SVG Overlay, and Player Tokens) */}
        <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: '12px', overflow: 'hidden' }}>
          
          {/* 10x10 CSS Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(10, 1fr)',
              gridTemplateRows: 'repeat(10, 1fr)',
              width: '100%',
              height: '100%',
              gap: '2px',
              boxSizing: 'border-box'
            }}
          >
            {cells}
          </div>

          {/* SVG Snakes & Ladders Overlay */}
          {renderSVGOverlay()}

          {/* Player Chips */}
          {renderPlayerTokens()}
        </div>
      </div>

      {/* Side / Bottom Control Panel (Player List, Dice Roller, Turn Info) */}
      <div className="glass-panel snakes-ladders-panel">

        {/* Top Header: Current Turn & Timer */}
        <div>
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, background: 'linear-gradient(135deg, #FFF, #4ADE80)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
              🐍 SNAKES & LADDERS
            </h2>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>100 Tiles Goal • Free For All</span>
          </div>

          {/* Turn Banner */}
          <div
            style={{
              background: 'rgba(30, 41, 59, 0.8)',
              padding: '12px 16px',
              borderRadius: '14px',
              border: `2px solid ${PLAYER_COLORS[activeColor]?.hex || '#6366F1'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: PLAYER_COLORS[activeColor]?.hex || '#FFF',
                  boxShadow: `0 0 10px ${PLAYER_COLORS[activeColor]?.hex}`
                }}
              />
              <div>
                <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 700 }}>ACTIVE TURN</div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#FFF' }}>
                  {slots[activeColor]?.name || activeColor.toUpperCase()}
                  {isMyTurn && <span style={{ fontSize: '0.7rem', background: '#6366F1', marginLeft: '6px', padding: '1px 6px', borderRadius: '8px' }}>YOU</span>}
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 700 }}>TIMER</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 900, color: timeLeft <= 5 ? '#F87171' : '#FBBF24' }}>
                ⏱️ {timeLeft}s
              </div>
            </div>
          </div>

          {/* Connected Players Progress List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Players Progress</span>
            {['red', 'yellow', 'green', 'blue'].map(c => {
              const p = players[c];
              const slot = slots[c];
              if (!slot || !slot.connected) return null;

              const pos = p ? p.position : 0;
              const isTurn = activeColor === c;

              return (
                <div
                  key={`progress_${c}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    background: isTurn ? 'rgba(99, 102, 241, 0.25)' : 'rgba(30, 41, 59, 0.5)',
                    border: `1px solid ${isTurn ? PLAYER_COLORS[c].hex : 'rgba(255,255,255,0.08)'}`
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: PLAYER_COLORS[c].hex }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FFF' }}>
                      {slot.name}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {onOpenThrowMenu && c !== myColor && (
                      <button
                        onClick={() => onOpenThrowMenu(c, slot.name)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}
                        title={`Throw item at ${slot.name}`}
                      >
                        🎯
                      </button>
                    )}
                    <span style={{ fontSize: '0.85rem', fontWeight: 900, color: pos > 0 ? '#4ADE80' : '#94A3B8' }}>
                      {pos === 0 ? 'Dock (0)' : `Tile ${pos}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center / Bottom Interactive Section: Dice & Action */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', width: '100%' }}>
          
          {/* Dice Roller Component */}
          <div style={{ margin: '6px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <DiceRoller
              currentDice={currentDice}
              dicePool={gameState.dicePool || []}
              canRoll={canRoll}
              isMyTurn={isMyTurn}
              activeColor={activeColor}
              onRollDice={onRollDice}
              diceCount={1}
              compact={false}
            />
          </div>

          {/* Action Button: ROLL DICE */}
          {isMyTurn && canRoll && !gameOver && (
            <button
              onClick={() => {
                sounds.playDiceRoll();
                onRollDice(0);
              }}
              className="glass-btn primary"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '14px',
                fontSize: '1.1rem',
                fontWeight: 900,
                background: 'linear-gradient(135deg, #10B981, #059669)',
                border: 'none',
                boxShadow: '0 0 20px rgba(16, 185, 129, 0.6)',
                cursor: 'pointer'
              }}
            >
              🎲 ROLL DICE NOW
            </button>
          )}

          {/* Action Button / Move Prompt */}
          {isMyTurn && !canRoll && validMoves.length > 0 && !gameOver && (
            <button
              onClick={() => {
                sounds.playClick();
                onMoveToken(0);
              }}
              className="glass-btn primary"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '14px',
                fontSize: '1.1rem',
                fontWeight: 900,
                background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
                border: 'none',
                boxShadow: '0 0 20px rgba(99, 102, 241, 0.6)',
                cursor: 'pointer'
              }}
            >
              <Zap size={20} /> STEP FORWARD
            </button>
          )}

          {isMyTurn && !canRoll && validMoves.length === 0 && !gameOver && (
            <div
              style={{
                color: '#F87171',
                fontSize: '0.85rem',
                fontWeight: 800,
                textAlign: 'center',
                background: 'rgba(239, 68, 68, 0.15)',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                width: '100%'
              }}
            >
              🚫 Exceeds 100 Goal! Passing Turn...
            </div>
          )}

          {/* Emote & Chat Triggers */}
          <div style={{ display: 'flex', gap: '10px', width: '100%', marginTop: '6px' }}>
            {onOpenReactionPicker && (
              <button
                onClick={onOpenReactionPicker}
                className="glass-btn"
                style={{ flex: 1, justifyContent: 'center', padding: '8px', fontSize: '0.85rem' }}
              >
                😍 Reactions
              </button>
            )}
            {onToggleMobileChat && (
              <button
                onClick={onToggleMobileChat}
                className="glass-btn"
                style={{ flex: 1, justifyContent: 'center', padding: '8px', fontSize: '0.85rem' }}
              >
                <MessageSquare size={16} /> Chat
              </button>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
