import React from 'react';
import { X, Smile } from 'lucide-react';
import { sounds } from '../utils/audio';

export const REACTION_ITEMS = [
  { id: 'laugh', emoji: '😂', name: 'Laugh', desc: 'LOL!' },
  { id: 'heart_eyes', emoji: '😍', name: 'Love', desc: 'Heart Eyes' },
  { id: 'tongue', emoji: '😜', name: 'Tongue', desc: 'Silly Tongue' },
  { id: 'angry', emoji: '😡', name: 'Angry', desc: 'Grrr!' },
  { id: 'cry', emoji: '😭', name: 'Cry', desc: 'Sob Sob' },
  { id: 'glasses', emoji: '😎', name: 'Show Off', desc: 'Cool Flex!' },
  { id: 'frightened', emoji: '😱', name: 'Scared', desc: 'Frightened' },
  { id: 'confused', emoji: '😕', name: 'Confused', desc: 'Huh?' },
  { id: 'nervous', emoji: '😬', name: 'Nervous', desc: 'Eek!' },
  { id: 'sad', emoji: '🥺', name: 'Sad', desc: 'Aw...' }
];

export default function ReactionPickerModal({ isOpen, onClose, onSelect }) {
  if (!isOpen) return null;

  const handlePick = (id) => {
    sounds.playClick();
    if (onSelect) onSelect(id);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.78)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'linear-gradient(145deg, #1E293B, #0F172A)',
          border: '2px solid #818CF8',
          borderRadius: '24px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(129, 140, 248, 0.4)',
          width: '100%',
          maxWidth: '420px',
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
              background: '#818CF8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 12px #818CF8'
            }}>
              <Smile size={18} color="#FFF" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFF', margin: 0 }}>
                Choose Reaction
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#94A3B8', margin: 0 }}>Express how you feel!</p>
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

        {/* Reaction Grid: 5 columns x 2 rows */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '8px'
        }}>
          {REACTION_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => handlePick(item.id)}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '14px',
                padding: '10px 4px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                userSelect: 'none'
              }}
              className="throw-item-btn"
            >
              <span style={{ fontSize: '1.8rem', transform: 'scale(1)', transition: 'transform 0.2s' }}>
                {item.emoji}
              </span>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#F8FAFC', textAlign: 'center', whiteSpace: 'nowrap' }}>
                {item.name}
              </span>
              <span style={{ fontSize: '0.6rem', color: '#94A3B8', textAlign: 'center', whiteSpace: 'nowrap' }}>
                {item.desc}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
