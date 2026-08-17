'use client';

import React, { useEffect, useState } from 'react';
import { Download, Smartphone, Check, ArrowDownToLine, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export default function InstallAppButton({
  variant = 'navbar',
}: {
  variant?: 'navbar' | 'hero' | 'floating';
}) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    if (
      typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone)
    ) {
      setIsInstalled(true);
    }

    // Register Service Worker for seamless PWA installation
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(() => console.log('PWA Service Worker active'))
        .catch((err) => console.warn('Service worker registration:', err));
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setIsInstalling(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    setIsInstalling(true);

    if (deferredPrompt) {
      // Direct 1-Click Native Install Prompt
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          setIsInstalled(true);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.warn('Install prompt error:', err);
      } finally {
        setIsInstalling(false);
      }
    } else {
      // Fallback for browsers that require standard direct user action
      const isIOS = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
      if (isIOS) {
        alert('To install on iPhone/iPad:\nTap the Share icon at the bottom of Safari and select "Add to Home Screen".');
      } else {
        alert('To install this app on your device:\nTap the browser menu (⋮) and select "Install app" or "Add to Home screen".');
      }
      setIsInstalling(false);
    }
  };

  if (isInstalled) {
    return (
      <span className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-2.5 sm:px-3 py-1.5 text-xs text-emerald-400 font-medium shrink-0">
        <Check className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Installed</span>
      </span>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={handleInstallClick}
      type="button"
      disabled={isInstalling}
      className={`flex items-center gap-1.5 rounded-xl transition-all font-semibold shadow-sm shrink-0 select-none ${
        variant === 'navbar'
          ? 'border border-blue-500/30 bg-blue-600/10 hover:bg-blue-600 hover:text-white text-blue-400 px-2.5 sm:px-3 py-1.5 text-xs'
          : variant === 'hero'
          ? 'border border-blue-500/40 bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 text-sm'
          : 'border border-slate-700 bg-slate-900/90 text-white px-3 py-2 text-xs'
      }`}
      title="1-Click Download & Install Native App on Phone / PC"
    >
      <Download className="h-3.5 w-3.5 flex-shrink-0" />
      <span>{isInstalling ? 'Installing...' : 'Download App'}</span>
    </motion.button>
  );
}
