import React, { useState, useEffect } from 'react';
import { socket } from './utils/socket';
import { sounds } from './utils/audio';
import HomeLobby from './components/HomeLobby';
import GameLobby from './components/GameLobby';
import Board4P from './components/Board4P';
import Board6P from './components/Board6P';
import DiceRoller from './components/DiceRoller';
import PlayerCard from './components/PlayerCard';
import ChatPanel from './components/ChatPanel';
import VictoryModal from './components/VictoryModal';

export default function App() {
  const [view, setView] = useState('home'); // 'home', 'lobby', 'game'
  const [roomCode, setRoomCode] = useState('');
  const [myColor, setMyColor] = useState('');
  const [slots, setSlots] = useState({});
  const [settings, setSettings] = useState({ mode: '4P', teamMode: 'solo', turnTimer: 30 });
  const [gameState, setGameState] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    // Socket Event Listeners
    socket.on('ROOM_UPDATED', ({ slots: newSlots, settings: newSettings }) => {
      if (newSlots) setSlots(newSlots);
      if (newSettings) setSettings(newSettings);
    });

    socket.on('GAME_STARTED', ({ state }) => {
      sounds.playClick();
      setGameState(state);
      setView('game');
    });

    socket.on('DICE_ROLLED', ({ color, state }) => {
      setGameState(state);
      if (color === myColor) {
        sounds.playDiceRoll();
      }
    });

    socket.on('TOKEN_MOVED', ({ moveRes, state }) => {
      setGameState(state);
      if (moveRes && moveRes.action && moveRes.action.captured) {
        sounds.playCapture();
      } else {
        sounds.playTokenStep();
      }
    });

    socket.on('GAME_STATE_UPDATE', ({ state }) => {
      setGameState(state);
    });

    socket.on('TIMER_TICK', ({ timeLeft: t }) => {
      setTimeLeft(t);
    });

    socket.on('CHAT_MESSAGE', (msg) => {
      setChatMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.off('ROOM_UPDATED');
      socket.off('GAME_STARTED');
      socket.off('DICE_ROLLED');
      socket.off('TOKEN_MOVED');
      socket.off('GAME_STATE_UPDATE');
      socket.off('TIMER_TICK');
      socket.off('CHAT_MESSAGE');
    };
  }, [myColor]);

  useEffect(() => {
    // Attempt auto-rejoin from sessionStorage on refresh / reconnect
    const savedSessionRaw = sessionStorage.getItem('ludo_session');
    if (savedSessionRaw) {
      try {
        const { roomCode: savedCode, color: savedColor, name: savedName } = JSON.parse(savedSessionRaw);
        if (savedCode && savedColor) {
          socket.emit('REJOIN_ROOM', { roomCode: savedCode, color: savedColor, name: savedName }, (res) => {
            if (res && res.success) {
              setRoomCode(res.roomCode);
              setMyColor(res.color);
              setSlots(res.slots);
              setSettings(res.settings);
              setGameState(res.state);
              if (res.state && res.state.gameStarted) {
                setView('game');
              } else {
                setView('lobby');
              }
            } else {
              sessionStorage.removeItem('ludo_session');
            }
          });
        }
      } catch {
        sessionStorage.removeItem('ludo_session');
      }
    }
  }, []);

  // Handlers
  const handleCreateRoom = ({ name, mode, teamMode, turnTimer, diceCount, extraTurnOnKill, extraTurnOnHome, killRequiredToEnterHome }) => {
    socket.emit('CREATE_ROOM', { name, mode, teamMode, turnTimer, diceCount, extraTurnOnKill, extraTurnOnHome, killRequiredToEnterHome }, (res) => {
      if (res.success) {
        setRoomCode(res.roomCode);
        setMyColor(res.color);
        setSlots(res.slots);
        setSettings(res.settings);
        setGameState(res.state);
        setView('lobby');
        sessionStorage.setItem('ludo_session', JSON.stringify({ roomCode: res.roomCode, color: res.color, name }));
      } else {
        alert(res.error || 'Failed to create room.');
      }
    });
  };

  const handleJoinRoom = ({ name, roomCode: code }) => {
    socket.emit('JOIN_ROOM', { name, roomCode: code }, (res) => {
      if (res.success) {
        setRoomCode(res.roomCode);
        setMyColor(res.color);
        setSlots(res.slots);
        setSettings(res.settings);
        setGameState(res.state);
        setView('lobby');
        sessionStorage.setItem('ludo_session', JSON.stringify({ roomCode: res.roomCode, color: res.color, name }));
      } else {
        alert(res.error || 'Failed to join room.');
      }
    });
  };

  const handleStartGame = () => {
    socket.emit('START_GAME', { roomCode }, (res) => {
      if (res && res.error) {
        alert(res.error);
      }
    });
  };

  const handleRollDice = () => {
    socket.emit('ROLL_DICE', { roomCode });
  };

  const handleSelectRoll = (rollIndex) => {
    socket.emit('SELECT_ROLL', { roomCode, rollIndex });
  };

  const handleMoveToken = (tokenIndex, explicitRollIndex = null) => {
    const rIdx = explicitRollIndex !== null ? explicitRollIndex : (gameState?.selectedRollIndex || 0);
    socket.emit('MOVE_TOKEN', { roomCode, tokenIndex, rollIndex: rIdx });
  };

  const handlePlayAgain = () => {
    sessionStorage.removeItem('ludo_session');
    setView('home');
    setRoomCode('');
    setGameState(null);
  };

  const handleLeaveRoom = () => {
    const isPlaying = (view === 'game');
    const confirmText = isPlaying 
      ? 'Are you sure you want to surrender and leave the match?' 
      : 'Are you sure you want to leave the room?';

    if (window.confirm(confirmText)) {
      sounds.playClick();
      socket.emit('LEAVE_ROOM', { roomCode, color: myColor });
      sessionStorage.removeItem('ludo_session');
      setView('home');
      setRoomCode('');
      setMyColor('');
      setGameState(null);
      setSlots({});
    }
  };

  const isHost = slots[myColor]?.isHost;
  const isMyTurn = gameState && gameState.activeColor === myColor;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', color: '#FFF' }}>
      
      {/* Home View */}
      {view === 'home' && (
        <HomeLobby onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} />
      )}

      {/* Lobby View */}
      {view === 'lobby' && (
        <GameLobby 
          roomCode={roomCode} 
          slots={slots} 
          settings={settings} 
          isHost={isHost} 
          onStartGame={handleStartGame} 
          onLeaveRoom={handleLeaveRoom}
        />
      )}

      {/* Active Game View */}
      {view === 'game' && gameState && (
        <div style={{ height: '100vh', maxHeight: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: '12px 20px', boxSizing: 'border-box', gap: '12px' }}>
          
          {/* Top Bar / Header */}
          <div className="glass-panel" style={{ padding: '8px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, background: 'linear-gradient(135deg, #FFF, #818CF8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                LUDO {gameState.mode} ({gameState.teamMode.toUpperCase()})
              </h2>
              <span style={{ fontSize: '0.85rem', color: '#CBD5E1', background: 'rgba(255,255,255,0.08)', padding: '4px 12px', borderRadius: '12px' }}>
                Room: <strong style={{ color: '#818CF8' }}>{roomCode}</strong>
              </span>
              {gameState.customRules?.diceCount === 2 && (
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#2ED573', background: 'rgba(46, 213, 115, 0.15)', border: '1px solid rgba(46, 213, 115, 0.3)', padding: '2px 8px', borderRadius: '8px' }}>
                  🎲 2 Dice Mode
                </span>
              )}
              {gameState.customRules?.killRequiredToEnterHome && (
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#FFA502', background: 'rgba(255, 165, 2, 0.15)', border: '1px solid rgba(255, 165, 2, 0.3)', padding: '2px 8px', borderRadius: '8px' }}>
                  🎯 Kill Required for Home
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '0.85rem', color: '#94A3B8' }}>Your Color:</span>
              <span style={{ fontWeight: 700, color: `#${myColor}`, background: 'rgba(30, 41, 59, 0.8)', padding: '4px 12px', borderRadius: '12px', textTransform: 'uppercase' }}>
                {myColor}
              </span>
              <button 
                onClick={handleLeaveRoom}
                style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.5)',
                  color: '#EF4444',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  padding: '6px 14px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease'
                }}
              >
                🚪 Surrender / Leave
              </button>
            </div>
          </div>

          {/* Main Game Layout (No Scroll Fit Grid) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 280px) 1fr minmax(280px, 320px)', gap: '16px', flex: 1, minHeight: 0, alignItems: 'center' }}>
            
            {/* Left Column: Player Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '100%', overflowY: 'auto' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#94A3B8', marginBottom: '2px' }}>Players & Teams</h3>
              {gameState.colors.map(color => (
                <PlayerCard 
                  key={`card-${color}`}
                  color={color}
                  player={gameState.players[color]}
                  isActive={gameState.activeColor === color}
                  isMe={color === myColor}
                  teamName={gameState.teams[color]}
                  finishStep={gameState.finishStep}
                  timeLeft={timeLeft}
                  turnTimer={gameState.turnTimer}
                />
              ))}
            </div>

            {/* Middle Column: Interactive Board */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: 0 }}>
              {gameState.mode === '4P' ? (
                <Board4P gameState={gameState} myColor={myColor} onMoveToken={handleMoveToken} />
              ) : (
                <Board6P gameState={gameState} myColor={myColor} onMoveToken={handleMoveToken} />
              )}
            </div>

            {/* Right Column: Dice Roller (Top Right of Ludo) + Chat Panel (Bottom Right) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%', minHeight: 0 }}>
              
              {/* Dice Roller on Right Side of Ludo */}
              <div className="glass-panel" style={{ padding: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#818CF8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  🎲 Dice Controls
                </h3>
                <DiceRoller 
                  currentDice={gameState.currentDice}
                  dicePool={gameState.dicePool}
                  selectedRollIndex={gameState.selectedRollIndex}
                  canRoll={gameState.canRoll}
                  isMyTurn={isMyTurn}
                  activeColor={gameState.activeColor}
                  onRollDice={handleRollDice}
                  onSelectRoll={handleSelectRoll}
                  diceCount={gameState.customRules?.diceCount || 1}
                />
              </div>

              {/* Chat Panel Below Dice Roller */}
              <div style={{ flex: 1, minHeight: 0 }}>
                <ChatPanel 
                  roomCode={roomCode}
                  socket={socket}
                  chatMessages={chatMessages}
                  myColor={myColor}
                />
              </div>

            </div>

          </div>

          {/* Victory Modal */}
          {gameState.gameOver && (
            <VictoryModal winner={gameState.winner} onPlayAgain={handlePlayAgain} />
          )}

        </div>
      )}

    </div>
  );
}
