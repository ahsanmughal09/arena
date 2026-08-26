import React, { useEffect } from 'react';
import { AlertTriangle, Info, CheckCircle2, XCircle, LogOut } from 'lucide-react';
import { sounds } from '../utils/audio';

export default function ConfirmModal({
  isOpen,
  title = 'Confirmation Required',
  message = 'Are you sure you want to proceed?',
  type = 'confirm', // 'confirm' or 'alert'
  variant = 'danger', // 'danger', 'error', 'warning', 'info', 'success'
  confirmText,
  cancelText = 'Cancel',
  onConfirm,
  onCancel
}) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (type === 'confirm' && onCancel) {
          sounds.playClick();
          onCancel();
        } else if (onConfirm) {
          sounds.playClick();
          onConfirm();
        }
      } else if (e.key === 'Enter') {
        sounds.playClick();
        if (onConfirm) onConfirm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, type, onConfirm, onCancel]);

  if (!isOpen) return null;

  // Icons and Color themes based on variant
  const themeMap = {
    danger: {
      bg: 'linear-gradient(135deg, #FF4757, #FF6B81)',
      glow: 'rgba(255, 71, 87, 0.4)',
      icon: LogOut,
      btnClass: 'danger-btn'
    },
    error: {
      bg: 'linear-gradient(135deg, #FF4757, #DC2626)',
      glow: 'rgba(239, 68, 68, 0.4)',
      icon: XCircle,
      btnClass: 'danger-btn'
    },
    warning: {
      bg: 'linear-gradient(135deg, #FFA502, #FF7F50)',
      glow: 'rgba(255, 165, 2, 0.4)',
      icon: AlertTriangle,
      btnClass: 'warning-btn'
    },
    info: {
      bg: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
      glow: 'rgba(99, 102, 241, 0.4)',
      icon: Info,
      btnClass: 'primary'
    },
    success: {
      bg: 'linear-gradient(135deg, #2ED573, #10B981)',
      glow: 'rgba(46, 213, 115, 0.4)',
      icon: CheckCircle2,
      btnClass: 'success-btn'
    }
  };

  const currentTheme = themeMap[variant] || themeMap.danger;
  const IconComponent = currentTheme.icon;

  const defaultConfirmText = type === 'confirm' ? 'Confirm' : 'OK';

  const handleConfirm = () => {
    sounds.playClick();
    if (onConfirm) onConfirm();
  };

  const handleCancel = () => {
    sounds.playClick();
    if (onCancel) onCancel();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(11, 14, 23, 0.82)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10000,
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '420px',
        padding: '32px 28px',
        textAlign: 'center',
        animation: 'scaleUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        boxShadow: `0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px ${currentTheme.glow}`
      }}>
        {/* Animated Icon Circle */}
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: currentTheme.bg,
          margin: '0 auto 20px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          boxShadow: `0 10px 25px ${currentTheme.glow}`
        }}>
          <IconComponent size={38} color="#FFF" />
        </div>

        {/* Modal Title */}
        <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FFF', marginBottom: '10px', letterSpacing: '-0.3px' }}>
          {title}
        </h3>

        {/* Message */}
        <p style={{ fontSize: '0.95rem', color: '#94A3B8', lineHeight: 1.5, marginBottom: '28px', fontWeight: 500 }}>
          {message}
        </p>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          {type === 'confirm' && (
            <button
              onClick={handleCancel}
              className="glass-btn"
              style={{
                flex: 1,
                justifyContent: 'center',
                padding: '12px 16px',
                fontSize: '0.95rem',
                background: 'rgba(255, 255, 255, 0.06)',
                borderColor: 'rgba(255, 255, 255, 0.15)',
                color: '#CBD5E1'
              }}
            >
              {cancelText}
            </button>
          )}

          <button
            onClick={handleConfirm}
            className={`glass-btn ${currentTheme.btnClass}`}
            style={{
              flex: 1,
              justifyContent: 'center',
              padding: '12px 16px',
              fontSize: '0.95rem',
              fontWeight: 700
            }}
          >
            {confirmText || defaultConfirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
