// PWA Hook for Phryvos - Online/Offline status, install prompt, update notifications

import { useState, useEffect, useCallback } from 'react';
import {
  registerSW,
  applyUpdate,
  isUpdateAvailable,
  checkForUpdates,
  getCacheInfo,
  clearAllCaches,
} from '@/lib/pwa/sw-registration';

export interface PWAState {
  isOnline: boolean;
  isInstallable: boolean;
  isInstalled: boolean;
  updateAvailable: boolean;
  isOfflineReady: boolean;
  cacheInfo: Record<string, number>;
}

export interface PWAActions {
  install: () => Promise<boolean>;
  update: () => void;
  checkForUpdates: () => Promise<boolean>;
  clearCaches: () => Promise<void>;
  refreshCacheInfo: () => Promise<void>;
}

export function usePWA(): PWAState & PWAActions {
  const [state, setState] = useState<PWAState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isInstallable: false,
    isInstalled: false,
    updateAvailable: false,
    isOfflineReady: false,
    cacheInfo: {},
  });

  let deferredPrompt: BeforeInstallPromptEvent | null = null;
  let swRegistration: ServiceWorkerRegistration | null = null;

  // Check if running as installed PWA
  const checkInstalled = useCallback(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (window.navigator as any).standalone === true;
    const isTWA = window.matchMedia('(display-mode: browser)').matches &&
      document.referrer.includes('android-app://');
    return isStandalone || isIOSStandalone || isTWA;
  }, []);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }));
    };
    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      deferredPrompt = e;
      setState(prev => ({ ...prev, isInstallable: true }));
    };

    const handleAppInstalled = () => {
      setState(prev => ({
        ...prev,
        isInstalled: true,
        isInstallable: false
      }));
      deferredPrompt = null;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Register Service Worker
  useEffect(() => {
    let mounted = true;

    const initSW = async () => {
      try {
        swRegistration = await registerSW({
          onUpdate: (reg) => {
            if (mounted) {
              setState(prev => ({ ...prev, updateAvailable: true }));
            }
          },
          onOfflineReady: () => {
            if (mounted) {
              setState(prev => ({ ...prev, isOfflineReady: true }));
            }
          },
          onError: (error) => {
            console.error('[PWA] SW error:', error);
          },
        });

        // Check initial cache info
        if (mounted) {
          const cacheInfo = await getCacheInfo();
          setState(prev => ({ ...prev, cacheInfo }));
        }

        // Check if installed
        if (mounted) {
          setState(prev => ({ ...prev, isInstalled: checkInstalled() }));
        }
      } catch (error) {
        console.error('[PWA] Initialization failed:', error);
      }
    };

    initSW();

    return () => {
      mounted = false;
    };
  }, [checkInstalled]);

  // Periodic update check
  useEffect(() => {
    const interval = setInterval(async () => {
      const hasUpdate = await checkForUpdates();
      if (hasUpdate) {
        setState(prev => ({ ...prev, updateAvailable: true }));
      }
    }, 30 * 60 * 1000); // Every 30 minutes

    return () => clearInterval(interval);
  }, []);

  // Actions
  const install = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) return false;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        setState(prev => ({ ...prev, isInstalled: true, isInstallable: false }));
        deferredPrompt = null;
        return true;
      }
      return false;
    } catch (error) {
      console.error('[PWA] Install failed:', error);
      return false;
    }
  }, [deferredPrompt]);

  const update = useCallback(() => {
    applyUpdate();
  }, []);

  const handleCheckForUpdates = useCallback(async (): Promise<boolean> => {
    const hasUpdate = await checkForUpdates();
    if (hasUpdate) {
      setState(prev => ({ ...prev, updateAvailable: true }));
    }
    return hasUpdate;
  }, []);

  const handleClearCaches = useCallback(async () => {
    await clearAllCaches();
    const cacheInfo = await getCacheInfo();
    setState(prev => ({ ...prev, cacheInfo, isOfflineReady: false }));
  }, []);

  const refreshCacheInfo = useCallback(async () => {
    const cacheInfo = await getCacheInfo();
    setState(prev => ({ ...prev, cacheInfo }));
  }, []);

  return {
    ...state,
    install,
    update,
    checkForUpdates: handleCheckForUpdates,
    clearCaches: handleClearCaches,
    refreshCacheInfo,
  };
}

// Type for beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

// Hook for offline-first data mutations
export function useOfflineQueue() {
  const [queue, setQueue] = useState<Array<{ id: string; type: string; data: any; timestamp: number }>>([]);

  useEffect(() => {
    // Load queued mutations from IndexedDB
    loadQueue();
  }, []);

  const loadQueue = async () => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) return;

    try {
      const db = await openDB();
      const tx = db.transaction('mutations', 'readonly');
      const store = tx.objectStore('mutations');
      const request: IDBRequest<any[]> = store.getAll();
      const items = await new Promise<any[]>((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      setQueue(items);
    } catch (error) {
      console.error('[PWA] Failed to load queue:', error);
    }
  };

  const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('phryvos-offline', 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('mutations')) {
          db.createObjectStore('mutations', { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  };

  const queueMutation = async (type: string, data: any) => {
    const mutation = {
      id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: Date.now(),
    };

    try {
      const db = await openDB();
      const tx = db.transaction('mutations', 'readwrite');
      const store = tx.objectStore('mutations');
      await store.add(mutation);
      setQueue(prev => [...prev, mutation]);

      // Register background sync if available
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        const reg = await navigator.serviceWorker.ready;
        await (reg as any).sync.register('sync-mutations');
      }
    } catch (error) {
      console.error('[PWA] Failed to queue mutation:', error);
    }
  };

  const clearQueue = async () => {
    try {
      const db = await openDB();
      const tx = db.transaction('mutations', 'readwrite');
      const store = tx.objectStore('mutations');
      await store.clear();
      setQueue([]);
    } catch (error) {
      console.error('[PWA] Failed to clear queue:', error);
    }
  };

  return {
    queue,
    queueMutation,
    clearQueue,
    isPending: queue.length > 0,
  };
}

export default usePWA;