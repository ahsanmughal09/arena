import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, Share } from 'lucide-react';
import { sounds } from '../utils/audio';

export default function InstallPwaBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosInstructions, setShowIosInstructions] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // 1. Check if already running in standalone mode (already installed)
    const isInStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    if (isInStandalone) {
      setIsStandalone(true);
      return;
    }

    // 2. Detect iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    // 3. Capture Android / Chrome beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Don't show if already installed as app or dismissed by user
  if (isStandalone || dismissed) return null;
  // Don't show on desktop Chrome if prompt not ready and not iOS
  if (!deferredPrompt && !isIos) return null;

  const handleInstallClick = async () => {
    sounds.playClick();

    if (isIos) {
      setShowIosInstructions(true);
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  return (
    <>
      <div 
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '540px',
          background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.25), rgba(30, 41, 59, 0.7))',
          border: '1px solid rgba(129, 140, 248, 0.4)',
          borderRadius: '16px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          marginBottom: '20px',
          boxShadow: '0 8px 24px rgba(79, 70, 229, 0.2)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #4F46E5, #818CF8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 0 12px rgba(99, 102, 241, 0.5)'
          }}>
            <Smartphone size={22} color="#FFF" />
          </div>

          <div>
            <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#FFF' }}>
              Install Ludo Arena App
            </div>
            <div style={{ fontSize: '0.74rem', color: '#CBD5E1' }}>
              Play full-screen without browser bar!
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleInstallClick}
            style={{
              background: 'linear-gradient(135deg, #2ED573, #10B981)',
              border: 'none',
              borderRadius: '10px',
              color: '#0F172A',
              fontWeight: 800,
              fontSize: '0.82rem',
              padding: '8px 14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 0 12px rgba(46, 213, 115, 0.4)',
              whiteSpace: 'nowrap'
            }}
          >
            <Download size={15} /> Install
          </button>

          <button
            onClick={() => setDismissed(true)}
            style={{
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Dismiss"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* iOS Installation Instructions Modal */}
      {showIosInstructions && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '400px',
            width: '100%',
            padding: '24px',
            borderRadius: '20px',
            textAlign: 'center',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{ fontSize: '2.4rem', marginBottom: '12px' }}>📱</div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFF', marginBottom: '12px' }}>
              Install on iPhone / iPad
            </h3>
            <ol style={{
              textAlign: 'left',
              color: '#CBD5E1',
              fontSize: '0.88rem',
              lineHeight: 1.6,
              paddingLeft: '20px',
              marginBottom: '20px'
            }}>
              <li style={{ marginBottom: '8px' }}>
                Tap the <strong>Share</strong> button <Share size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> in Safari menu.
              </li>
              <li>
                Scroll down & select <strong>"Add to Home Screen" ➕</strong>.
              </li>
            </ol>

            <button
              onClick={() => setShowIosInstructions(false)}
              className="glass-btn primary"
              style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
