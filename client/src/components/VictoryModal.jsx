import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RefreshCw, Crown, Swords, Home, User, BarChart2 } from 'lucide-react';
import { sounds } from '../utils/audio';

const COLOR_HEX = {
  red: '#FF4757',
  green: '#2ED573',
  yellow: '#FFA502',
  blue: '#1E90FF',
  orange: '#FF6B81',
  purple: '#A55EEA'
};

export default function VictoryModal({ winner, players = {}, colors = [], teams = {}, finishStep = 56, myColor, onPlayAgain }) {
  useEffect(() => {
    sounds.playWinFanfare();
    
    // Confetti Fireworks Explosion
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 }
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 }
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }, []);

  // Build sorted player stats list
  const activeColors = colors.length > 0 ? colors : Object.keys(players);
  const playerStats = activeColors
    .map(color => {
      const p = players[color];
      if (!p) return null;
      const homeCount = p.tokens ? p.tokens.filter(s => s === finishStep).length : 0;
      const kills = p.kills || 0;
      const teamName = teams[color];
      const isWinner = winner && (
        winner.toLowerCase() === (p.name || '').toLowerCase() ||
        winner.toLowerCase() === color.toLowerCase() ||
        (teamName && winner.toLowerCase() === teamName.toLowerCase())
      );
      return {
        color,
        name: p.name || color.toUpperCase(),
        kills,
        homeCount,
        teamName,
        isWinner,
        isMe: color === myColor
      };
    })
    .filter(Boolean);

  // Sort by winner first, then homeCount desc, then kills desc
  playerStats.sort((a, b) => {
    if (a.isWinner !== b.isWinner) return b.isWinner ? 1 : -1;
    if (b.homeCount !== a.homeCount) return b.homeCount - a.homeCount;
    return b.kills - a.kills;
  });

  const getRankBadge = (index, isWinner) => {
    if (isWinner) return '👑';
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.88)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div className="glass-panel" style={{ 
        width: '100%', 
        maxWidth: '480px', 
        maxHeight: '90vh',
        padding: '28px 24px', 
        textAlign: 'center', 
        animation: 'scaleUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        
        {/* Header Icon */}
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #FFA502, #FF7F50)',
          margin: '0 auto 14px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          boxShadow: '0 10px 30px rgba(255, 165, 2, 0.5)',
          flexShrink: 0
        }}>
          <Trophy size={40} color="#FFF" />
        </div>

        <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#FFF', marginBottom: '4px' }}>
          VICTORY!
        </h2>

        <p style={{ fontSize: '1.15rem', fontWeight: 700, color: '#2ED573', marginBottom: '20px' }}>
          👑 {winner} Won The Match!
        </p>

        {/* Overall Game Stats Section */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '16px 14px',
          marginBottom: '20px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          flexGrow: 1
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '8px', 
            fontSize: '0.95rem', 
            fontWeight: 700, 
            color: '#94A3B8',
            marginBottom: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            <BarChart2 size={18} color="#818CF8" /> Match Overall Stats
          </div>

          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '10px', 
            overflowY: 'auto', 
            paddingRight: '4px',
            maxHeight: '260px'
          }}>
            {playerStats.map((p, idx) => {
              const mainHex = COLOR_HEX[p.color] || '#6366F1';
              return (
                <div 
                  key={p.color}
                  style={{
                    background: p.isWinner 
                      ? 'linear-gradient(135deg, rgba(255, 165, 2, 0.15), rgba(30, 41, 59, 0.8))' 
                      : 'rgba(30, 41, 59, 0.6)',
                    border: p.isWinner ? '1px solid rgba(255, 165, 2, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                    borderLeft: `5px solid ${mainHex}`,
                    borderRadius: '12px',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}
                >
                  {/* Left: Rank & Avatar & Name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, width: '24px', textAlign: 'center' }}>
                      {getRankBadge(idx, p.isWinner)}
                    </span>

                    <div style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '50%',
                      background: mainHex,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      boxShadow: p.isWinner ? `0 0 10px ${mainHex}` : 'none',
                      flexShrink: 0
                    }}>
                      <User size={18} color="#FFF" />
                    </div>

                    <div style={{ textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#FFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.name}
                        </span>
                        {p.isMe && <span style={{ fontSize: '0.72rem', color: '#818CF8', fontWeight: 600 }}>(You)</span>}
                        {p.isWinner && <Crown size={14} color="#FFA502" />}
                      </div>
                      {p.teamName && (
                        <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 500 }}>
                          {p.teamName}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Stats (Home Count & Kills) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                    {/* Kills Badge */}
                    <div style={{
                      background: 'rgba(255, 71, 87, 0.12)',
                      border: '1px solid rgba(255, 71, 87, 0.3)',
                      borderRadius: '8px',
                      padding: '4px 8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: '#FF6B81'
                    }} title="Kills">
                      <Swords size={13} color="#FF6B81" />
                      <span>{p.kills}</span>
                    </div>

                    {/* Home Count Badge */}
                    <div style={{
                      background: p.homeCount === 4 ? 'rgba(46, 213, 115, 0.18)' : 'rgba(255, 255, 255, 0.08)',
                      border: p.homeCount === 4 ? '1px solid rgba(46, 213, 115, 0.4)' : '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      padding: '4px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      color: p.homeCount === 4 ? '#2ED573' : '#E2E8F0'
                    }} title="Home Count">
                      <Home size={14} color={p.homeCount === 4 ? '#2ED573' : '#CBD5E1'} />
                      <span>{p.homeCount}/4</span>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>

        {/* Action Button */}
        <button 
          onClick={onPlayAgain}
          className="glass-btn primary" 
          style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '1.05rem', flexShrink: 0 }}
        >
          <RefreshCw size={19} /> Play Another Match
        </button>

      </div>
    </div>
  );
}
