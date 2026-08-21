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

  // Handlers
  const handleCreateRoom = ({ name, mode, teamMode, turnTimer }) => {
    socket.emit('CREATE_ROOM', { name, mode, teamMode, turnTimer }, (res) => {
      if (res.success) {
        setRoomCode(res.roomCode);
        setMyColor(res.color);
        setSlots(res.slots);
        setSettings(res.settings);
        setGameState(res.state);
        setView('lobby');
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

  const handleMoveToken = (tokenIndex) => {
    socket.emit('MOVE_TOKEN', { roomCode, tokenIndex, rollIndex: gameState.selectedRollIndex });
  };

  const handlePlayAgain = () => {
    setView('home');
    setRoomCode('');
    setGameState(null);
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
        />
      )}

      {/* Active Game View */}
      {view === 'game' && gameState && (
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '16px', display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
          
          {/* Top Bar / Header */}
          <div className="glass-panel" style={{ padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, background: 'linear-gradient(135deg, #FFF, #818CF8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                LUDO {gameState.mode} ({gameState.teamMode.toUpperCase()})
              </h2>
              <span style={{ fontSize: '0.85rem', color: '#CBD5E1', background: 'rgba(255,255,255,0.08)', padding: '4px 12px', borderRadius: '12px' }}>
                Room: <strong style={{ color: '#818CF8' }}>{roomCode}</strong>
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '0.85rem', color: '#94A3B8' }}>Your Color:</span>
              <span style={{ fontWeight: 700, color: `#${myColor}`, background: 'rgba(30, 41, 59, 0.8)', padding: '4px 12px', borderRadius: '12px', textTransform: 'uppercase' }}>
                {myColor}
              </span>
            </div>
          </div>

          {/* Main Game Layout (Grid) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 320px) 1fr minmax(280px, 320px)', gap: '20px', alignItems: 'start' }}>
            
            {/* Left Column: Player Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#94A3B8', marginBottom: '4px' }}>Players & Teams</h3>
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

            {/* Middle Column: Interactive Board & Dice Roller */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
              {gameState.mode === '4P' ? (
                <Board4P gameState={gameState} myColor={myColor} onMoveToken={handleMoveToken} />
              ) : (
                <Board6P gameState={gameState} myColor={myColor} onMoveToken={handleMoveToken} />
              )}

              {/* Dice Roller Controls */}
              <DiceRoller 
                currentDice={gameState.currentDice}
                dicePool={gameState.dicePool}
                selectedRollIndex={gameState.selectedRollIndex}
                canRoll={gameState.canRoll}
                isMyTurn={isMyTurn}
                activeColor={gameState.activeColor}
                onRollDice={handleRollDice}
                onSelectRoll={handleSelectRoll}
                validMoves={gameState.validMoves}
              />
            </div>

            {/* Right Column: Chat & Emoji Panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <ChatPanel 
                roomCode={roomCode}
                socket={socket}
                chatMessages={chatMessages}
                myColor={myColor}
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
