import React, { useState, useEffect, useRef } from 'react';
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
import ReactionOverlay from './components/ReactionOverlay';
import ReactionPickerModal from './components/ReactionPickerModal';
import ExtraTurnBanner from './components/ExtraTurnBanner';
import ConfirmModal from './components/ConfirmModal';
import confetti from 'canvas-confetti';
import { MessageSquare, X, Bot } from 'lucide-react';
import { getSmartAutoMove } from './utils/smartAutoPlayer';

const COLOR_HEX_CHIP = {
  red: '#FF4757',
  green: '#2ED573',
  yellow: '#FFA502',
  blue: '#1E90FF',
  orange: '#FF6B81',
  purple: '#A55EEA'
};

const REACTION_EMOJI_MAP = {
  laugh: { emoji: '😂', label: 'Laugh' },
  heart_eyes: { emoji: '😍', label: 'Heart Eyes' },
  tongue: { emoji: '😜', label: 'Tongue Out' },
  angry: { emoji: '😡', label: 'Angry' },
  cry: { emoji: '😭', label: 'Sobbing' },
  glasses: { emoji: '😎', label: 'Show Off' },
  frightened: { emoji: '😱', label: 'Frightened' },
  confused: { emoji: '😕', label: 'Confused' },
  nervous: { emoji: '😬', label: 'Nervous' },
  sad: { emoji: '🥺', label: 'Sad' }
};

