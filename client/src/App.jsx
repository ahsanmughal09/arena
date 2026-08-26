import React, { useState, useEffect } from 'react';
import { socket } from './utils/socket';
import { sounds } from './utils/audio';
import HomeLobby from './components/HomeLobby';
import GameLobby from './components/GameLobby';
import Board4P from './components/Board4P';
import Board6P from './components/Board6P';
import DiceRoller from './components/DiceRoller';
import ChatPanel from './components/ChatPanel';
import VictoryModal from './components/VictoryModal';
import AppealOverlay from './components/AppealOverlay';
import ThrowableOverlay from './components/ThrowableOverlay';
import ThrowablePickerModal from './components/ThrowablePickerModal';
import ExtraTurnBanner from './components/ExtraTurnBanner';
import ConfirmModal from './components/ConfirmModal';

export default function App() {
  const [view, setView] = useState('home'); // 'home', 'lobby', 'game'
  const [roomCode, setRoomCode] = useState('');
  const [myColor, setMyColor] = useState('');
  const [slots, setSlots] = useState({});
  const [settings, setSettings] = useState({ mode: '4P', teamMode: 'solo', turnTimer: 30 });
  const [gameState, setGameState] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [timeLeft, setTimeLeft] = useState(30);

  // Throwable Items State
  const [activeThrows, setActiveThrows] = useState([]);
  const [throwTarget, setThrowTarget] = useState(null);

  // Extra Turn Notification State
  const [extraTurnNotice, setExtraTurnNotice] = useState(null);

  // Custom Modal State (replaces native alert and confirm)
  const [modalConfig, setModalConfig] = useState(null);

  const showAlert = (title, message, variant = 'warning') => {
    setModalConfig({
      isOpen: true,
      type: 'alert',
      variant,
      title,
      message,
      confirmText: 'OK',
      onConfirm: () => setModalConfig(null)
    });
  };

  const showConfirm = ({ title, message, confirmText, cancelText, variant = 'danger', onConfirm }) => {
    setModalConfig({
      isOpen: true,
      type: 'confirm',
      variant,
      title,
      message,
      confirmText: confirmText || 'Confirm',
      cancelText: cancelText || 'Cancel',
      onConfirm: () => {
        setModalConfig(null);
        if (onConfirm) onConfirm();
      },
      onCancel: () => setModalConfig(null)
    });
  };

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

    socket.on('DICE_ROLLED', ({ color, roll, state }) => {
      setGameState(state);
      if (color === myColor) {
        sounds.playDiceRoll();
      }
      if (roll === 6) {
        setExtraTurnNotice({
          color,
          title: 'EXTRA ROLL!',
          subtitle: `${color.toUpperCase()} rolled a 6! 🎲`,
          icon: '🎲'
        });
      }
    });

    socket.on('TOKEN_MOVED', ({ state }) => {
      setGameState(state);
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

    // Appeal System Listeners
    socket.on('APPEAL_WINDOW_STARTED', ({ state }) => {
      setGameState(state);
    });

    socket.on('APPEAL_WINDOW_CLOSED', ({ state }) => {
      setGameState(state);
    });

    socket.on('APPEAL_STARTED', ({ state }) => {
      sounds.playClick();
      setGameState(state);
    });

    socket.on('APPEAL_RESOLVED', ({ success, state }) => {
      if (success) {
        sounds.playCapture();
      } else {
        sounds.playClick();
      }
      setGameState(state);
    });

    socket.on('APPEAL_TICK', ({ windowTimeLeft }) => {
      setGameState(prev => prev ? {
        ...prev,
        appealState: { ...(prev.appealState || {}), windowTimeLeft }
      } : prev);
    });

    socket.on('APPEAL_DEMO_TICK', ({ demoTimeLeft }) => {
      setGameState(prev => prev ? {
        ...prev,
        appealState: { ...(prev.appealState || {}), demoTimeLeft }
      } : prev);
    });

    socket.on('ITEM_THROWN', (throwData) => {
      setActiveThrows(prev => [...prev, throwData]);
    });

    return () => {
      socket.off('ROOM_UPDATED');
      socket.off('GAME_STARTED');
      socket.off('DICE_ROLLED');
      socket.off('TOKEN_MOVED');
      socket.off('GAME_STATE_UPDATE');
      socket.off('TIMER_TICK');
      socket.off('CHAT_MESSAGE');
      socket.off('APPEAL_WINDOW_STARTED');
      socket.off('APPEAL_WINDOW_CLOSED');
      socket.off('APPEAL_STARTED');
      socket.off('APPEAL_RESOLVED');
      socket.off('APPEAL_TICK');
      socket.off('APPEAL_DEMO_TICK');
      socket.off('ITEM_THROWN');
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
        sessionStorage.setItem('ludo_session', JSON.stringify({ roomCode: res.roomCode, color: res.color, name }));
        setView('lobby');
      } else {
        showAlert('Create Room Failed', res.error || 'Failed to create room.', 'error');
      }
    });
  };

  const handleJoinRoom = ({ roomCode: joinCode, name }) => {
    socket.emit('JOIN_ROOM', { roomCode: joinCode, name }, (res) => {
      if (res.success) {
        setRoomCode(res.roomCode);
        setMyColor(res.color);
        setSlots(res.slots);
        setSettings(res.settings);
        setGameState(res.state);
        sessionStorage.setItem('ludo_session', JSON.stringify({ roomCode: res.roomCode, color: res.color, name }));
        setView('lobby');
      } else {
        showAlert('Join Room Failed', res.error || 'Failed to join room.', 'error');
      }
    });
  };

  const handleStartGame = () => {
    socket.emit('START_GAME', { roomCode }, (res) => {
      if (res && res.error) {
        showAlert('Cannot Start Match', res.error, 'error');
      }
    });
  };

  const handleRollDice = (selectedDiceIndex = 0) => {
    socket.emit('ROLL_DICE', { roomCode, selectedDiceIndex });
  };

  const handleSelectRoll = (rollIndex) => {
    socket.emit('SELECT_ROLL', { roomCode, rollIndex });
  };

  const handleMoveToken = (tokenIndex, explicitRollIndex = null) => {
    if (gameState && gameState.appealState && gameState.appealState.inDemo) {
      const rIdx = (explicitRollIndex !== null && explicitRollIndex !== undefined) ? explicitRollIndex : 0;
      socket.emit('DEMO_MOVE_TOKEN', { roomCode, tokenIndex, rollIndex: rIdx });
      return;
    }
    const rIdx = explicitRollIndex !== null ? explicitRollIndex : (gameState?.selectedRollIndex || 0);
    socket.emit('MOVE_TOKEN', { roomCode, tokenIndex, rollIndex: rIdx });
  };

  const handleSubmitAppeal = () => {
    socket.emit('SUBMIT_APPEAL', { roomCode });
  };

  const handleBoardActionComplete = (noticeInfo) => {
    if (noticeInfo) {
      setExtraTurnNotice(noticeInfo);
    }
  };

  const handleOpenThrowMenu = (targetColor, targetName) => {
    sounds.playClick();
    setThrowTarget({ targetColor, targetName });
  };

  const handleSelectThrowItem = (targetColor, item) => {
    socket.emit('THROW_ITEM', { roomCode, targetColor, item });
  };

  const handlePlayAgain = () => {
    sessionStorage.removeItem('ludo_session');
    setView('home');
    setRoomCode('');
    setGameState(null);
  };

  const handleLeaveRoom = () => {
    const isPlaying = (view === 'game');
    const title = isPlaying ? 'Surrender Match?' : 'Leave Room?';
    const message = isPlaying 
      ? 'Are you sure you want to surrender and leave the active match?' 
      : 'Are you sure you want to leave the room?';
    const confirmText = isPlaying ? 'Surrender & Leave' : 'Leave Room';

    showConfirm({
      title,
      message,
      confirmText,
      cancelText: 'Stay in Room',
      variant: 'danger',
      onConfirm: () => {
        sounds.playClick();
        socket.emit('LEAVE_ROOM', { roomCode, color: myColor });
        sessionStorage.removeItem('ludo_session');
        setView('home');
        setRoomCode('');
        setMyColor('');
        setGameState(null);
        setSlots({});
      }
    });
  };

  const isHost = slots[myColor]?.isHost;
  const isMyTurn = gameState && gameState.activeColor === myColor;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', color: '#FFF' }}>
      
      {/* Global Throwable Items Flight & Splat Overlay */}
      <ThrowableOverlay activeThrows={activeThrows} />

      {/* Extra Turn Notification Banner */}
      <ExtraTurnBanner notice={extraTurnNotice} onClose={() => setExtraTurnNotice(null)} />

      {/* Custom Alert & Confirm Modal */}
      {modalConfig?.isOpen && (
        <ConfirmModal {...modalConfig} />
      )}

      {/* Throwable Item Picker Modal */}
      {throwTarget && (
        <ThrowablePickerModal
          targetColor={throwTarget.targetColor}
          targetName={throwTarget.targetName}
          onSelect={handleSelectThrowItem}
          onClose={() => setThrowTarget(null)}
        />
      )}

      {/* Home View */}
      {view === 'home' && (
        <HomeLobby onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} showAlert={showAlert} />
      )}

      {/* Lobby View */}
      {view === 'lobby' && (
        <GameLobby 
          roomCode={roomCode} 
          slots={slots} 
          settings={settings} 
          isHost={isHost} 
          myColor={myColor}
          onStartGame={handleStartGame} 
          onLeaveRoom={handleLeaveRoom}
          onOpenThrowMenu={handleOpenThrowMenu}
        />
      )}

      {/* Active Game View */}
      {view === 'game' && gameState && (
        <div style={{ position: 'relative', height: '100vh', maxHeight: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: '4px 10px', boxSizing: 'border-box', gap: '6px' }}>
          
          {/* Top Bar / Header */}
          <div className="glass-panel" style={{ padding: '6px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, background: 'linear-gradient(135deg, #FFF, #818CF8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                LUDO {gameState.mode} ({gameState.teamMode.toUpperCase()})
              </h2>
              <span style={{ fontSize: '0.8rem', color: '#CBD5E1', background: 'rgba(255,255,255,0.08)', padding: '3px 10px', borderRadius: '10px' }}>
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Your Color:</span>
              <span style={{ fontWeight: 700, color: `#${myColor}`, background: 'rgba(30, 41, 59, 0.8)', padding: '3px 10px', borderRadius: '10px', textTransform: 'uppercase', fontSize: '0.85rem' }}>
                {myColor}
              </span>
              <button 
                onClick={handleLeaveRoom}
                style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.5)',
                  color: '#EF4444',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  padding: '4px 10px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.2s ease'
                }}
              >
                🚪 Leave
              </button>
            </div>
          </div>

          {/* Main Game Layout (3-Column Layout: Left Chat | Center Board | Right Controls & Appeals) */}
          <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 240px', gap: '14px', flex: 1, minHeight: 0, alignItems: 'center' }}>
            
            {/* Left Column: Room Chat & Emote Reactions */}
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
              <ChatPanel 
                roomCode={roomCode}
                socket={socket}
                chatMessages={chatMessages}
                myColor={myColor}
              />
            </div>

            {/* Center Column: Interactive Board with Integrated Yard Participant Info */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: 0 }}>
              {gameState.mode === '4P' ? (
                <Board4P gameState={gameState} myColor={myColor} onMoveToken={handleMoveToken} onOpenThrowMenu={handleOpenThrowMenu} onActionComplete={handleBoardActionComplete} />
              ) : (
                <Board6P gameState={gameState} myColor={myColor} onMoveToken={handleMoveToken} onOpenThrowMenu={handleOpenThrowMenu} onActionComplete={handleBoardActionComplete} />
              )}
            </div>

            {/* Right Column: Dice Roller (Top Right) + Appeal Section (Middle Right) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%', minHeight: 0, justifyContent: 'flex-start' }}>
              
              {/* Dice Roller */}
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
                  allTokensInHome={gameState.allTokensInHome}
                  isHomeDiceSelectionMode={gameState.isHomeDiceSelectionMode}
                  timeLeft={timeLeft}
                  maxTime={gameState.turnTimer || 30}
                />
              </div>

              {/* Appeal Section in Right Column */}
              <AppealOverlay 
                appealState={gameState.appealState}
                canAppealLastTurn={gameState.canAppealLastTurn}
                lastTurnOffendingColor={gameState.lastTurnOffendingColor}
                myColor={myColor}
                playerAppealsLeft={gameState.players[myColor]?.appealsLeft ?? 3}
                onSubmitAppeal={handleSubmitAppeal}
              />

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

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Ludo Game ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: 'var(--bg-main)',
          color: '#FFF',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px'
        }}>
          <div className="glass-panel" style={{ padding: '30px', maxWidth: '480px', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FF4757', marginBottom: '12px' }}>
              ⚠️ Something went wrong
            </h2>
            <p style={{ fontSize: '0.9rem', color: '#CBD5E1', marginBottom: '20px' }}>
              An unexpected error occurred in the game interface.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="glass-btn primary"
              style={{ padding: '10px 20px', fontSize: '0.95rem' }}
            >
              🔄 Reload Game
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function WrappedApp() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
