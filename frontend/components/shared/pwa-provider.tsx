'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { WifiOff, Wifi, Download, Smartphone, X, CheckCircle2, Share, PlusSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface PWAContextType {
  isInstallable: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  promptInstall: () => Promise<boolean>;
  showIOSPrompt: boolean;
  closeIOSPrompt: () => void;
}

const PWAContext = createContext<PWAContextType>({
  isInstallable: false,
  isInstalled: false,
  isOnline: true,
  promptInstall: async () => false,
  showIOSPrompt: false,
  closeIOSPrompt: () => {},
});

export const usePWA = () => useContext(PWAContext);

export default function PWAProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [showOnlineToast, setShowOnlineToast] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);

  // 1. Check standalone mode & listen to PWA install events
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if already in standalone display mode
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    // Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[PWA] Service Worker registered with scope:', reg.scope);
        })
        .catch((err) => {
          console.warn('[PWA] Service Worker registration failed:', err);
        });
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      console.log('[PWA] App successfully installed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // 2. Real-time Network Connection Monitoring
  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowOnlineToast(true);
      setTimeout(() => setShowOnlineToast(false), 3500);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOnlineToast(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic lightweight reachability check
    const pingInterval = setInterval(async () => {
      if (navigator.onLine) {
        try {
          // Fetch favicon or manifest with small timeout to check true internet connectivity
          const res = await fetch('/manifest.json?ping=' + Date.now(), { method: 'HEAD', cache: 'no-store' });
          if (!res.ok && isOnline) {
            setIsOnline(false);
          } else if (res.ok && !isOnline) {
            handleOnline();
          }
        } catch {
          if (isOnline) setIsOnline(false);
        }
      }
    }, 20000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(pingInterval);
    };
  }, [isOnline]);

  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setIsInstalled(true);
          setDeferredPrompt(null);
          return true;
        }
      } catch (err) {
        console.warn('[PWA] Install prompt failed:', err);
      }
      return false;
    }

    // If iOS Safari without beforeinstallprompt
    const isIOS = typeof window !== 'undefined' && /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    if (isIOS) {
      setShowIOSPrompt(true);
      return false;
    }

    return false;
  }, [deferredPrompt]);

  const closeIOSPrompt = () => setShowIOSPrompt(false);

  return (
    <PWAContext.Provider
      value={{
        isInstallable: !!deferredPrompt && !isInstalled,
        isInstalled,
        isOnline,
        promptInstall,
        showIOSPrompt,
        closeIOSPrompt,
      }}
    >
      {children}

      {/* ===== 1. Non-Blocking Persistent Offline Warning Banner ===== */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.25 }}
            className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-3 px-4 py-2.5 text-xs font-medium bg-amber-600 text-white shadow-lg backdrop-blur-md"
          >
            <div className="flex items-center gap-2 max-w-2xl mx-auto flex-1 min-w-0">
              <WifiOff className="h-4 w-4 shrink-0 animate-pulse" />
              <span className="truncate">
                <strong>No Internet Connection:</strong> You are currently in offline mode. Cached chats and documents are available.
              </span>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="shrink-0 rounded-lg bg-white/20 hover:bg-white/30 px-2.5 py-1 text-[11px] font-semibold transition"
            >
              Retry
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== 2. Temporary Online Recovery Notification Toast ===== */}
      <AnimatePresence>
        {showOnlineToast && (
          <motion.div
            initial={{ opacity: 0, y: -30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-xl bg-emerald-600 text-white px-4 py-2 text-xs font-semibold shadow-xl"
          >
            <Wifi className="h-4 w-4 shrink-0" />
            <span>Back Online - Reconnected successfully</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== 3. Non-Blocking iOS Safari Install Card Modal ===== */}
      <AnimatePresence>
        {showIOSPrompt && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="relative w-full max-w-sm rounded-2xl border p-5 shadow-2xl space-y-3.5"
              style={{
                backgroundColor: 'var(--card-bg)',
                borderColor: 'var(--card-border)',
                color: 'var(--text-primary)',
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-bold shadow-sm">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                      Install on iPhone / iPad
                    </h4>
                    <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                      Add to your home screen for full app experience
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeIOSPrompt}
                  className="text-slate-400 hover:text-white p-1 rounded-lg transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div
                className="space-y-2 rounded-xl p-3 border text-xs"
                style={{
                  backgroundColor: 'var(--card-inner)',
                  borderColor: 'var(--card-border)',
                  color: 'var(--text-secondary)',
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white text-[10px] font-bold shrink-0">1</span>
                  <span>Tap the <strong>Share</strong> button in Safari</span>
                  <Share className="h-3.5 w-3.5 text-blue-400 inline shrink-0 ml-auto" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white text-[10px] font-bold shrink-0">2</span>
                  <span>Scroll down & tap <strong>Add to Home Screen</strong></span>
                  <PlusSquare className="h-3.5 w-3.5 text-blue-400 inline shrink-0 ml-auto" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white text-[10px] font-bold shrink-0">3</span>
                  <span>Tap <strong>Add</strong> at top right to launch</span>
                </div>
              </div>

              <button
                onClick={closeIOSPrompt}
                className="w-full rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white hover:bg-blue-500 transition shadow-sm"
              >
                Got it
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PWAContext.Provider>
  );
}
