import React from 'react';

/**
 * Modular Realistic Snake Component
 * Renders a detailed 3D slithering Snake between headCell (Bite Tile) and tailCell (Drop Tile).
 * Expects viewBox="0 0 100 100" coordinate space.
 */
export default function SnakeItem({ id, headCell, tailCell, headC, tailC, colorTheme = 'red' }) {
  const dx = tailC.x - headC.x;
  const dy = tailC.y - headC.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Calculate curve control points for natural slithering S-shape
  const perpX = (-dy / dist) * (headCell % 2 === 0 ? 8 : -8);
  const perpY = (dx / dist) * (headCell % 2 === 0 ? 8 : -8);

  const c1 = {
    x: headC.x * 0.65 + tailC.x * 0.35 + perpX,
    y: headC.y * 0.65 + tailC.y * 0.35 + perpY
  };
  const c2 = {
    x: headC.x * 0.35 + tailC.x * 0.65 - perpX,
    y: headC.y * 0.35 + tailC.y * 0.65 - perpY
  };

  const pathD = `M ${headC.x} ${headC.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${tailC.x} ${tailC.y}`;

  // Angle at the head for rotating viper head towards body direction
  const headAngle = Math.atan2(c1.y - headC.y, c1.x - headC.x) * (180 / Math.PI);

  const themes = {
    red: {
      body: 'url(#snakeRedGrad)',
      scales: '#EF4444',
      head: '#DC2626',
      eye: '#FBBF24'
    },
    green: {
      body: 'url(#snakeGreenGrad)',
      scales: '#10B981',
      head: '#059669',
      eye: '#F59E0B'
    },
    purple: {
      body: 'url(#snakePurpleGrad)',
      scales: '#A855F7',
      head: '#7E22CE',
      eye: '#FBBF24'
    }
  };

  const theme = themes[colorTheme] || themes.red;

  return (
    <g className="snake-item" key={id}>
      {/* 1. Deep Drop Shadow */}
      <path
        d={pathD}
        fill="none"
        stroke="#000"
        strokeWidth="2.0"
        strokeLinecap="round"
        opacity="0.65"
        filter="url(#svgShadow)"
      />

      {/* 2. Outer Specular Highlight */}
      <path
        d={pathD}
        fill="none"
        stroke="rgba(255, 255, 255, 0.45)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />

      {/* 3. Main Gradient Body */}
      <path
        d={pathD}
        fill="none"
        stroke={theme.body}
        strokeWidth="1.2"
        strokeLinecap="round"
      />

      {/* 4. Realistic Scale Texture Lines */}
      <path
        d={pathD}
        fill="none"
        stroke="rgba(0, 0, 0, 0.4)"
        strokeWidth="0.5"
        strokeDasharray="0.4 0.6"
        strokeLinecap="round"
      />
      <path
        d={pathD}
        fill="none"
        stroke="rgba(255, 255, 255, 0.5)"
        strokeWidth="0.3"
        strokeDasharray="0.2 0.8"
        strokeLinecap="round"
      />

      {/* 5. Tapered Snake Tail at Destination (Lower Cell) */}
      <g transform={`translate(${tailC.x}, ${tailC.y})`}>
        <circle r="0.6" fill="#000" opacity="0.6" />
        <circle r="0.45" fill={theme.head} stroke="#FFF" strokeWidth="0.1" />
      </g>

      {/* 6. Highly Realistic Viper Head at Bite Position (Higher Cell) */}
      <g transform={`translate(${headC.x}, ${headC.y}) rotate(${headAngle})`}>
        {/* Head Outer Shadow */}
        <path
          d="M -0.4 -0.8 L 1.6 0 L -0.4 0.8 Z"
          fill="#000"
          opacity="0.4"
          transform="translate(0.2, 0.2)"
        />
        {/* Diamond Viper Head Base */}
        <path
          d="M -0.6 -1.0 L 1.6 0 L -0.6 1.0 C -1.0 0.6, -1.0 -0.6, -0.6 -1.0 Z"
          fill={theme.head}
          stroke="#FFF"
          strokeWidth="0.15"
        />
        {/* Head Crown Highlight */}
        <path
          d="M -0.3 -0.6 L 1.0 0 L -0.3 0.6 Z"
          fill="rgba(255,255,255,0.3)"
        />
        {/* Left & Right Eyes */}
        <circle cx="0.5" cy="-0.5" r="0.28" fill={theme.eye} stroke="#000" strokeWidth="0.05" />
        <circle cx="0.5" cy="0.5" r="0.28" fill={theme.eye} stroke="#000" strokeWidth="0.05" />
        {/* Slit Pupils */}
        <ellipse cx="0.5" cy="-0.5" rx="0.08" ry="0.2" fill="#000" />
        <ellipse cx="0.5" cy="0.5" rx="0.08" ry="0.2" fill="#000" />
        {/* Nostrils */}
        <circle cx="1.2" cy="-0.2" r="0.08" fill="#000" />
        <circle cx="1.2" cy="0.2" r="0.08" fill="#000" />
        {/* Red Flickering Fork Tongue */}
        <path
          d="M 1.6 0 L 2.5 -0.4 M 1.6 0 L 2.5 0.4"
          stroke="#EF4444"
          strokeWidth="0.2"
          strokeLinecap="round"
        />
      </g>
    </g>
  );
}
