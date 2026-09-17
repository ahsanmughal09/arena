import React, { useState } from 'react';
import { Shield, Timer, Play, LogIn } from 'lucide-react';
import { sounds } from '../utils/audio';
import InstallPwaBanner from './InstallPwaBanner';

export default function HomeLobby({ onCreateRoom, onJoinRoom, showAlert }) {
  const [name, setName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [tab, setTab] = useState('create'); // 'create' or 'join'
  
  // Game Type Selection ('ludo' or 'snakes_and_ladders')
  const [gameType, setGameType] = useState('ludo');

  // Settings for Create Room
  const [mode] = useState('4P');
  const [teamMode, setTeamMode] = useState('2v2'); // 4P: 'solo', '2v2'
  const [turnTimer, setTurnTimer] = useState('30');
  const [diceCount, setDiceCount] = useState(1); // 1 or 2

  // Custom House Rules Toggles
  const [extraTurnOnKill, setExtraTurnOnKill] = useState(true);
  const [extraTurnOnHome, setExtraTurnOnHome] = useState(true);
  const [killRequiredToEnterHome, setKillRequiredToEnterHome] = useState(true);

  const handleGameTypeChange = (type) => {
    sounds.playClick();
    setGameType(type);
    if (type === 'snakes_and_ladders') {
      setTeamMode('solo');
      setDiceCount(1);
    } else {
      setTeamMode('2v2');
    }
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      if (showAlert) {
        showAlert('Nickname Required', 'Please enter your nickname before creating a room.', 'warning');
      }
      return;
    }
    sounds.playClick();
    onCreateRoom({ 
      name: name.trim(), 
      gameType,
      mode, 
      teamMode: gameType === 'snakes_and_ladders' ? 'solo' : teamMode, 
      turnTimer, 
      diceCount: gameType === 'snakes_and_ladders' ? 1 : diceCount,
      extraTurnOnKill, 
      extraTurnOnHome, 
      killRequiredToEnterHome 
    });
  };

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      if (showAlert) {
        showAlert('Nickname Required', 'Please enter your nickname before joining a room.', 'warning');
      }
      return;
    }
    if (!joinCode.trim()) {
      if (showAlert) {
        showAlert('Invalid Room Code', 'Please enter a valid 6-character room code.', 'warning');
      }
      return;
    }
    sounds.playClick();
    onJoinRoom({ name: name.trim(), roomCode: joinCode.trim().toUpperCase() });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
      
      {/* PWA Mobile Installation Prompt Banner */}
      <InstallPwaBanner />

      <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '32px' }}>
        
        {/* Title Banner */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, background: 'linear-gradient(135deg, #FFF, #818CF8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            LUDO ARENA
          </h1>
          <p style={{ color: '#94A3B8', fontSize: '0.95rem', marginTop: '6px' }}>
            Real-Time 4-Player Custom Rules Multiplayer
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.6)', padding: '4px', borderRadius: '12px', marginBottom: '24px' }}>
          <button 
            type="button" 
            onClick={() => { sounds.playClick(); setTab('create'); }}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '8px',
              border: 'none',
              background: tab === 'create' ? 'var(--accent)' : 'transparent',
              color: tab === 'create' ? '#FFF' : '#94A3B8',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Create Room
          </button>
          <button 
            type="button" 
            onClick={() => { sounds.playClick(); setTab('join'); }}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '8px',
              border: 'none',
              background: tab === 'join' ? 'var(--accent)' : 'transparent',
              color: tab === 'join' ? '#FFF' : '#94A3B8',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Join Room
          </button>
        </div>

        {/* Player Name Input */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '8px' }}>
            Your Nickname
          </label>
          <input 
            type="text" 
            className="glass-input" 
            placeholder="e.g. Alex, Champion" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: '100%' }}
            maxLength={14}
          />
        </div>

        {tab === 'create' ? (
          <form onSubmit={handleCreateSubmit}>
            {/* Game Type Selection */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '8px' }}>
                🎮 Select Game Mode
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button 
                  type="button" 
                  onClick={() => handleGameTypeChange('ludo')}
                  className="glass-btn"
                  style={{
                    justifyContent: 'center',
                    padding: '14px 10px',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    background: gameType === 'ludo' ? 'linear-gradient(135deg, #6366F1, #4F46E5)' : 'rgba(30, 41, 59, 0.6)',
                    border: gameType === 'ludo' ? '2px solid #818CF8' : '1px solid rgba(255, 255, 255, 0.15)',
                    boxShadow: gameType === 'ludo' ? '0 0 16px rgba(99, 102, 241, 0.5)' : 'none',
                    color: '#FFF'
                  }}
                >
                  🎲 Ludo Arena {gameType === 'ludo' ? '✓' : ''}
                </button>
                <button 
                  type="button" 
                  onClick={() => handleGameTypeChange('snakes_and_ladders')}
                  className="glass-btn"
                  style={{
                    justifyContent: 'center',
                    padding: '14px 10px',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    background: gameType === 'snakes_and_ladders' ? 'linear-gradient(135deg, #10B981, #059669)' : 'rgba(30, 41, 59, 0.6)',
                    border: gameType === 'snakes_and_ladders' ? '2px solid #34D399' : '1px solid rgba(255, 255, 255, 0.15)',
                    boxShadow: gameType === 'snakes_and_ladders' ? '0 0 16px rgba(16, 185, 129, 0.5)' : 'none',
                    color: '#FFF'
                  }}
                >
                  🐍 Snakes & Ladders {gameType === 'snakes_and_ladders' ? '✓' : ''}
                </button>
              </div>
            </div>

            {gameType === 'ludo' ? (
              <>
                {/* Team Mode Selection */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '8px' }}>
                    <Shield size={16} color="#2ED573" /> Teaming & Match Rules
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <button 
                      type="button" 
                      onClick={() => { sounds.playClick(); setTeamMode('2v2'); }}
                      className={`glass-btn ${teamMode === '2v2' ? 'primary' : ''}`}
                      style={{ justifyContent: 'center' }}
                    >
                      2v2 Diagonal Teams
                    </button>
                    <button 
                      type="button" 
                      onClick={() => { sounds.playClick(); setTeamMode('solo'); }}
                      className={`glass-btn ${teamMode === 'solo' ? 'primary' : ''}`}
                      style={{ justifyContent: 'center' }}
                    >
                      Free For All (1v1v1v1)
                    </button>
                  </div>
                </div>

                {/* Dice Count Selection */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '8px' }}>
                    🎲 Dice Mode (1 Dice or 2 Dice)
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <button 
                      type="button" 
                      onClick={() => { sounds.playClick(); setDiceCount(1); }}
                      className={`glass-btn ${diceCount === 1 ? 'primary' : ''}`}
                      style={{ justifyContent: 'center' }}
                    >
                      1 Dice (Classic)
                    </button>
                    <button 
                      type="button" 
                      onClick={() => { sounds.playClick(); setDiceCount(2); }}
                      className={`glass-btn ${diceCount === 2 ? 'primary' : ''}`}
                      style={{ justifyContent: 'center' }}
                    >
                      2 Dice (Dual Roll)
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* Snakes & Ladders Locked Rules Summary */
              <div style={{ marginBottom: '20px', background: 'rgba(15, 23, 42, 0.5)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#4ADE80', marginBottom: '6px' }}>
                  🐍 Snakes & Ladders Rules (4 Players Max)
                </div>
                <div style={{ fontSize: '0.8rem', color: '#CBD5E1', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span>• 👤 <b>Free For All (No Teaming)</b> - 4 Players</span>
                  <span>• 🎲 <b>Single Dice</b> - Rolling a 6 gives an extra turn</span>
                  <span>• 🪜 <b>Ladders Climb</b> up & 🐍 <b>Snakes Bite</b> down</span>
                  <span>• 🎯 <b>Exact 100</b> required to reach the Goal!</span>
                </div>
              </div>
            )}

            {/* Turn Timer Selection */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '8px' }}>
                <Timer size={16} color="#FFA502" /> Turn Countdown Timer
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <button 
                  type="button" 
                  onClick={() => { sounds.playClick(); setTurnTimer('15'); }}
                  className={`glass-btn ${turnTimer === '15' ? 'primary' : ''}`}
                  style={{ justifyContent: 'center', padding: '8px' }}
                >
                  15 Seconds
                </button>
                <button 
                  type="button" 
                  onClick={() => { sounds.playClick(); setTurnTimer('30'); }}
                  className={`glass-btn ${turnTimer === '30' ? 'primary' : ''}`}
                  style={{ justifyContent: 'center', padding: '8px' }}
                >
                  30 Seconds
                </button>
                <button 
                  type="button" 
                  onClick={() => { sounds.playClick(); setTurnTimer('0'); }}
                  className={`glass-btn ${turnTimer === '0' ? 'primary' : ''}`}
                  style={{ justifyContent: 'center', padding: '8px' }}
                >
                  Unlimited
                </button>
              </div>
            </div>

            {/* Custom House Rules Section (Only for Ludo) */}
            {gameType === 'ludo' && (
              <div style={{ marginBottom: '28px', background: 'rgba(15, 23, 42, 0.5)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700, color: '#818CF8', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  ⚙️ Custom House Rules
                </label>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem', color: '#E2E8F0', cursor: 'pointer' }}>
                    <span>⚡ Extra Turn on Kill (Capture)</span>
                    <input 
                      type="checkbox" 
                      checked={extraTurnOnKill} 
                      onChange={(e) => { sounds.playClick(); setExtraTurnOnKill(e.target.checked); }} 
                      style={{ width: '18px', height: '18px', accentColor: '#6366F1', cursor: 'pointer' }}
                    />
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem', color: '#E2E8F0', cursor: 'pointer' }}>
                    <span>🏠 Extra Turn on Home Finish</span>
                    <input 
                      type="checkbox" 
                      checked={extraTurnOnHome} 
                      onChange={(e) => { sounds.playClick(); setExtraTurnOnHome(e.target.checked); }} 
                      style={{ width: '18px', height: '18px', accentColor: '#6366F1', cursor: 'pointer' }}
                    />
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem', color: '#E2E8F0', cursor: 'pointer' }}>
                    <span>🎯 Must Kill Opponent to Enter Home</span>
                    <input 
                      type="checkbox" 
                      checked={killRequiredToEnterHome} 
                      onChange={(e) => { sounds.playClick(); setKillRequiredToEnterHome(e.target.checked); }} 
                      style={{ width: '18px', height: '18px', accentColor: '#6366F1', cursor: 'pointer' }}
                    />
                  </label>
                </div>
              </div>
            )}

            <button type="submit" className="glass-btn primary" style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '1.1rem' }}>
              <Play size={20} /> Create Room Lobby
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoinSubmit}>
            <div style={{ marginBottom: '28px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '8px' }}>
                6-Digit Room Code
              </label>
              <input 
                type="text" 
                className="glass-input" 
                placeholder="e.g. LUDO6X" 
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                style={{ width: '100%', fontSize: '1.4rem', letterSpacing: '4px', textAlign: 'center', fontWeight: 700 }}
                maxLength={6}
              />
            </div>

            <button type="submit" className="glass-btn primary" style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '1.1rem' }}>
              <LogIn size={20} /> Join Match Room
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