const EMOJI_TO_REACTION_MAP = {
  '😂': { id: 'laugh', label: 'Laugh' },
  '😍': { id: 'heart_eyes', label: 'Heart Eyes' },
  '😜': { id: 'tongue', label: 'Tongue Out' },
  '😡': { id: 'angry', label: 'Angry' },
  '😭': { id: 'cry', label: 'Sobbing' },
  '😎': { id: 'glasses', label: 'Show Off' },
  '😱': { id: 'frightened', label: 'Frightened' },
  '😕': { id: 'confused', label: 'Confused' },
  '😬': { id: 'nervous', label: 'Nervous' },
  '🥺': { id: 'sad', label: 'Sad' }
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
  const [latestChatPopover, setLatestChatPopover] = useState(null);
  const chatPopoverTimerRef = useRef(null);

  // Throwable Items State
  const [activeThrows, setActiveThrows] = useState([]);
  const [throwTarget, setThrowTarget] = useState(null);

  // Emoji Reactions State
  const [activeReactions, setActiveReactions] = useState([]);
  const [isReactionPickerOpen, setIsReactionPickerOpen] = useState(false);

  // Extra Turn Notification State
  const [extraTurnNotice, setExtraTurnNotice] = useState(null);

  // Custom Modal State (replaces native alert and confirm)
  const [modalConfig, setModalConfig] = useState(null);

  // Smart Auto Play Mode State
  const [isAutoMode, setIsAutoMode] = useState(() => {
    try {
      return localStorage.getItem('ludo_auto_mode') === 'true';
    } catch {
      return false;
    }
  });

  const toggleAutoMode = () => {
    sounds.playClick();
    setIsAutoMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('ludo_auto_mode', String(next));
      } catch {}
      return next;
    });
  };

  // Victory Celebration State (5-second on-board celebration before full stats modal)
  const [showVictoryStats, setShowVictoryStats] = useState(false);
  const [celebrationActive, setCelebrationActive] = useState(false);

  // Turn Audio & Vibration Ref
  const prevActiveColorRef = React.useRef(null);

  useEffect(() => {
    if (view !== 'game' || !gameState || gameState.gameOver) return;

    const currentActive = gameState.activeColor;
    if (currentActive && currentActive !== prevActiveColorRef.current) {
      const isMyTurnNow = currentActive === myColor;

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

      prevActiveColorRef.current = currentActive;
    }
  }, [gameState?.activeColor, myColor, view]);

  useEffect(() => {
    if (gameState?.gameOver) {
      setCelebrationActive(true);
      setShowVictoryStats(false);
      sounds.playWinFanfare();

      // Side Confetti Cannons (Fire from left & right sides for 4 seconds over the board)
      const duration = 4 * 1000;
      const end = Date.now() + duration;

      const interval = setInterval(() => {
        // Left side cannon
        confetti({
          particleCount: 8,
          angle: 60,
          spread: 65,
          origin: { x: 0, y: 0.65 }
        });
        // Right side cannon
        confetti({
          particleCount: 8,
          angle: 120,
          spread: 65,
          origin: { x: 1, y: 0.65 }
        });
        // Center burst
        confetti({
          particleCount: 10,
          spread: 100,
          origin: { y: 0.5 }
        });

        if (Date.now() >= end) {
          clearInterval(interval);
        }
      }, 220);

      // Transition to full stats leaderboard modal after 4 seconds of on-board celebration
      const timer = setTimeout(() => {
        setShowVictoryStats(true);
      }, 4000);

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
      // If msg contains an emote reaction, trigger reaction popout and skip chat box log
      if (msg && msg.emote && EMOJI_TO_REACTION_MAP[msg.emote]) {
        const reactInfo = EMOJI_TO_REACTION_MAP[msg.emote];
        const reactionData = {
          id: `chat_react_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          fromColor: msg.color || 'red',
          senderName: msg.sender || 'Player',
          reactionId: reactInfo.id,
          emoji: msg.emote,
          label: reactInfo.label
        };
        setActiveReactions((prev) => [...prev, reactionData]);
        return;
      }

      if (!msg || (!msg.text && !msg.sender)) return;

      setChatMessages((prev) => [...prev, msg]);
      setIsMobileChatOpen((open) => {
        if (!open) {
          setUnreadChatCount((count) => count + 1);

          if (msg && msg.text) {
            setLatestChatPopover({
              sender: msg.sender || 'Player',
              color: msg.color || 'blue',
              text: msg.text || '',
              id: Date.now()
            });

            if (chatPopoverTimerRef.current) {
              clearTimeout(chatPopoverTimerRef.current);
            }
            chatPopoverTimerRef.current = setTimeout(() => {
              setLatestChatPopover(null);
            }, 4500);
          }
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

    socket.on('PLAYER_REACTED', (reactionData) => {
      setActiveReactions(prev => [...prev, reactionData]);
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
      socket.off('PLAYER_REACTED');
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

  const handleSendReaction = (reactionId) => {
    if (!reactionId || !roomCode) return;
    const reactInfo = REACTION_EMOJI_MAP[reactionId];
    if (!reactInfo) return;

    // 1. Optimistic Local Trigger for instant visual & audio feedback
    const localId = `local_react_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    setActiveReactions((prev) => [
      ...prev,
      {
        id: localId,
        fromColor: myColor || 'red',
        senderName: slots[myColor]?.name || (myColor ? myColor.toUpperCase() : 'YOU'),
        reactionId,
        emoji: reactInfo.emoji,
        label: reactInfo.label
      }
    ]);

    // 2. Broadcast via SEND_REACTION event
    socket.emit('SEND_REACTION', { roomCode, reactionId });

    // 3. Fallback broadcast via SEND_CHAT event to guarantee delivery across all server builds
    socket.emit('SEND_CHAT', { roomCode, text: null, emote: reactInfo.emoji });
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

  // Intercept Browser Back Button and Page Unload to prevent accidental leaving
  useEffect(() => {
    if (view !== 'lobby' && view !== 'game') return;

    // Push entry to browser history stack so Back button triggers popstate instead of exiting app
    window.history.pushState({ inGame: true }, '', window.location.href);

    const handlePopState = () => {
      // Re-push history entry so user remains on current page if they cancel
      window.history.pushState({ inGame: true }, '', window.location.href);
      handleLeaveRoom();
    };

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [view, roomCode, myColor]);

  // Lock document scroll and position when mobile chat drawer is open to prevent game scrolling
  useEffect(() => {
    if (isMobileChatOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalPosition = document.body.style.position;
      const originalWidth = document.body.style.width;
      const originalHeight = document.body.style.height;

      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
      document.documentElement.style.overflow = 'hidden';

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.position = originalPosition;
        document.body.style.width = originalWidth;
        document.body.style.height = originalHeight;
        document.documentElement.style.overflow = '';
      };
    }
  }, [isMobileChatOpen]);

  // Auto-enable Auto Mode if player fails to act within the turn time limit (30s timeout)
  useEffect(() => {
    if (view !== 'game' || !gameState || gameState.gameOver || gameState.appealState?.inDemo) return;

    const isMyTurn = (gameState.activeColor === myColor);
    if (isMyTurn && timeLeft === 0 && !isAutoMode) {
      setIsAutoMode(true);
      try {
        localStorage.setItem('ludo_auto_mode', 'true');
      } catch {}
    }
  }, [timeLeft, gameState?.activeColor, myColor, view, isAutoMode, gameState?.gameOver, gameState?.appealState?.inDemo]);

  // Smart Auto Play Loop for active turns
  const autoPlayTimerRef = useRef(null);

  useEffect(() => {
    if (!isAutoMode || view !== 'game' || !gameState || gameState.gameOver || gameState.appealState?.inDemo) {
      if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
      return;
    }

    const isMyTurn = (gameState.activeColor === myColor);
    if (!isMyTurn) {
      if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
      return;
    }

    // Clear previous pending timers
    if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);

    autoPlayTimerRef.current = setTimeout(() => {
      // 1. Auto Roll Dice if ready to roll
      if (gameState.canRoll) {
        handleRollDice(0);
        return;
      }

      // 2. Auto Move Token (Smart Evaluator) if moves available
      if (gameState.dicePool && gameState.dicePool.length > 0) {
        const smartMove = getSmartAutoMove(gameState, myColor);
        if (smartMove) {
          handleMoveToken(smartMove.tokenIndex, smartMove.rollIndex);
        }
      }
    }, 600);

    return () => {
      if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
    };
  }, [
    isAutoMode,
    view,
    gameState?.activeColor,
    gameState?.canRoll,
    gameState?.dicePool?.length,
    gameState?.selectedRollIndex,
    gameState?.gameOver,
    gameState?.appealState?.inDemo,
    myColor
  ]);

  const isHost = slots[myColor]?.isHost;
  const isMyTurn = gameState && gameState.activeColor === myColor;

  // Header Appeal calculation
  const canAppealLastTurn = gameState?.canAppealLastTurn;
  const lastTurnOffendingColor = gameState?.lastTurnOffendingColor;
  const myAppealsLeft = gameState?.players?.[myColor]?.appealsLeft ?? 3;
  const amIOffender = lastTurnOffendingColor && (myColor === lastTurnOffendingColor);
  const canHeaderAppeal = canAppealLastTurn && !amIOffender && myAppealsLeft > 0;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', color: '#FFF' }}>

      {/* Global Throwable Items Flight & Splat Overlay */}
      <ThrowableOverlay activeThrows={activeThrows} />

      {/* Global Real-Time Emoji Reaction Bubbles & Shower Overlay */}
      <ReactionOverlay activeReactions={activeReactions} />

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

      {/* Emoji Reaction Picker Modal */}
      <ReactionPickerModal
        isOpen={isReactionPickerOpen}
        onClose={() => setIsReactionPickerOpen(false)}
        onSelect={handleSendReaction}
      />

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
          onOpenReactionPicker={() => setIsReactionPickerOpen(true)}
          onSendReaction={handleSendReaction}
        />
      )}

      {/* Active Game View */}
      {view === 'game' && gameState && (
        <div className="game-screen-container">

          {/* Top Bar / Header */}
          <div className="glass-panel game-top-bar">
            {/* Left: Brand */}
            <div className="top-bar-left">
              <h2 className="top-bar-title">
                LUDO {gameState.mode}
              </h2>
            </div>

            {/* Right: Actions (Appeal, Chat, Leave) */}
            <div className="top-bar-right">
              {/* Header Appeal Button */}
              {canHeaderAppeal && (
                <button
                  onClick={() => {
                    sounds.playClick();
                    handleSubmitAppeal();
                  }}
                  title="Appeal missed kill!"
                  style={{
                    background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                    border: '1.5px solid #FEF08A',
                    borderRadius: '16px',
                    color: '#FFFFFF',
                    fontSize: '0.8rem',
                    padding: '5px 12px',
                    cursor: 'pointer',
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    boxShadow: '0 0 16px rgba(245, 158, 11, 0.9), 0 0 8px rgba(254, 240, 138, 0.8)',
                    animation: 'pulse 1s infinite',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <span>⚖️</span>
                  <span>APPEAL ({myAppealsLeft})</span>
                </button>
              )}

              {/* Appeal Demo Status Badge */}
              {gameState?.appealState?.inDemo && (
                <div style={{
                  background: '#4F46E5',
                  border: '1.5px solid #C7D2FE',
                  borderRadius: '16px',
                  color: '#FFF',
                  fontSize: '0.78rem',
                  fontWeight: 900,
                  padding: '5px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 0 12px rgba(79, 70, 229, 0.8)'
                }}>
                  <span>⏳ DEMO:</span>
                  <span>{gameState.appealState.demoTimeLeft}s</span>
                </div>
              )}

              {/* Smart Auto Play Toggle Button */}
              <button
                onClick={toggleAutoMode}
                title={isAutoMode ? 'Disable Smart Auto Play' : 'Enable Smart Auto Play'}
                className="top-bar-action-btn"
                style={{
                  background: isAutoMode
                    ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                    : 'rgba(30, 41, 59, 0.7)',
                  border: isAutoMode ? '1.5px solid #6EE7B7' : '1px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: isAutoMode ? '0 0 14px rgba(16, 185, 129, 0.8)' : 'none',
                  color: '#FFF'
                }}
              >
                <Bot size={14} color={isAutoMode ? '#6EE7B7' : '#94A3B8'} />
                <span>{isAutoMode ? 'AUTO ON' : 'AUTO'}</span>
              </button>

              {/* Chat Trigger Button with Message Popover Pointer */}
              <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                <button
                  onClick={() => {
                    setIsMobileChatOpen(true);
                    setUnreadChatCount(0);
                    setLatestChatPopover(null);
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

                {/* Popover pointing towards Chat trigger button */}
                {latestChatPopover && !isMobileChatOpen && (
                  <div
                    onClick={() => {
                      setIsMobileChatOpen(true);
                      setUnreadChatCount(0);
                      setLatestChatPopover(null);
                    }}
                    style={{
                      position: 'fixed',
                      top: '46px',
                      right: '12px',
                      zIndex: 999999,
                      background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.98), rgba(15, 23, 42, 0.98))',
                      backdropFilter: 'blur(16px)',
                      WebkitBackdropFilter: 'blur(16px)',
                      border: `1.5px solid ${COLOR_HEX_CHIP[latestChatPopover.color] || '#818CF8'}`,
                      borderRadius: '16px',
                      padding: '8px 12px',
                      boxShadow: `0 12px 30px rgba(0, 0, 0, 0.8), 0 0 25px ${COLOR_HEX_CHIP[latestChatPopover.color] || '#818CF8'}60`,
                      minWidth: '180px',
                      maxWidth: '260px',
                      cursor: 'pointer',
                      animation: 'popIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                      textAlign: 'left'
                    }}
                  >
                    {/* Arrow pointing UP directly at the Chat button */}
                    <div style={{
                      position: 'absolute',
                      top: '-7px',
                      right: '24px',
                      width: 0,
                      height: 0,
                      borderLeft: '7px solid transparent',
                      borderRight: '7px solid transparent',
                      borderBottom: `7px solid ${COLOR_HEX_CHIP[latestChatPopover.color] || '#818CF8'}`
                    }} />

                    {/* Popover Header: Sender & time */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MessageSquare size={11} color={COLOR_HEX_CHIP[latestChatPopover.color] || '#818CF8'} />
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          color: COLOR_HEX_CHIP[latestChatPopover.color] || '#818CF8',
                          lineHeight: 1.1
                        }}>
                          {latestChatPopover.sender}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.62rem', color: '#94A3B8', fontWeight: 600 }}>
                        now
                      </span>
                    </div>

                    {/* Popover Message Content (Truncated if long) */}
                    <span style={{
                      fontSize: '0.78rem',
                      color: '#F8FAFC',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '100%',
                      marginTop: '2px'
                    }}>
                      {latestChatPopover.text.length > 35
                        ? latestChatPopover.text.slice(0, 35) + '...'
                        : latestChatPopover.text}
                    </span>
                  </div>
                )}
              </div>

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
                  onOpenReactionPicker={() => setIsReactionPickerOpen(true)}
                  onSendReaction={handleSendReaction}
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
                        timeLeft={timeLeft}
                        onMoveToken={handleMoveToken}
                        onOpenThrowMenu={handleOpenThrowMenu}
                        onActionComplete={handleBoardActionComplete}
                      />
                    ) : (
                      <Board6P
                        gameState={gameState}
                        myColor={myColor}
                        timeLeft={timeLeft}
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
              onTouchMove={(e) => {
                if (e.target === e.currentTarget) e.preventDefault();
              }}
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

          {/* On-Board Center Winner Celebration Card (Board stays visible for 4s with side confetti) */}
          {celebrationActive && !showVictoryStats && (
            <div
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 500,
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95))',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderRadius: '24px',
                border: '2px solid #F59E0B',
                boxShadow: '0 0 50px rgba(245, 158, 11, 0.6), 0 0 30px rgba(254, 240, 138, 0.8)',
                padding: '24px 36px',
                color: '#FFF',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                textAlign: 'center',
                animation: 'winCardCenterPop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)',
                pointerEvents: 'none',
                maxWidth: '90vw'
              }}
            >
              <div style={{ fontSize: '3rem', filter: 'drop-shadow(0 4px 12px rgba(245,158,11,0.8))' }}>
                👑
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', color: '#2ED573', textShadow: '0 2px 10px rgba(46, 213, 115, 0.5)' }}>
                🎉 {(() => {
                  const rawWinner = gameState.winner || '';
                  if (gameState.players) {
                    const matchKey = Object.keys(gameState.players).find(c => {
                      const p = gameState.players[c];
                      return c.toLowerCase() === rawWinner.toLowerCase() || (p && p.name && p.name.toLowerCase() === rawWinner.toLowerCase());
                    });
                    if (matchKey && gameState.players[matchKey]?.name) {
                      return gameState.players[matchKey].name.toUpperCase();
                    }
                  }
                  return rawWinner.toUpperCase();
                })()} WINS! 🎉
              </div>
              <div style={{ fontSize: '0.82rem', color: '#CBD5E1', fontWeight: 700 }}>
                Match Completed • Preparing Stats...
              </div>
            </div>
          )}

          {/* Victory Modal (shown after 4 seconds of on-board celebration) */}
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
