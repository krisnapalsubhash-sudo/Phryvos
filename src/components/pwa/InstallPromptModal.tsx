'use client';

import React, { useEffect, useState } from 'react';
import { Download, X, Sparkles } from 'lucide-react';
import { sound } from '@/lib/sound';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already running in standalone mode (PWA installed)
    const checkStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (checkStandalone) {
      setIsStandalone(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Only show if user hasn't dismissed it in this session
      const dismissed = sessionStorage.getItem('phryvos_pwa_dismissed');
      if (!dismissed) {
        setIsVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    sound.playPop(520);
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    sound.playPop(300);
    setIsVisible(false);
    sessionStorage.setItem('phryvos_pwa_dismissed', 'true');
  };

  if (isStandalone || !isVisible) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-sm z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="glass-panel border border-primary/30 p-4 rounded-2xl shadow-2xl backdrop-blur-xl bg-card/95 text-foreground flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl phryvos-gradient flex items-center justify-center text-white shrink-0 shadow-md">
          <Download className="w-5 h-5 animate-bounce" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 font-semibold text-sm">
            <span>Install Phryvos</span>
            <Sparkles className="w-3.5 h-3.5 text-primary" />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
            Add to home screen for fullscreen radar discovery and real-time alerts.
          </p>

          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={handleInstall}
              className="text-xs font-medium px-3.5 py-1.5 rounded-full bg-primary hover:bg-primary/90 text-white shadow-xs transition-all active:scale-95"
            >
              Install App
            </button>
            <button
              onClick={handleDismiss}
              className="text-xs font-medium px-3 py-1.5 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
            >
              Not now
            </button>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
