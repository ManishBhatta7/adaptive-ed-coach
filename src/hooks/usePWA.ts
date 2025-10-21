import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isOffline: boolean;
  isUpdateAvailable: boolean;
  canShare: boolean;
  notification: {
    permission: NotificationPermission;
    isSupported: boolean;
  };
}

interface PWAActions {
  install: () => Promise<void>;
  updateApp: () => Promise<void>;
  share: (data: ShareData) => Promise<void>;
  requestNotificationPermission: () => Promise<NotificationPermission>;
  subscribeToNotifications: () => Promise<PushSubscription | null>;
  showNotification: (title: string, options?: NotificationOptions) => Promise<void>;
  addToOfflineQueue: (data: any) => Promise<void>;
  syncOfflineData: () => Promise<void>;
}

export function usePWA(): PWAState & PWAActions {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [serviceWorker, setServiceWorker] = useState<ServiceWorkerRegistration | null>(null);

  // Initialize PWA features
  useEffect(() => {
    // Check if app is installed
    const checkInstallStatus = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
      }
    };

    // Register service worker
    const registerServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          setServiceWorker(registration);

          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setIsUpdateAvailable(true);
                }
              });
            }
          });

          console.log('Service Worker registered successfully');
        } catch (error) {
          console.error('Service Worker registration failed:', error);
        }
      }
    };

    // Handle install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    // Handle online/offline status
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    // Handle app installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    checkInstallStatus();
    registerServiceWorker();

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Install PWA
  const install = useCallback(async () => {
    if (!installPrompt) return;

    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      
      if (choice.outcome === 'accepted') {
        console.log('PWA installation accepted');
        setInstallPrompt(null);
      } else {
        console.log('PWA installation dismissed');
      }
    } catch (error) {
      console.error('PWA installation failed:', error);
    }
  }, [installPrompt]);

  // Update app
  const updateApp = useCallback(async () => {
    if (!serviceWorker || !isUpdateAvailable) return;

    try {
      const waitingWorker = serviceWorker.waiting;
      if (waitingWorker) {
        waitingWorker.postMessage({ type: 'SKIP_WAITING' });
        waitingWorker.addEventListener('statechange', () => {
          if (waitingWorker.state === 'activated') {
            window.location.reload();
          }
        });
      }
    } catch (error) {
      console.error('App update failed:', error);
    }
  }, [serviceWorker, isUpdateAvailable]);

  // Share content
  const share = useCallback(async (data: ShareData) => {
    if (navigator.share && navigator.canShare?.(data)) {
      try {
        await navigator.share(data);
      } catch (error) {
        console.error('Sharing failed:', error);
        throw error;
      }
    } else {
      // Fallback: copy to clipboard
      if (navigator.clipboard && data.text) {
        await navigator.clipboard.writeText(data.text);
        console.log('Content copied to clipboard');
      } else {
        throw new Error('Sharing not supported');
      }
    }
  }, []);

  // Request notification permission
  const requestNotificationPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
      throw new Error('Notifications not supported');
    }

    if (Notification.permission === 'granted') {
      return Notification.permission;
    }

    const permission = await Notification.requestPermission();
    return permission;
  }, []);

  // Subscribe to push notifications
  const subscribeToNotifications = useCallback(async (): Promise<PushSubscription | null> => {
    if (!serviceWorker || !('PushManager' in window)) {
      throw new Error('Push notifications not supported');
    }

    try {
      const permission = await requestNotificationPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      const subscription = await serviceWorker.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.REACT_APP_VAPID_PUBLIC_KEY // Would need to set this
      });

      // Save subscription to server
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          user_agent: navigator.userAgent
        })
      });

      return subscription;
    } catch (error) {
      console.error('Push subscription failed:', error);
      return null;
    }
  }, [serviceWorker, requestNotificationPermission]);

  // Show local notification
  const showNotification = useCallback(async (title: string, options?: NotificationOptions) => {
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      throw new Error('Notification permission denied');
    }

    if (serviceWorker) {
      await serviceWorker.showNotification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        vibrate: [200, 100, 200],
        ...options
      });
    } else {
      new Notification(title, options);
    }
  }, [serviceWorker, requestNotificationPermission]);

  // Add data to offline queue
  const addToOfflineQueue = useCallback(async (data: any) => {
    if (!('indexedDB' in window)) {
      throw new Error('IndexedDB not supported');
    }

    try {
      // Open IndexedDB
      const db = await openOfflineDB();
      const transaction = db.transaction(['offline_queue'], 'readwrite');
      const store = transaction.objectStore('offline_queue');
      
      const offlineItem = {
        id: generateUUID(),
        data,
        timestamp: Date.now(),
        synced: false
      };

      await store.add(offlineItem);
      
      // Trigger background sync if available
      if (serviceWorker && 'sync' in serviceWorker) {
        await serviceWorker.sync.register('sync-offline-data');
      }

      console.log('Data added to offline queue');
    } catch (error) {
      console.error('Failed to add data to offline queue:', error);
      throw error;
    }
  }, [serviceWorker]);

  // Sync offline data
  const syncOfflineData = useCallback(async () => {
    if (!('indexedDB' in window)) return;

    try {
      const db = await openOfflineDB();
      const transaction = db.transaction(['offline_queue'], 'readonly');
      const store = transaction.objectStore('offline_queue');
      const request = store.index('synced').getAll(false);
      
      request.onsuccess = async () => {
        const unsyncedItems = request.result;
        
        for (const item of unsyncedItems) {
          try {
            // Sync with server
            const response = await fetch('/api/sync', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(item.data)
            });

            if (response.ok) {
              // Mark as synced
              const updateTransaction = db.transaction(['offline_queue'], 'readwrite');
              const updateStore = updateTransaction.objectStore('offline_queue');
              item.synced = true;
              await updateStore.put(item);
            }
          } catch (error) {
            console.error('Failed to sync item:', item.id, error);
          }
        }
      };
    } catch (error) {
      console.error('Offline sync failed:', error);
    }
  }, []);

  // State computed values
  const state: PWAState = {
    isInstallable: !!installPrompt && !isInstalled,
    isInstalled,
    isOffline,
    isUpdateAvailable,
    canShare: !!(navigator.share || navigator.clipboard),
    notification: {
      permission: 'Notification' in window ? Notification.permission : 'denied',
      isSupported: 'Notification' in window
    }
  };

  const actions: PWAActions = {
    install,
    updateApp,
    share,
    requestNotificationPermission,
    subscribeToNotifications,
    showNotification,
    addToOfflineQueue,
    syncOfflineData
  };

  return { ...state, ...actions };
}

