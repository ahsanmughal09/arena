import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { sounds } from '../utils/audio';

const QUICK_EMOTES = ['🚀', '🔥', '😂', '😭', '🎯', '👑', '💥', '😎'];

export default function ChatPanel({ roomCode, socket, chatMessages }) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendText = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sounds.playClick();
    socket.emit('SEND_CHAT', { roomCode, text: inputText });
    setInputText('');
  };

  const handleSendEmote = (emote) => {
    sounds.playClick();
    socket.emit('SEND_CHAT', { roomCode, emote });
  };

  return (
    <div className="glass-panel" style={{ height: '100%', minHeight: '220px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', background: 'rgba(15, 23, 42, 0.6)', borderBottom: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <MessageSquare size={18} color="#818CF8" />
        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#FFF' }}>Room Chat & Reactions</span>
      </div>

      {/* Messages List */}
      <div style={{ flex: 1, padding: '12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {chatMessages.map((msg, idx) => (
          <div key={`msg-${idx}`} style={{ fontSize: '0.85rem' }}>
            {msg.sender === 'System' ? (
              <div style={{ color: '#94A3B8', fontStyle: 'italic', textAlign: 'center', margin: '4px 0' }}>
                {msg.text}
              </div>
            ) : (
              <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '6px 10px', borderRadius: '8px' }}>
                <span style={{ fontWeight: 700, color: msg.color ? `#${msg.color}` : '#818CF8' }}>
                  {msg.sender}:{' '}
                </span>
                {msg.emote ? (
                  <span style={{ fontSize: '1.4rem' }}>{msg.emote}</span>
                ) : (
                  <span style={{ color: '#F1F5F9' }}>{msg.text}</span>
                )}
                <span style={{ float: 'right', fontSize: '0.7rem', color: '#64748B', marginLeft: '8px' }}>{msg.time}</span>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Emotes Bar */}
      <div style={{ padding: '6px 12px', background: 'rgba(15, 23, 42, 0.4)', display: 'flex', gap: '6px', overflowX: 'auto' }}>
        {QUICK_EMOTES.map((e, idx) => (
          <button 
            key={`emote-${idx}`} 
            onClick={() => handleSendEmote(e)}
            style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', padding: '2px 4px', transition: 'transform 0.15s' }}
            onMouseDown={(e) => e.target.style.transform = 'scale(1.3)'}
            onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
          >
            {e}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSendText} style={{ padding: '8px 12px', display: 'flex', gap: '8px', borderTop: '1px solid var(--border-glass)' }}>
        <input 
          type="text" 
          className="glass-input" 
          placeholder="Say something..." 
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem' }}
        />
        <button type="submit" className="glass-btn primary" style={{ padding: '8px 14px' }}>
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
