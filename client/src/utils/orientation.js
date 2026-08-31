/**
 * Presentation-Only Orientation Utilities for Player-Centric View
 * Maps local player color (myColor) to corner pod positions and SVG rotation angles.
 * Does NOT modify server state, coordinates, or game logic!
 */

export const CORNER_MAP_4P = {
  blue:   { TL: 'red',    TR: 'green',  BL: 'blue',   BR: 'yellow' },
  red:    { TL: 'green',  TR: 'yellow', BL: 'red',    BR: 'blue'   },
  green:  { TL: 'yellow', TR: 'blue',   BL: 'green',  BR: 'red'    },
  yellow: { TL: 'blue',   TR: 'red',    BL: 'yellow', BR: 'green'  }
};

export const ROTATION_ANGLE_4P = {
  blue: 0,
  red: 270,
  green: 180,
  yellow: 90
};

export const ROTATION_ANGLE_6P = {
  blue: 0,
  yellow: 60,
  green: 120,
  red: 180,
  purple: 240,
  orange: 300
};

export function getCornerMap4P(myColor) {
  const c = (myColor && CORNER_MAP_4P[myColor]) ? myColor : 'blue';
  return CORNER_MAP_4P[c];
}

export function getRotationAngle4P(myColor) {
  if (!myColor || ROTATION_ANGLE_4P[myColor] === undefined) return 0;
  return ROTATION_ANGLE_4P[myColor];
}

export function getRotationAngle6P(myColor) {
  if (!myColor || ROTATION_ANGLE_6P[myColor] === undefined) return 0;
  return ROTATION_ANGLE_6P[myColor];
}

/**
 * Rotates a 2D point (x, y) around center (cx, cy) by angle in degrees.
 * Used for contextual popups and click target coordinates on rotated SVG layers.
 */
export function rotatePoint(x, y, cx, cy, angleDeg) {
  if (!angleDeg) return { x, y };
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = x - cx;
  const dy = y - cy;
  return {
    x: cx + dx * cos - dy * sin,
    y: cy + dx * sin + dy * cos
  };
}
