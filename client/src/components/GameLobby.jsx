import React, { useState } from 'react';
import { Copy, Check, Play } from 'lucide-react';
import { sounds } from '../utils/audio';

const COLOR_HEX = {
  red: '#FF4757',
  green: '#2ED573',
  yellow: '#FFA502',
  blue: '#1E90FF',
  orange: '#FF6B81',
  purple: '#A55EEA'
};

export default function GameLobby({ roomCode, slots, settings, isHost, myColor, onStartGame, onLeaveRoom, onOpenThrowMenu }) {
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
            <span style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase' }}>Mode</span>
            <div style={{ fontWeight: 700, color: '#FFF' }}>{settings.mode} ({settings.teamMode})</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase' }}>Timer</span>
            <div style={{ fontWeight: 700, color: '#FFF' }}>{settings.turnTimer}s</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase' }}>Players</span>
            <div style={{ fontWeight: 700, color: '#FFF' }}>{connectedCount} / {maxPlayers}</div>
          </div>
        </div>

        {/* Player Slots */}
        <div style={{ marginBottom: '28px' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#94A3B8', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Connected Players
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {(settings.mode === '4P' ? ['red', 'green', 'yellow', 'blue'] : ['red', 'green', 'yellow', 'blue', 'orange', 'purple']).map(color => {
              const slot = slots ? slots[color] : null;
              const isConnected = slot && slot.connected;
              const slotName = isConnected ? slot.name : `${color.toUpperCase()} Slot`;
              const canThrowAtPlayer = isConnected && color !== myColor;
              return (
                <div 
                  key={`slot-${color}`}
                  data-player-color={color}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: isConnected ? 'rgba(30, 41, 59, 0.8)' : 'rgba(15, 23, 42, 0.4)',
                    border: `1px solid ${isConnected ? COLOR_HEX[color] : 'rgba(255,255,255,0.05)'}`
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: COLOR_HEX[color] }} />
                    <div style={{ fontSize: '0.9rem', fontWeight: isConnected ? 700 : 400, color: isConnected ? '#FFF' : '#64748B' }}>
                      {slotName}
                      {slot?.isHost && <span style={{ fontSize: '0.7rem', color: '#818CF8', marginLeft: '6px' }}>(Host)</span>}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {canThrowAtPlayer && onOpenThrowMenu && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenThrowMenu(color, slotName);
                        }}
                        title={`Throw item at ${slotName}`}
                        style={{
                          background: 'rgba(255, 255, 255, 0.15)',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          borderRadius: '6px',
                          color: '#FFF',
                          fontSize: '12px',
                          padding: '3px 7px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          lineHeight: 1
                        }}
                      >
                        🎯
                      </button>
                    )}
                    <span style={{ fontSize: '0.8rem', color: isConnected ? '#2ED573' : '#64748B', fontWeight: 600 }}>
                      {isConnected ? '✓ Ready' : 'Empty'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
            <div style={{ textAlign: 'center', color: '#94A3B8', fontStyle: 'italic', fontSize: '0.9rem', marginBottom: '4px' }}>
              Waiting for the room host to start the match...
            </div>
          )}

          {onLeaveRoom && (
            <button 
              onClick={onLeaveRoom}
              style={{
                width: '100%',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#EF4444',
                fontWeight: 700,
                padding: '12px',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '0.95rem',
                transition: 'all 0.2s ease'
              }}
            >
              🚪 Leave Room
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
