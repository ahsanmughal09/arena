import React, { useState } from 'react';
import { Copy, Check, Play, Users } from 'lucide-react';
import { sounds } from '../utils/audio';

const COLOR_HEX = {
  red: '#FF4757',
  green: '#2ED573',
  yellow: '#FFA502',
  blue: '#1E90FF',
  orange: '#FF6B81',
  purple: '#A55EEA'
};

export default function GameLobby({ roomCode, slots, settings, isHost, onStartGame }) {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    sounds.playClick();
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const connectedCount = slots ? Object.values(slots).filter(s => s.connected).length : 0;
  const maxPlayers = settings.mode === '4P' ? 4 : 6;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '540px', padding: '32px' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FFF' }}>
            Match Room Lobby
          </h2>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(99, 102, 241, 0.2)', padding: '6px 16px', borderRadius: '20px', marginTop: '8px', border: '1px solid var(--accent)' }}>
            <span style={{ fontSize: '0.85rem', color: '#CBD5E1' }}>Room Code:</span>
            <strong style={{ fontSize: '1.2rem', color: '#818CF8', letterSpacing: '2px' }}>{roomCode}</strong>
            <button 
              onClick={handleCopyCode} 
              style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              {copied ? <Check size={16} color="#2ED573" /> : <Copy size={16} />}
            </button>
          </div>
        </div>

        {/* Room Info */}
        <div style={{ display: 'flex', justifyContent: 'space-around', background: 'rgba(15, 23, 42, 0.5)', padding: '12px', borderRadius: '12px', marginBottom: '24px' }}>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block' }}>Board Mode</span>
            <strong style={{ color: '#FFF', fontSize: '0.95rem' }}>{settings.mode} ({maxPlayers} Players)</strong>
          </div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block' }}>Teaming</span>
            <strong style={{ color: '#2ED573', fontSize: '0.95rem' }}>{settings.teamMode.toUpperCase()}</strong>
          </div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block' }}>Timer</span>
            <strong style={{ color: '#FFA502', fontSize: '0.95rem' }}>{settings.turnTimer > 0 ? `${settings.turnTimer}s` : 'Off'}</strong>
          </div>
        </div>

        {/* Player Slots List */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#CBD5E1', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Users size={16} color="#818CF8" /> Joined Players ({connectedCount}/{maxPlayers})
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {slots && Object.keys(slots).map(color => {
              const slot = slots[color];
              const isConnected = slot && slot.connected;
              const colorHex = COLOR_HEX[color];

              return (
                <div 
                  key={`slot-${color}`}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: isConnected ? 'rgba(30, 41, 59, 0.7)' : 'rgba(15, 23, 42, 0.4)',
                    border: `1px solid ${isConnected ? colorHex : 'rgba(255,255,255,0.08)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: colorHex }} />
                    <div>
                      <span style={{ fontWeight: 600, color: isConnected ? '#FFF' : '#64748B' }}>
                        {isConnected ? slot.name : `Waiting for ${color.toUpperCase()}...`}
                      </span>
                      {slot.isHost && (
                        <span style={{ marginLeft: '8px', fontSize: '0.75rem', color: '#818CF8', fontWeight: 700 }}>Host</span>
                      )}
                    </div>
                  </div>

                  <span style={{ fontSize: '0.8rem', color: isConnected ? '#2ED573' : '#64748B', fontWeight: 600 }}>
                    {isConnected ? '✓ Ready' : 'Empty'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Start Game Button (Host Only) */}
        {isHost ? (
          <button 
            onClick={() => { sounds.playClick(); onStartGame(); }}
            disabled={connectedCount < 2}
            className="glass-btn primary" 
            style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '1.1rem', opacity: connectedCount < 2 ? 0.5 : 1 }}
          >
            <Play size={20} /> {connectedCount < 2 ? 'Need At Least 2 Players To Start' : 'Start Match Now'}
          </button>
        ) : (
          <div style={{ textAlign: 'center', color: '#94A3B8', fontStyle: 'italic', fontSize: '0.9rem' }}>
            Waiting for the room host to start the match...
          </div>
        )}

      </div>
    </div>
  );
}
