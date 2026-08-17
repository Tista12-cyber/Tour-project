'use client';

import React, { useEffect, useState } from 'react';
import { Download, Smartphone, Check, Share, PlusSquare, X } from 'lucide-react';
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
  const [showModal, setShowModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed as PWA)
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    // Check if device is iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      setShowModal(true);
    }
  };

  if (isInstalled) {
    return (
      <span className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-400 font-medium">
        <Check className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">App Installed</span>
      </span>
    );
  }

  return (
    <>
      <button
        onClick={handleInstallClick}
        type="button"
        className={`flex items-center gap-1.5 rounded-xl transition-all font-medium shadow-sm ${
          variant === 'navbar'
            ? 'border border-blue-500/30 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 px-3 py-1.5 text-xs'
            : variant === 'hero'
            ? 'border border-blue-500/40 bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 text-sm font-semibold'
            : 'border border-slate-700 bg-slate-900/90 text-white px-3 py-2 text-xs'
        }`}
        title="Download / Install Mobile App"
      >
        <Download className="h-3.5 w-3.5 flex-shrink-0" />
        <span>Download App</span>
      </button>

      {/* Install Instruction Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md rounded-2xl border p-6 shadow-2xl space-y-4"
              style={{
                backgroundColor: 'var(--card-bg)',
                borderColor: 'var(--card-border)',
                color: 'var(--text-primary)',
              }}
            >
              <button
                onClick={() => setShowModal(false)}
                className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg transition"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-bold shadow-md">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Install AI Assistant App
                  </h3>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    Install on your mobile phone or PC for full standalone app experience
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                {isIOS ? (
                  <div className="space-y-2 rounded-xl p-3 border" style={{ backgroundColor: 'var(--card-inner)', borderColor: 'var(--card-border)' }}>
                    <p className="font-semibold text-blue-400">For iPhone / iPad (Safari):</p>
                    <ol className="list-decimal list-inside space-y-1 text-[11px] leading-relaxed">
                      <li className="flex items-center gap-1.5">
                        <span>1. Tap the Share icon</span> <Share className="inline h-3.5 w-3.5 text-blue-400" />
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span>2. Scroll down & select</span> <PlusSquare className="inline h-3.5 w-3.5 text-blue-400" /> <span className="font-semibold text-white">Add to Home Screen</span>
                      </li>
                      <li>3. Tap <span className="font-semibold text-white">Add</span> at top right to launch as a standalone app!</li>
                    </ol>
                  </div>
                ) : (
                  <div className="space-y-2 rounded-xl p-3 border" style={{ backgroundColor: 'var(--card-inner)', borderColor: 'var(--card-border)' }}>
                    <p className="font-semibold text-blue-400">For Android / Chrome / Edge:</p>
                    <ol className="list-decimal list-inside space-y-1 text-[11px] leading-relaxed">
                      <li>1. Tap the <strong>three dots menu (⋮)</strong> at the top right of your browser.</li>
                      <li>2. Select <strong>&quot;Install app&quot;</strong> or <strong>&quot;Add to Home screen&quot;</strong>.</li>
                      <li>3. Open directly from your home screen like any native app!</li>
                    </ol>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="w-full rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white hover:bg-blue-500 transition shadow-sm"
                >
                  Got it!
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
