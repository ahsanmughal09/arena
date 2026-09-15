import React, { useState, useEffect, useRef } from 'react';
import { sounds } from '../utils/audio';

const COLOR_HEX = {
  red: '#FF4757',
  green: '#2ED573',
  yellow: '#FFA502',
  blue: '#1E90FF',
  orange: '#FF6B81',
  purple: '#A55EEA'
};

export default function ReactionOverlay({ activeReactions = [] }) {
  const [displayedReactions, setDisplayedReactions] = useState([]);
  const processedIdsRef = useRef(new Set());

  useEffect(() => {
    activeReactions.forEach((r) => {
      if (!r || !r.id) return;
      if (processedIdsRef.current.has(r.id)) return;
      processedIdsRef.current.add(r.id);

      const colorKey = r.fromColor ? r.fromColor.toLowerCase() : 'red';

      // Default screen position fallback per color
      const defaultColorCoords = {
        red: { x: window.innerWidth * 0.25, y: window.innerHeight * 0.25 },
        green: { x: window.innerWidth * 0.75, y: window.innerHeight * 0.25 },
        yellow: { x: window.innerWidth * 0.75, y: window.innerHeight * 0.75 },
        blue: { x: window.innerWidth * 0.25, y: window.innerHeight * 0.75 },
        orange: { x: window.innerWidth * 0.85, y: window.innerHeight * 0.5 },
        purple: { x: window.innerWidth * 0.15, y: window.innerHeight * 0.5 }
      };

      // Helper to find visible element center on screen
      const getVisibleElementCenter = (c) => {
        if (!c) return null;
        const normalizedColor = c.toLowerCase();
        const selectors = [
          `[data-corner-pod="${normalizedColor}"]`,
          `[data-player-color="${normalizedColor}"]`,
          `[data-corner-pod="${c}"]`,
          `[data-player-color="${c}"]`
        ];
        const elements = document.querySelectorAll(selectors.join(', '));
        for (const el of elements) {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            return {
              x: rect.left + rect.width / 2,
              y: rect.top + rect.height / 2
            };
          }
        }
        return null;
      };

      const podCenter = getVisibleElementCenter(colorKey);
      const defaultPos = defaultColorCoords[colorKey] || { x: window.innerWidth / 2, y: window.innerHeight / 2 };
      const posX = podCenter ? podCenter.x : defaultPos.x;
      const posY = podCenter ? podCenter.y : defaultPos.y;

      // Play audio synthesizer sound effect for this reaction safely without blocking UI
      try {
        sounds.playReaction(r.reactionId);
      } catch (err) {
        console.warn('Audio playback error ignored:', err);
      }

      // Generate 6 particle offsets around origin with precomputed mid values for WebKit compatibility
      const particles = Array.from({ length: 6 }).map((_, idx) => {
        const dx = (Math.random() - 0.5) * 140;
        const rot = (Math.random() - 0.5) * 60;
        return {
          id: `${r.id}_p_${idx}`,
          dx,
          dxMid: dx * 0.7,
          rot,
          rotMid: rot * 0.5,
          delay: Math.random() * 0.15,
          scale: 0.85 + Math.random() * 0.6
        };
      });

      const newReactionItem = {
        id: r.id,
        fromColor: colorKey,
        senderName: r.senderName,
        reactionId: r.reactionId,
        emoji: r.emoji,
        label: r.label,
        x: posX,
        y: posY,
        particles
      };

      setDisplayedReactions(prev => [...prev, newReactionItem]);

      // Remove after animation finishes (2.2s)
      setTimeout(() => {
        setDisplayedReactions(prev => prev.filter(item => item.id !== r.id));
      }, 2200);
    });
  }, [activeReactions]);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      pointerEvents: 'none',
      zIndex: 999999,
      overflow: 'visible'
    }}>
      {displayedReactions.map((item) => {
        const mainColorHex = COLOR_HEX[item.fromColor] || '#818CF8';
        return (
          <React.Fragment key={item.id}>
            {/* Main Floating Reaction Bubble above player pod */}
            <div
              className="reaction-bubble-popup"
              style={{
                position: 'absolute',
                left: `${item.x}px`,
                top: `${item.y - 45}px`,
                background: `linear-gradient(135deg, ${mainColorHex}E6, #0F172A)`,
                border: `2px solid ${mainColorHex}`,
                borderRadius: '20px',
                padding: '6px 14px',
                boxShadow: `0 10px 25px ${mainColorHex}80, 0 0 20px rgba(0,0,0,0.6)`,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#FFF',
                zIndex: 99999
              }}
            >
              <span style={{ fontSize: '1.8rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' }}>
                {item.emoji}
              </span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#FFF', lineHeight: 1.1 }}>
                  {item.senderName}
                </span>
                <span style={{ fontSize: '0.65rem', color: '#CBD5E1', fontWeight: 700 }}>
                  {item.label}
                </span>
              </div>
            </div>

            {/* Particle Burst Emojis floating upward */}
            {item.particles.map((p) => (
              <div
                key={p.id}
                className="reaction-particle"
                style={{
                  position: 'absolute',
                  left: `${item.x}px`,
                  top: `${item.y - 30}px`,
                  fontSize: `${1.6 * p.scale}rem`,
                  animationDelay: `${p.delay}s`,
                  '--particle-dx': `${p.dx}px`,
                  '--particle-dx-mid': `${p.dxMid}px`,
                  '--particle-rot': `${p.rot}deg`,
                  '--particle-rot-mid': `${p.rotMid}deg`,
                  zIndex: 99999,
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))'
                }}
              >
                {item.emoji}
              </div>
            ))}
          </React.Fragment>
        );
      })}
    </div>
  );
}