// Utility functions
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function openOfflineDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('EduCoachOffline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains('offline_queue')) {
        const store = db.createObjectStore('offline_queue', { keyPath: 'id' });
        store.createIndex('synced', 'synced', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
      
      if (!db.objectStoreNames.contains('cached_data')) {
        const cacheStore = db.createObjectStore('cached_data', { keyPath: 'key' });
        cacheStore.createIndex('expires', 'expires', { unique: false });
      }
    };
  });
}

// Hook for managing offline data
export function useOfflineData() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const cacheData = useCallback(async (key: string, data: any, ttl: number = 3600000) => {
    try {
      const db = await openOfflineDB();
      const transaction = db.transaction(['cached_data'], 'readwrite');
      const store = transaction.objectStore('cached_data');
      
      const cachedItem = {
        key,
        data,
        expires: Date.now() + ttl,
        timestamp: Date.now()
      };

      await store.put(cachedItem);
    } catch (error) {
      console.error('Failed to cache data:', error);
    }
  }, []);

  const getCachedData = useCallback(async (key: string) => {
    try {
      const db = await openOfflineDB();
      const transaction = db.transaction(['cached_data'], 'readonly');
      const store = transaction.objectStore('cached_data');
      
      return new Promise((resolve) => {
        const request = store.get(key);
        request.onsuccess = () => {
          const result = request.result;
          if (result && result.expires > Date.now()) {
            resolve(result.data);
          } else {
            resolve(null);
          }
        };
        request.onerror = () => resolve(null);
      });
    } catch (error) {
      console.error('Failed to get cached data:', error);
      return null;
    }
  }, []);

  const clearExpiredCache = useCallback(async () => {
    try {
      const db = await openOfflineDB();
      const transaction = db.transaction(['cached_data'], 'readwrite');
      const store = transaction.objectStore('cached_data');
      const index = store.index('expires');
      
      const request = index.openCursor(IDBKeyRange.upperBound(Date.now()));
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };
    } catch (error) {
      console.error('Failed to clear expired cache:', error);
    }
  }, []);

  return {
    isOffline,
    cacheData,
    getCachedData,
    clearExpiredCache
  };
}