import React, { useState, useEffect } from 'react';
import { socket } from './utils/socket';
import { sounds } from './utils/audio';
import { getCornerMap4P } from './utils/orientation';
import HomeLobby from './components/HomeLobby';
import GameLobby from './components/GameLobby';
import Board4P from './components/Board4P';
import Board6P from './components/Board6P';
import MiniCornerPod from './components/MiniCornerPod';
import ChatPanel from './components/ChatPanel';
import VictoryModal from './components/VictoryModal';
import ThrowableOverlay from './components/ThrowableOverlay';
import ThrowablePickerModal from './components/ThrowablePickerModal';
import ExtraTurnBanner from './components/ExtraTurnBanner';
import ConfirmModal from './components/ConfirmModal';
import confetti from 'canvas-confetti';
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

  // Victory Celebration State (5-second on-board celebration before full stats modal)
  const [showVictoryStats, setShowVictoryStats] = useState(false);
  const [celebrationActive, setCelebrationActive] = useState(false);

  // Turn Toast Notification State & Ref
  const [turnToastNotice, setTurnToastNotice] = useState(null);
  const prevActiveColorRef = React.useRef(null);

  useEffect(() => {
    if (view !== 'game' || !gameState || gameState.gameOver) return;

    const currentActive = gameState.activeColor;
    if (currentActive && currentActive !== prevActiveColorRef.current) {
      const isMyTurnNow = currentActive === myColor;
      const activePlayerName = gameState.players?.[currentActive]?.name || currentActive.toUpperCase();

      // 1. Trigger Sound & Haptic Vibration
      if (isMyTurnNow) {
        sounds.playYourTurn();
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          try {
            navigator.vibrate([180, 90, 180]);
          } catch {
            // vibration fallback
          }
        }
      } else {
        sounds.playTurnChange();
      }

      // 2. Show Turn Pop-in Toast
      setTurnToastNotice({
        color: currentActive,
        isMyTurn: isMyTurnNow,
        name: activePlayerName
      });

      const toastTimer = setTimeout(() => {
        setTurnToastNotice(null);
      }, 2200);

      prevActiveColorRef.current = currentActive;

      return () => clearTimeout(toastTimer);
    }
  }, [gameState?.activeColor, myColor, view]);

  useEffect(() => {
    if (gameState?.gameOver) {
      setCelebrationActive(true);
      setShowVictoryStats(false);
      sounds.playWinFanfare();

      // Fire festive confetti over the board for 5 seconds
      const duration = 5 * 1000;
      const end = Date.now() + duration;
      const interval = setInterval(() => {
        confetti({
          particleCount: 6,
          angle: 60,
          spread: 65,
          origin: { x: 0.15, y: 0.7 }
        });
        confetti({
          particleCount: 6,
          angle: 120,
          spread: 65,
          origin: { x: 0.85, y: 0.7 }
        });
        confetti({
          particleCount: 8,
          spread: 90,
          origin: { y: 0.45 }
        });
        if (Date.now() >= end) {
          clearInterval(interval);
        }
      }, 250);

      // Transition to full stats leaderboard modal after 5 seconds
      const timer = setTimeout(() => {
        setShowVictoryStats(true);
      }, 5000);

      return () => {
        clearInterval(interval);
        clearTimeout(timer);
      };
    } else {
      setShowVictoryStats(false);
      setCelebrationActive(false);
    }
  }, [gameState?.gameOver]);

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

      {/* Animated Turn Pop-in Toast Overlay */}
      {turnToastNotice && (
        <div
          className="turn-toast-overlay"
          style={{
            position: 'fixed',
            top: '60px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 250,
            background: turnToastNotice.isMyTurn 
              ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.96), rgba(16, 185, 129, 0.96))'
              : `linear-gradient(135deg, ${COLOR_HEX_CHIP[turnToastNotice.color]}E6, #0F172A)`,
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: turnToastNotice.isMyTurn ? '2px solid #86EFAC' : `2px solid ${COLOR_HEX_CHIP[turnToastNotice.color]}`,
            borderRadius: '24px',
            padding: '8px 22px',
            boxShadow: turnToastNotice.isMyTurn 
              ? '0 10px 30px rgba(34, 197, 94, 0.6), 0 0 20px rgba(134, 239, 172, 0.8)' 
              : `0 10px 30px ${COLOR_HEX_CHIP[turnToastNotice.color]}60`,
            color: '#FFF',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            animation: 'turnToastPop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
            pointerEvents: 'none'
          }}
        >
          <span style={{ fontSize: '1.4rem' }}>
            {turnToastNotice.isMyTurn ? '⚡' : '🎲'}
          </span>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.92rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {turnToastNotice.isMyTurn ? "IT'S YOUR TURN!" : `${turnToastNotice.name}'S TURN`}
            </span>
            <span style={{ fontSize: '0.7rem', color: turnToastNotice.isMyTurn ? '#DCFCE7' : '#E2E8F0', fontWeight: 700 }}>
              {turnToastNotice.isMyTurn ? "Roll the dice now!" : `Waiting for ${turnToastNotice.name}...`}
            </span>
          </div>
        </div>
      )}

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
            {/* Left: Brand & Room Code */}
            <div className="top-bar-left">
              <h2 className="top-bar-title">
                LUDO {gameState.mode}
              </h2>
              <span className="top-bar-room-badge">
                <strong style={{ color: '#818CF8' }}>#{roomCode}</strong>
              </span>
              {gameState.customRules?.diceCount === 2 && (
                <span className="top-bar-rule-chip desktop-only-rule">
                  🎲 2 Dice
                </span>
              )}
              {gameState.customRules?.killRequiredToEnterHome && (
                <span className="top-bar-rule-chip desktop-only-rule">
                  🎯 Kill Req
                </span>
              )}
            </div>

            {/* Center: Prominent Active Turn Pill */}
            {gameState.activeColor && (
              <div 
                className={`top-bar-turn-badge ${isMyTurn ? 'my-turn-active-pill' : ''}`}
                style={{
                  background: isMyTurn 
                    ? 'linear-gradient(135deg, rgba(46, 213, 115, 0.28), rgba(15, 23, 42, 0.95))' 
                    : `linear-gradient(135deg, ${COLOR_HEX_CHIP[gameState.activeColor]}28, rgba(15, 23, 42, 0.95))`,
                  border: isMyTurn ? '1.5px solid #2ED573' : `1.5px solid ${COLOR_HEX_CHIP[gameState.activeColor] || '#6366F1'}`,
                  boxShadow: isMyTurn ? '0 0 14px rgba(46, 213, 115, 0.6)' : `0 0 10px ${COLOR_HEX_CHIP[gameState.activeColor]}40`
                }}
              >
                <div 
                  className="turn-dot-indicator"
                  style={{
                    background: isMyTurn ? '#2ED573' : (COLOR_HEX_CHIP[gameState.activeColor] || '#6366F1'),
                    boxShadow: `0 0 8px ${COLOR_HEX_CHIP[gameState.activeColor]}`
                  }} 
                />
                <span className="turn-text-content">
                  {isMyTurn ? (
                    <span style={{ color: '#2ED573', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      ⚡ YOUR TURN
                    </span>
                  ) : (
                    <span style={{ color: '#CBD5E1' }}>
                      Turn: <strong style={{ color: COLOR_HEX_CHIP[gameState.activeColor] }}>
                        {(gameState.players?.[gameState.activeColor]?.name || gameState.activeColor).toUpperCase()}
                      </strong>
                    </span>
                  )}
                </span>
                {timeLeft !== undefined && (
                  <span 
                    className="turn-timer-badge"
                    style={{
                      color: timeLeft <= 5 ? '#FF4757' : (timeLeft <= 10 ? '#FFA502' : '#F1F5F9')
                    }}
                  >
                    ⏱️{timeLeft}s
                  </span>
                )}
              </div>
            )}

            {/* Right: Actions (Chat, My Color, Leave) */}
            <div className="top-bar-right">
              <button
                onClick={() => {
                  setIsMobileChatOpen(true);
                  setUnreadChatCount(0);
                }}
                className="top-bar-action-btn chat-btn"
                title="Open Room Chat"
              >
                <MessageSquare size={13} color="#818CF8" />
                <span className="btn-label-desktop">Chat</span>
                {unreadChatCount > 0 && (
                  <span className="unread-badge">
                    {unreadChatCount}
                  </span>
                )}
              </button>

              <span 
                className="top-bar-mycolor-badge"
                style={{
                  color: COLOR_HEX_CHIP[myColor] || '#FFF',
                  borderColor: COLOR_HEX_CHIP[myColor] || 'rgba(255,255,255,0.2)'
                }}
              >
                {myColor}
              </span>

              <button 
                onClick={handleLeaveRoom}
                className="top-bar-action-btn leave-btn"
                title="Leave Room"
              >
                <span>🚪</span>
                <span className="btn-label-desktop">Leave</span>
              </button>
            </div>
          </div>

          {/* Main Game Layout with Outside-Connected Minimalist Corner Dice Pods */}
          {(() => {
            const cornerMap = getCornerMap4P(myColor);
            const renderPodByColor = (color) => {
              if (!color) return null;
              return (
                <MiniCornerPod
                  color={color}
                  player={gameState.players?.[color]}
                  teamName={gameState.teams?.[color]}
                  isMe={myColor === color}
                  isActive={gameState.activeColor === color}
                  isMyTurn={isMyTurn && gameState.activeColor === color}
                  gameState={{ ...gameState, timeLeft }}
                  onRollDice={handleRollDice}
                  onSelectRoll={handleSelectRoll}
                  onOpenThrowMenu={handleOpenThrowMenu}
                  onSubmitAppeal={handleSubmitAppeal}
                />
              );
            };

            return (
              <div className="game-main-layout">
                {/* Desktop Left Side Column: Top-Left Pod & Bottom-Left Pod (myColor) + Chat */}
                <div className="desktop-side-col left-side-col">
                  {renderPodByColor(cornerMap.TL)}

                  <div className="desktop-chat-wrapper">
                    <ChatPanel 
                      roomCode={roomCode}
                      socket={socket}
                      chatMessages={chatMessages}
                      myColor={myColor}
                    />
                  </div>

                  {renderPodByColor(cornerMap.BL)}
                </div>

                {/* Center Area: Connected Top/Bottom Pods on Mobile + Centered Board */}
                <div className="center-game-wrapper">
                  
                  {/* Mobile Top Connected Pods: Top-Left & Top-Right */}
                  <div className="mobile-pods-row top-pods">
                    {renderPodByColor(cornerMap.TL)}
                    {renderPodByColor(cornerMap.TR)}
                  </div>

                  {/* Centered Clean Board */}
                  <div className="center-board-col">
                    {gameState.mode === '4P' ? (
                      <Board4P 
                        gameState={gameState} 
                        myColor={myColor} 
                        onMoveToken={handleMoveToken} 
                        onOpenThrowMenu={handleOpenThrowMenu} 
                        onActionComplete={handleBoardActionComplete} 
                      />
                    ) : (
                      <Board6P 
                        gameState={gameState} 
                        myColor={myColor} 
                        onMoveToken={handleMoveToken} 
                        onOpenThrowMenu={handleOpenThrowMenu} 
                        onActionComplete={handleBoardActionComplete} 
                      />
                    )}
                  </div>

                  {/* Mobile Bottom Connected Pods: Bottom-Left (myColor) & Bottom-Right */}
                  <div className="mobile-pods-row bottom-pods">
                    {renderPodByColor(cornerMap.BL)}
                    {renderPodByColor(cornerMap.BR)}
                  </div>

                </div>

                {/* Desktop Right Side Column: Top-Right Pod & Bottom-Right Pod */}
                <div className="desktop-side-col right-side-col">
                  {renderPodByColor(cornerMap.TR)}

                  <div className="desktop-auxiliary-wrapper" style={{ flex: 1 }}>
                    {/* Clean spacer / auxiliary area */}
                  </div>

                  {renderPodByColor(cornerMap.BR)}
                </div>

              </div>
            );
          })()}

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

          {/* On-Board Victory Celebration Banner (Stays visible over board for 5 seconds before stats) */}
          {celebrationActive && !showVictoryStats && (
            <div 
              style={{
                position: 'fixed',
                top: '56px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 200,
                background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.96), rgba(202, 138, 4, 0.96))',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderRadius: '30px',
                border: '2px solid #FEF08A',
                boxShadow: '0 10px 40px rgba(234, 179, 8, 0.6), 0 0 25px rgba(254, 240, 138, 0.8)',
                padding: '8px 24px',
                color: '#FFF',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                animation: 'pulse 1s infinite, slideDown 0.3s ease-out',
                pointerEvents: 'none'
              }}
            >
              <span style={{ fontSize: '1.6rem' }}>🏆</span>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '1rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', color: '#FFF', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                  🎉 {gameState.winner?.toUpperCase()} WINS! 🎉
                </span>
                <span style={{ fontSize: '0.72rem', color: '#FEF9C3', fontWeight: 700 }}>
                  Board celebrating... stats in a moment
                </span>
              </div>
              <span style={{ fontSize: '1.6rem' }}>👑</span>
            </div>
          )}

          {/* Victory Modal (shown after 5 seconds of on-board celebration) */}
          {gameState.gameOver && showVictoryStats && (
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
