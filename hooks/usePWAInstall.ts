'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall() {
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if app is already running in standalone mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    // Detect iOS devices (Safari doesn't support beforeinstallprompt)
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOSDevice =
      /iphone|ipad|ipod/.test(ua) &&
      !(window as unknown as { MSStream?: unknown }).MSStream;

    queueMicrotask(() => {
      setIsInstalled(isStandalone);
      setIsIOS(isIOSDevice && !isStandalone);
    });

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      setCanInstall(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      deferredPromptRef.current = null;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPromptRef.current) return false;
    try {
      await deferredPromptRef.current.prompt();
      const choice = await deferredPromptRef.current.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setCanInstall(false);
        deferredPromptRef.current = null;
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error invoking PWA installation prompt:', err);
      return false;
    }
  }, []);

  return {
    canInstall,
    isInstalled,
    isIOS,
    promptInstall,
  };
}
