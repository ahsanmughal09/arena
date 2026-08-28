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
import { MessageSquare, X } from 'lucide-react';

const COLOR_HEX_CHIP = {
  red: '#FF4757',
  green: '#2ED573',
  yellow: '#FFA502',
  blue: '#1E90FF',
  orange: '#FF6B81',
  purple: '#A55EEA'
};

export default function App() {
  const [view, setView] = useState('home'); // 'home', 'lobby', 'game'
  const [roomCode, setRoomCode] = useState('');
  const [myColor, setMyColor] = useState('');
  const [slots, setSlots] = useState({});
  const [settings, setSettings] = useState({ mode: '4P', teamMode: 'solo', turnTimer: 30 });
  const [gameState, setGameState] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

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

    socket.on('DICE_ROLLED', ({ color, roll, penalty, state }) => {
      setGameState(state);
      if (color === myColor) {
        sounds.playDiceRoll();
      }

      if (penalty) {
        const isFourSixes = Array.isArray(roll) && roll.length === 2;
        setExtraTurnNotice({
          color,
          title: '🚫 TURN CANCELLED!',
          subtitle: isFourSixes 
            ? `4 Consecutive Sixes! Turn cancelled & all rolls lost for ${color.toUpperCase()}! 🚫`
            : `3 Consecutive Sixes! Turn cancelled & all rolls lost for ${color.toUpperCase()}! 🚫`,
          icon: '🚫',
          isPenalty: true
        });
      } else if (!Array.isArray(roll) && roll === 6) {
        setExtraTurnNotice({
          color,
          title: 'EXTRA ROLL!',
          subtitle: `${color.toUpperCase()} rolled a 6! 🎲`,
          icon: '🎲'
        });
      } else if (Array.isArray(roll) && roll.length === 2 && roll[0] === 6 && roll[1] === 6) {
        setExtraTurnNotice({
          color,
          title: 'EXTRA ROLL!',
          subtitle: `${color.toUpperCase()} rolled Double 6s! 🎲🎲`,
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
      setIsMobileChatOpen((open) => {
        if (!open) {
          setUnreadChatCount((count) => count + 1);
        }
        return open;
      });
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
        <div className="game-screen-container">
          
          {/* Top Bar / Header */}
          <div className="glass-panel game-top-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, background: 'linear-gradient(135deg, #FFF, #818CF8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                LUDO {gameState.mode}
              </h2>
              <span style={{ fontSize: '0.75rem', color: '#CBD5E1', background: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: '8px' }}>
                Room: <strong style={{ color: '#818CF8' }}>{roomCode}</strong>
              </span>
              {gameState.customRules?.diceCount === 2 && (
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#2ED573', background: 'rgba(46, 213, 115, 0.15)', border: '1px solid rgba(46, 213, 115, 0.3)', padding: '1px 6px', borderRadius: '6px' }}>
                  🎲 2 Dice
                </span>
              )}
              {gameState.customRules?.killRequiredToEnterHome && (
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#FFA502', background: 'rgba(255, 165, 2, 0.15)', border: '1px solid rgba(255, 165, 2, 0.3)', padding: '1px 6px', borderRadius: '6px' }}>
                  🎯 Kill Req
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontWeight: 800, color: `#${myColor}`, background: 'rgba(30, 41, 59, 0.8)', border: `1px solid ${COLOR_HEX_CHIP[myColor] || 'rgba(255,255,255,0.2)'}`, padding: '2px 8px', borderRadius: '8px', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                {myColor}
              </span>
              <button 
                onClick={handleLeaveRoom}
                style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.5)',
                  color: '#EF4444',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  padding: '3px 8px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  transition: 'all 0.2s ease'
                }}
              >
                🚪 Leave
              </button>
            </div>
          </div>

          {/* Main Game Layout (Responsive Grid: 3-Column on Desktop | Centered Stack on Mobile) */}
          <div className="game-main-layout">
            
            {/* Left Column: Desktop Chat */}
            <div className="desktop-chat-col">
              <ChatPanel 
                roomCode={roomCode}
                socket={socket}
                chatMessages={chatMessages}
                myColor={myColor}
              />
            </div>

            {/* Center Column: Interactive Responsive Board */}
            <div className="center-board-col">
              {gameState.mode === '4P' ? (
                <Board4P gameState={gameState} myColor={myColor} onMoveToken={handleMoveToken} onOpenThrowMenu={handleOpenThrowMenu} onActionComplete={handleBoardActionComplete} />
              ) : (
                <Board6P gameState={gameState} myColor={myColor} onMoveToken={handleMoveToken} onOpenThrowMenu={handleOpenThrowMenu} onActionComplete={handleBoardActionComplete} />
              )}
            </div>

            {/* Right Column: Desktop Controls */}
            <div className="right-controls-col">
              
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

            {/* Mobile Bottom Dock (Active on Mobile/Tablet <= 1024px) */}
            <div className="mobile-bottom-dock">
              {/* Chat Toggle Button */}
              <button
                onClick={() => {
                  setIsMobileChatOpen(true);
                  setUnreadChatCount(0);
                }}
                style={{
                  position: 'relative',
                  background: 'rgba(30, 41, 59, 0.85)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  borderRadius: '12px',
                  color: '#FFF',
                  padding: '6px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '2px',
                  cursor: 'pointer',
                  flexShrink: 0,
                  minWidth: '48px'
                }}
              >
                <MessageSquare size={16} color="#818CF8" />
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#CBD5E1' }}>Chat</span>
                {unreadChatCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    background: '#EF4444',
                    color: '#FFF',
                    fontSize: '0.6rem',
                    fontWeight: 900,
                    padding: '1px 5px',
                    borderRadius: '10px',
                    boxShadow: '0 0 6px rgba(239, 68, 68, 0.8)'
                  }}>
                    {unreadChatCount}
                  </span>
                )}
              </button>

              {/* Center Compact Dice Roller */}
              <div style={{ flex: 1, display: 'flex', justifyContent: 'center', minWidth: 0 }}>
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
                  compact={true}
                />
              </div>

              {/* Mobile Appeal Button */}
              {(gameState.canAppealLastTurn || gameState.appealState?.inDemo) && (
                <button
                  onClick={handleSubmitAppeal}
                  style={{
                    background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                    border: '1px solid #FCD34D',
                    borderRadius: '12px',
                    color: '#FFF',
                    padding: '6px 8px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '2px',
                    cursor: 'pointer',
                    flexShrink: 0,
                    minWidth: '48px',
                    boxShadow: '0 0 12px rgba(245, 158, 11, 0.5)',
                    animation: 'pulse 1s infinite'
                  }}
                >
                  <span style={{ fontSize: '0.9rem' }}>⚖️</span>
                  <span style={{ fontSize: '0.6rem', fontWeight: 900 }}>Appeal</span>
                </button>
              )}
            </div>

          </div>

          {/* Mobile Chat Sliding Drawer Modal */}
          {isMobileChatOpen && (
            <div 
              className="mobile-drawer-backdrop" 
              onClick={() => setIsMobileChatOpen(false)}
            >
              <div 
                className="mobile-drawer-content" 
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{
                  padding: '10px 16px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MessageSquare size={18} color="#818CF8" />
                    <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#FFF' }}>Room Chat & Reactions</span>
                  </div>
                  <button
                    onClick={() => setIsMobileChatOpen(false)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '28px',
                      height: '28px',
                      color: '#FFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
                <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                  <ChatPanel 
                    roomCode={roomCode}
                    socket={socket}
                    chatMessages={chatMessages}
                    myColor={myColor}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Victory Modal */}
          {gameState.gameOver && (
            <VictoryModal 
              winner={gameState.winner} 
              players={gameState.players}
              colors={gameState.colors}
              teams={gameState.teams}
              finishStep={gameState.finishStep || (gameState.mode === '6P' ? 76 : 56)}
              myColor={myColor}
              onPlayAgain={handlePlayAgain} 
            />
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
