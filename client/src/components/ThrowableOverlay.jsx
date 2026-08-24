import React, { useState, useEffect } from 'react';
import { sounds } from '../utils/audio';

const EMOJI_MAP = {
  banana: '🍌',
  sandal: '👡',
  flower: '🌸',
  heart: '❤️',
  bomb: '💣',
  tomato: '🍅',
  egg: '🥚',
  poop: '💩'
};

export default function ThrowableOverlay({ activeThrows = [] }) {
  const [flyingItems, setFlyingItems] = useState([]);
  const [impacts, setImpacts] = useState([]);

  useEffect(() => {
    activeThrows.forEach((t) => {
      // Check if already processed
      if (flyingItems.some(i => i.id === t.id) || impacts.some(i => i.id === t.id)) return;

      // Default screen position coordinates per color
      const defaultColorCoords = {
        red: { x: window.innerWidth * 0.25, y: window.innerHeight * 0.25 },
        green: { x: window.innerWidth * 0.75, y: window.innerHeight * 0.25 },
        yellow: { x: window.innerWidth * 0.75, y: window.innerHeight * 0.75 },
        blue: { x: window.innerWidth * 0.25, y: window.innerHeight * 0.75 },
        orange: { x: window.innerWidth * 0.85, y: window.innerHeight * 0.5 },
        purple: { x: window.innerWidth * 0.15, y: window.innerHeight * 0.5 }
      };

      // Find source & target element bounding rects
      const fromEl = document.querySelector(`[data-player-color="${t.fromColor}"]`);
      const targetEl = document.querySelector(`[data-player-color="${t.targetColor}"]`);

      const defaultStart = defaultColorCoords[t.fromColor] || { x: window.innerWidth / 2, y: window.innerHeight / 2 };
      const defaultEnd = defaultColorCoords[t.targetColor] || { x: window.innerWidth / 2, y: window.innerHeight / 2 };

      let startX = defaultStart.x;
      let startY = defaultStart.y;
      let endX = defaultEnd.x;
      let endY = defaultEnd.y;

      if (fromEl) {
        const rect = fromEl.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          startX = rect.left + rect.width / 2;
          startY = rect.top + rect.height / 2;
        }
      }
      if (targetEl) {
        const rect = targetEl.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          endX = rect.left + rect.width / 2;
          endY = rect.top + rect.height / 2;
        }
      }

      // Play Whoosh sound
      sounds.playWhoosh();

      const newItem = {
        id: t.id,
        item: t.item,
        emoji: EMOJI_MAP[t.item] || '🎯',
        fromColor: t.fromColor,
        targetColor: t.targetColor,
        senderName: t.senderName,
        targetName: t.targetName,
        startX,
        startY,
        endX,
        endY,
        progress: 0
      };

      setFlyingItems(prev => [...prev, newItem]);

      // Flight time = 600ms
      setTimeout(() => {
        // Remove from flying items and add to impacts
        setFlyingItems(prev => prev.filter(i => i.id !== t.id));

        // Play Impact sound FX based on item type
        switch (t.item) {
          case 'bomb':
            sounds.playExplosion();
            break;
          case 'sandal':
            sounds.playSlap();
            break;
          case 'flower':
            sounds.playChime();
            break;
          case 'heart':
            sounds.playKiss();
            break;
          case 'banana':
            sounds.playSlip();
            break;
          case 'egg':
          case 'tomato':
          case 'poop':
          default:
            sounds.playSplat();
            break;
        }

        // Add impact splat
        setImpacts(prev => [...prev, {
          id: t.id,
          item: t.item,
          emoji: EMOJI_MAP[t.item] || '🎯',
          targetColor: t.targetColor,
          x: endX,
          y: endY
        }]);

        // Remove impact splat after 2.5 seconds
        setTimeout(() => {
          setImpacts(prev => prev.filter(i => i.id !== t.id));
        }, 2500);

      }, 600);
    });
  }, [activeThrows]);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      pointerEvents: 'none',
      zIndex: 9990,
      overflow: 'hidden'
    }}>
      {/* Flying Items */}
      {flyingItems.map((item) => (
        <div
          key={item.id}
          className="flying-throwable-item"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            '--start-x': `${item.startX}px`,
            '--start-y': `${item.startY}px`,
            '--end-x': `${item.endX}px`,
            '--end-y': `${item.endY}px`,
            fontSize: '2.5rem',
            filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.5))'
          }}
        >
          {item.emoji}
        </div>
      ))}

      {/* Impact Splats / FX at Target Position */}
      {impacts.map((imp) => (
        <div
          key={imp.id}
          style={{
            position: 'absolute',
            left: `${imp.x}px`,
            top: `${imp.y}px`,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {/* Item Specific Impact Animations */}
          {imp.item === 'bomb' && (
            <div className="impact-bomb">
              <span style={{ fontSize: '4.5rem' }}>💥</span>
              <span className="impact-text bomb-text">KABOOM!</span>
            </div>
          )}

          {imp.item === 'egg' && (
            <div className="impact-egg">
              <span style={{ fontSize: '3.5rem' }}>🍳</span>
              <div className="yolk-splat" />
            </div>
          )}

          {imp.item === 'tomato' && (
            <div className="impact-tomato">
              <span style={{ fontSize: '3.5rem' }}>🍅</span>
              <div className="tomato-splat" />
            </div>
          )}

          {imp.item === 'sandal' && (
            <div className="impact-sandal">
              <span style={{ fontSize: '3.5rem' }}>🩴</span>
              <span className="impact-text slap-text">SLAP!</span>
            </div>
          )}

          {imp.item === 'flower' && (
            <div className="impact-flower">
              <span style={{ fontSize: '3.5rem' }}>🌸</span>
              <div className="petal-burst">
                <span>🌸</span><span>🌺</span><span>🌼</span><span>✨</span>
              </div>
            </div>
          )}

          {imp.item === 'heart' && (
            <div className="impact-heart">
              <span style={{ fontSize: '3.5rem' }}>❤️</span>
              <div className="heart-burst">
                <span>💖</span><span>💕</span><span>💗</span><span>✨</span>
              </div>
            </div>
          )}

          {imp.item === 'banana' && (
            <div className="impact-banana">
              <span style={{ fontSize: '3.5rem' }}>🍌</span>
              <span className="impact-text slip-text">WHOOPS! 💫</span>
            </div>
          )}

          {imp.item === 'poop' && (
            <div className="impact-poop">
              <span style={{ fontSize: '3.5rem' }}>💩</span>
              <div className="poop-splat" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
