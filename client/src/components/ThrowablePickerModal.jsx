import React from 'react';
import { X, Target } from 'lucide-react';
import { sounds } from '../utils/audio';

export const THROWABLE_ITEMS = [
  { id: 'banana', name: 'Banana', emoji: '🍌', desc: 'Slip & Slide' },
  { id: 'sandal', name: 'Sandal', emoji: '👡', desc: 'Flying Chappal' },
  { id: 'flower', name: 'Flower', emoji: '🌸', desc: 'Flower Shower' },
  { id: 'heart', name: 'Heart', emoji: '❤️', desc: 'Love & Hugs' },
  { id: 'bomb', name: 'Bomb', emoji: '💣', desc: 'KABOOM!' },
  { id: 'tomato', name: 'Tomato', emoji: '🍅', desc: 'Juicy Splat' },
  { id: 'egg', name: 'Egg', emoji: '🥚', desc: 'Sticky Yolk' },
  { id: 'poop', name: 'Poop', emoji: '💩', desc: 'Messy Splash' }
];

export default function ThrowablePickerModal({ targetColor, targetName, onSelect, onClose }) {
  if (!targetColor) return null;

  const colorHexMap = {
    red: '#FF4757',
    green: '#2ED573',
    yellow: '#FFA502',
    blue: '#1E90FF',
    orange: '#FF6B81',
    purple: '#A55EEA'
  };

  const accentColor = colorHexMap[targetColor] || '#818CF8';

  const handlePick = (itemId) => {
    sounds.playClick();
    onSelect(targetColor, itemId);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      animation: 'fadeIn 0.2s ease-out'
    }} onClick={onClose}>
      <div 
        style={{
          background: 'linear-gradient(145deg, #1E293B, #0F172A)',
          border: `2px solid ${accentColor}`,
          borderRadius: '24px',
          boxShadow: `0 20px 50px rgba(0,0,0,0.8), 0 0 30px ${accentColor}40`,
          width: '100%',
          maxWidth: '380px',
          padding: '20px',
          boxSizing: 'border-box',
          animation: 'popIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: accentColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 0 12px ${accentColor}`
            }}>
              <Target size={18} color="#FFF" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFF', margin: 0 }}>
                Throw at <span style={{ color: accentColor, textTransform: 'capitalize' }}>{targetName || targetColor}</span>
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#94A3B8', margin: 0 }}>Pick an item to launch!</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#CBD5E1',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Item Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '10px'
        }}>
          {THROWABLE_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => handlePick(item.id)}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '16px',
                padding: '12px 6px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                userSelect: 'none'
              }}
              className="throw-item-btn"
            >
              <span style={{ fontSize: '1.8rem', transform: 'scale(1)', transition: 'transform 0.2s' }}>
                {item.emoji}
              </span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#F8FAFC' }}>
                {item.name}
              </span>
              <span style={{ fontSize: '0.62rem', color: '#94A3B8', textAlign: 'center' }}>
                {item.desc}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
