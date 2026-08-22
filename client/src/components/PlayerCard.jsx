import React from 'react';
import { Shield, User, Crown, ArrowRight } from 'lucide-react';

const COLOR_HEX = {
  red: '#FF4757',
  green: '#2ED573',
  yellow: '#FFA502',
  blue: '#1E90FF',
  orange: '#FF6B81',
  purple: '#A55EEA'
};

export default function PlayerCard({ color, player, isActive, isMe, teamName, finishStep, timeLeft, turnTimer }) {
  if (!player) {
    return (
      <div className="glass-panel" style={{ padding: '12px 16px', opacity: 0.4, display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#334155' }} />
        <span style={{ fontSize: '0.85rem', color: '#94A3B8' }}>Empty Slot ({color.toUpperCase()})</span>
      </div>
    );
  }

  // Count finished tokens
  const finishedCount = player.tokens ? player.tokens.filter(s => s === finishStep).length : 0;
  const mainHex = COLOR_HEX[color] || '#6366F1';

  return (
    <div 
      className={`glass-panel ${isActive ? 'active-turn-ring' : ''}`}
      style={{
        padding: '12px 16px',
        borderLeft: `5px solid ${mainHex}`,
        background: isActive ? 'rgba(30, 41, 59, 0.9)' : 'rgba(22, 28, 45, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        transition: 'all 0.3s ease'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Animated Turn Arrow Indicator */}
        {isActive && (
          <div style={{ animation: 'bounceX 1s infinite alternate', display: 'flex', alignItems: 'center' }}>
            <ArrowRight size={20} color={mainHex} />
          </div>
        )}

        {/* Color Avatar */}
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: mainHex,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          boxShadow: isActive ? `0 0 16px ${mainHex}` : 'none'
        }}>
          <User size={20} color="#FFF" />
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#FFF' }}>
              {player.name} {isMe && <span style={{ fontSize: '0.75rem', color: '#818CF8' }}>(You)</span>}
            </span>
            {finishedCount === 4 && <Crown size={16} color="#FFA502" />}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Shield size={12} color={mainHex} /> {teamName || color.toUpperCase()}
            </span>
            <span style={{ fontSize: '0.75rem', color: (player.kills || 0) > 0 ? '#2ED573' : '#FF6B81', fontWeight: 600 }}>
              🎯 {player.kills || 0} Kills
            </span>
            <span style={{ fontSize: '0.75rem', color: '#F59E0B', fontWeight: 600 }}>
              ⚖️ {player.appealsLeft !== undefined ? player.appealsLeft : 3}
            </span>
          </div>
        </div>
      </div>

      {/* Right side: Finished tokens indicator & Turn Timer */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#CBD5E1' }}>
          {finishedCount}/4 Home
        </div>

        {isActive && turnTimer > 0 && (
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: timeLeft <= 5 ? '#FF4757' : '#2ED573' }}>
            ⏱️ {timeLeft}s
          </div>
        )}
      </div>
    </div>
  );
}
