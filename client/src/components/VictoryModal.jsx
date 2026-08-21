import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RefreshCw } from 'lucide-react';
import { sounds } from '../utils/audio';

export default function VictoryModal({ winner, onPlayAgain }) {
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

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '36px', textAlign: 'center', animation: 'scaleUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
        
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #FFA502, #FF7F50)',
          margin: '0 auto 20px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          boxShadow: '0 10px 30px rgba(255, 165, 2, 0.5)'
        }}>
          <Trophy size={44} color="#FFF" />
        </div>

        <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#FFF', marginBottom: '8px' }}>
          VICTORY!
        </h2>

        <p style={{ fontSize: '1.2rem', fontWeight: 700, color: '#2ED573', marginBottom: '24px' }}>
          👑 {winner} Won The Match!
        </p>

        <button 
          onClick={onPlayAgain}
          className="glass-btn primary" 
          style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '1.1rem' }}
        >
          <RefreshCw size={20} /> Play Another Match
        </button>

      </div>
    </div>
  );
}
