import React from 'react';
import { sounds } from '../utils/audio';

export const REACTION_ITEMS = [
  { id: 'laugh', emoji: '😂', label: 'Laugh' },
  { id: 'heart_eyes', emoji: '😍', label: 'Love' },
  { id: 'tongue', emoji: '😜', label: 'Tongue' },
  { id: 'angry', emoji: '😡', label: 'Angry' },
  { id: 'cry', emoji: '😭', label: 'Cry' },
  { id: 'glasses', emoji: '😎', label: 'Show Off' },
  { id: 'frightened', emoji: '😱', label: 'Scared' },
  { id: 'confused', emoji: '😕', label: 'Confused' },
  { id: 'nervous', emoji: '😬', label: 'Nervous' },
  { id: 'sad', emoji: '🥺', label: 'Sad' }
];

export default function QuickReactionDock({ onSendReaction }) {
  const handleReact = (id) => {
    sounds.playClick();
    if (onSendReaction) {
      onSendReaction(id);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 200,
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1.5px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '24px',
        padding: '6px 12px',
        boxShadow: '0 12px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(99, 102, 241, 0.25)',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        maxWidth: '95vw'
      }}
    >
      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', paddingRight: '4px', letterSpacing: '0.5px' }}>
        React
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {REACTION_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => handleReact(item.id)}
            title={item.label}
            className="reaction-dock-btn"
          >
            <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>
              {item.emoji}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
