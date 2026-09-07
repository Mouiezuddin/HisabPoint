import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const DISMISS_STORAGE_KEY = 'hisabpoint_pwa_install_dismissed_until';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isDismissed: boolean;
  updateAvailable: boolean;
  promptInstall: () => Promise<{ outcome: 'accepted' | 'dismissed' | 'manual' }>;
  dismissInstall: () => void;
  applyUpdate: () => void;
}

export function usePWA(): PWAState {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [updateAvailable, setUpdateAvailable] = useState<boolean>(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  // Platform detection
  const isIOS = typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
  const isAndroid = typeof window !== 'undefined' && /android/i.test(navigator.userAgent);

  // Check standalone / installed display mode
  const checkInstalled = useCallback(() => {
    if (typeof window === 'undefined') return false;
    const isStandaloneMQ = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (navigator as unknown as { standalone?: boolean }).standalone === true;
    const isAndroidApp = document.referrer.includes('android-app://');
    return isStandaloneMQ || isIOSStandalone || isAndroidApp;
  }, []);

  // Check dismissal state in localStorage
  const checkDismissed = useCallback(() => {
    if (typeof window === 'undefined') return false;
    try {
      const stored = localStorage.getItem(DISMISS_STORAGE_KEY);
      if (!stored) return false;
      const dismissedUntil = parseInt(stored, 10);
      return Date.now() < dismissedUntil;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    setIsInstalled(checkInstalled());
    setIsDismissed(checkDismissed());

    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleMQChange = (e: MediaQueryListEvent) => {
      setIsInstalled(e.matches);
    };
    mediaQuery.addEventListener('change', handleMQChange);

    // Listen for Chromium native beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Listen for appinstalled
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      try {
        localStorage.removeItem(DISMISS_STORAGE_KEY);
      } catch {
        // ignore
      }
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    // Register Service Worker with safe update detection
    if ('serviceWorker' in navigator && !import.meta.env.DEV) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((reg) => {
          // If there's an active waiting worker on registration
          if (reg.waiting) {
            setWaitingWorker(reg.waiting);
            setUpdateAvailable(true);
          }

          // Listen for new worker installed and waiting
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setWaitingWorker(newWorker);
                  setUpdateAvailable(true);
                }
              });
            }
          });
        })
        .catch((err) => {
          console.warn('HisabPoint service worker registration failed:', err);
        });

      // Reload when the new worker takes control
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }

    return () => {
      mediaQuery.removeEventListener('change', handleMQChange);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [checkInstalled, checkDismissed]);

  // Trigger Install
  const promptInstall = useCallback(async (): Promise<{ outcome: 'accepted' | 'dismissed' | 'manual' }> => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
      return { outcome: choice.outcome };
    }
    // If no native prompt (e.g. iOS or already installed or unsupported desktop)
    return { outcome: 'manual' };
  }, [deferredPrompt]);

  // Dismiss Install Banner for 7 days
  const dismissInstall = useCallback(() => {
    setIsDismissed(true);
    try {
      localStorage.setItem(DISMISS_STORAGE_KEY, (Date.now() + SEVEN_DAYS_MS).toString());
    } catch {
      // ignore
    }
  }, []);

  // Apply Service Worker Update safely
  const applyUpdate = useCallback(() => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    } else {
      window.location.reload();
    }
  }, [waitingWorker]);

  return {
    isInstallable: !!deferredPrompt || isIOS,
    isInstalled,
    isIOS,
    isAndroid,
    isDismissed,
    updateAvailable,
    promptInstall,
    dismissInstall,
    applyUpdate,
  };
}
