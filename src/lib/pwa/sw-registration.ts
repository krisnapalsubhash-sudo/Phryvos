// Service Worker Registration for Phryvos PWA

export interface SWRegistrationOptions {
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onOfflineReady?: () => void;
  onError?: (error: Error) => void;
}

let registration: ServiceWorkerRegistration | null = null;
let updateAvailable = false;

export async function registerSW(options: SWRegistrationOptions = {}): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.log('[PWA] Service Worker not supported');
    return null;
  }

  // Skip in development unless explicitly enabled
  if (process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_ENABLE_SW) {
    console.log('[PWA] Skipping SW registration in development');
    return null;
  }

  try {
    registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('[PWA] Service Worker registered:', registration.scope);

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration?.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New version available
          updateAvailable = true;
          console.log('[PWA] New version available');
          options.onUpdate?.(registration!);

          // Show update notification
          showUpdateNotification();
        }
      });
    });

    // Handle controller change (new SW took over)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (navigator.serviceWorker.controller) {
        console.log('[PWA] New controller active');
        // Reload to get fresh content
        window.location.reload();
      }
    });

    // Check for updates periodically
    setInterval(() => {
      registration?.update();
    }, 60 * 60 * 1000); // Every hour

    // Listen for messages from SW
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'OFFLINE_READY') {
        options.onOfflineReady?.();
      }
    });

    // Check if already controlling
    if (navigator.serviceWorker.controller) {
      // Check for cached offline content
      checkOfflineReady();
    }

    return registration;
  } catch (error) {
    console.error('[PWA] SW registration failed:', error);
    options.onError?.(error as Error);
    return null;
  }
}

async function checkOfflineReady() {
  if (!registration) return;

  try {
    const cache = await caches.open('phryvos-static-v1');
    const keys = await cache.keys();
    console.log('[PWA] Cached resources:', keys.length);

    if (keys.length > 0) {
      // Offline content is ready
      // Could dispatch event or call callback
    }
  } catch (error) {
    console.log('[PWA] Cache check failed:', error);
  }
}

function showUpdateNotification() {
  // Create a subtle update toast
  const existingToast = document.getElementById('pwa-update-toast');
  if (existingToast) return;

  const toast = document.createElement('div');
  toast.id = 'pwa-update-toast';
  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
    color: white;
    padding: 14px 24px;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(59, 130, 246, 0.4);
    display: flex;
    align-items: center;
    gap: 12px;
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    font-weight: 500;
    animation: slideUp 0.3s ease-out;
  `;

  toast.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M23 4v6h-6"/>
      <path d="M1 20v-6h6"/>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
    </svg>
    <span>New version available</span>
    <button id="pwa-update-btn" style="
      background: rgba(255,255,255,0.2);
      border: none;
      color: white;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      font-size: 13px;
    ">Update</button>
    <button id="pwa-dismiss-btn" style="
      background: transparent;
      border: none;
      color: rgba(255,255,255,0.7);
      padding: 8px;
      cursor: pointer;
      font-size: 18px;
      line-height: 1;
    ">×</button>
  `;

  document.body.appendChild(toast);

  // Add animation styles
  if (!document.getElementById('pwa-toast-styles')) {
    const style = document.createElement('style');
    style.id = 'pwa-toast-styles';
    style.textContent = `
      @keyframes slideUp {
        from { opacity: 0; transform: translateX(-50%) translateY(20px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
      }
      #pwa-update-toast button:hover { background: rgba(255,255,255,0.3); }
      #pwa-dismiss-btn:hover { color: white; }
    `;
    document.head.appendChild(style);
  }

  // Handle buttons
  document.getElementById('pwa-update-btn')?.addEventListener('click', () => {
    applyUpdate();
  });

  document.getElementById('pwa-dismiss-btn')?.addEventListener('click', () => {
    toast.remove();
  });

  // Auto-dismiss after 30 seconds
  setTimeout(() => {
    if (toast.parentNode) toast.remove();
  }, 30000);
}

export function applyUpdate() {
  if (registration?.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }
}

export function isUpdateAvailable(): boolean {
  return updateAvailable;
}

export function getRegistration(): ServiceWorkerRegistration | null {
  return registration;
}

// Check for updates manually
export async function checkForUpdates(): Promise<boolean> {
  if (!registration) return false;

  try {
    await registration.update();
    return updateAvailable;
  } catch (error) {
    console.error('[PWA] Update check failed:', error);
    return false;
  }
}

// Unregister SW (for testing/logout)
export async function unregisterSW(): Promise<boolean> {
  if (!registration) return false;

  try {
    const result = await registration.unregister();
    registration = null;
    updateAvailable = false;
    console.log('[PWA] Service Worker unregistered:', result);
    return result;
  } catch (error) {
    console.error('[PWA] Unregister failed:', error);
    return false;
  }
}

// Get cache info for debugging
export async function getCacheInfo(): Promise<Record<string, number>> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return {};
  }

  const cacheNames = await caches.keys();
  const info: Record<string, number> = {};

  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    info[name] = keys.length;
  }

  return info;
}

// Clear all caches
export async function clearAllCaches(): Promise<void> {
  if (typeof window === 'undefined' || !('caches' in window)) return;

  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));
  console.log('[PWA] All caches cleared');
}

export default {
  register: registerSW,
  applyUpdate,
  isUpdateAvailable,
  getRegistration,
  checkForUpdates,
  unregister: unregisterSW,
  getCacheInfo,
  clearAllCaches,
};