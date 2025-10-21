import React from 'react';
import { rourkelaCurriculum, LessonContent } from '@/data/rourkela-curriculum';
import { useOfflineData } from '@/hooks/usePWA';
import { AppError, handleError } from '@/utils/errorHandler';
import { retryOperation } from '@/utils/retry';

interface OfflineContentCache {
  lessons: LessonContent[];
  multimedia: MultimediaAsset[];
  assessments: OfflineAssessment[];
  lastUpdated: number;
  version: string;
}

interface MultimediaAsset {
  id: string;
  type: 'image' | 'video' | 'audio' | 'animation';
  url: string;
  localPath?: string;
  size: number;
  cached: boolean;
  priority: 'high' | 'medium' | 'low';
}

interface OfflineAssessment {
  id: string;
  lessonId: string;
  questions: any[];
  timeLimit?: number;
  passingScore: number;
  attempts: number;
}

interface SyncQueueItem {
  id: string;
  type: 'progress' | 'reflection' | 'assignment' | 'assessment';
  data: any;
  timestamp: number;
  retryCount: number;
  userId: string;
}

class OfflineContentManager {
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'EduCoachOfflineContent';
  private readonly DB_VERSION = 1;
  private readonly CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

  async init(): Promise<void> {
    try {
      return await retryOperation(
        () => new Promise<void>((resolve, reject) => {
          const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
          
          request.onerror = () => {
            const error = new AppError(
              'Failed to open IndexedDB',
              'DB_INIT_ERROR',
              undefined,
              { dbName: this.DB_NAME, dbVersion: this.DB_VERSION }
            );
            reject(error);
          };
          
          request.onsuccess = () => {
            this.db = request.result;
            console.log('[OfflineContentManager] Database initialized successfully');
            resolve();
          };

          request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            
            // Create object stores
            if (!db.objectStoreNames.contains('lessons')) {
              const lessonStore = db.createObjectStore('lessons', { keyPath: 'id' });
              lessonStore.createIndex('class', 'class', { unique: false });
              lessonStore.createIndex('subject', 'subject', { unique: false });
              lessonStore.createIndex('board', 'board', { unique: false });
            }

            if (!db.objectStoreNames.contains('multimedia')) {
              const mediaStore = db.createObjectStore('multimedia', { keyPath: 'id' });
              mediaStore.createIndex('type', 'type', { unique: false });
              mediaStore.createIndex('priority', 'priority', { unique: false });
              mediaStore.createIndex('cached', 'cached', { unique: false });
            }

            if (!db.objectStoreNames.contains('assessments')) {
              const assessmentStore = db.createObjectStore('assessments', { keyPath: 'id' });
              assessmentStore.createIndex('lessonId', 'lessonId', { unique: false });
            }

            if (!db.objectStoreNames.contains('sync_queue')) {
              const syncStore = db.createObjectStore('sync_queue', { keyPath: 'id' });
              syncStore.createIndex('userId', 'userId', { unique: false });
              syncStore.createIndex('type', 'type', { unique: false });
              syncStore.createIndex('timestamp', 'timestamp', { unique: false });
            }

            if (!db.objectStoreNames.contains('user_progress')) {
              const progressStore = db.createObjectStore('user_progress', { keyPath: 'id' });
              progressStore.createIndex('userId', 'userId', { unique: false });
              progressStore.createIndex('lessonId', 'lessonId', { unique: false });
            }

            if (!db.objectStoreNames.contains('offline_cache_meta')) {
              db.createObjectStore('offline_cache_meta', { keyPath: 'key' });
            }
          };
        }),
        {
          maxRetries: 2,
          delay: 1000
        }
      );
    } catch (error) {
      const appError = error instanceof AppError
        ? error
        : new AppError(
            'Failed to initialize offline content manager',
            'INIT_ERROR',
            undefined,
            { originalError: error }
          );
      console.error('[OfflineContentManager] Initialization error:', appError);
      throw appError;
    }
  }

  // Cache essential lessons for offline access
  async cacheEssentialLessons(classNum: number, subjects: string[] = ['science', 'mathematics']): Promise<void> {
    try {
      if (!this.db) {
        await this.init();
      }

      return await retryOperation(
        async () => {
          const transaction = this.db!.transaction(['lessons', 'offline_cache_meta'], 'readwrite');
          const lessonStore = transaction.objectStore('lessons');
          const metaStore = transaction.objectStore('offline_cache_meta');

          // Get lessons for specified class and subjects
          const lessonsToCache: LessonContent[] = [];
          
          for (const subject of subjects) {
            const subjectLessons = rourkelaCurriculum[subject as keyof typeof rourkelaCurriculum]?.[classNum] || [];
            if (subjectLessons.length === 0) {
              console.warn(`[OfflineContentManager] No lessons found for ${subject} class ${classNum}`);
            }
            lessonsToCache.push(...subjectLessons);
          }

          if (lessonsToCache.length === 0) {
            throw new AppError(
              `No lessons found for class ${classNum} and subjects ${subjects.join(', ')}`,
              'NO_LESSONS_FOUND',
              404,
              { classNum, subjects }
            );
          }

          // Cache lessons with progress tracking
          let cached = 0;
          for (const lesson of lessonsToCache) {
            await lessonStore.put(lesson);
            cached++;
            if (cached % 10 === 0) {
              console.log(`[OfflineContentManager] Cached ${cached}/${lessonsToCache.length} lessons`);
            }
          }

          // Update cache metadata
          const cacheInfo: OfflineContentCache = {
            lessons: lessonsToCache,
            multimedia: [],
            assessments: [],
            lastUpdated: Date.now(),
            version: '1.0'
          };

          await metaStore.put({
            key: `cache_class_${classNum}`,
            data: cacheInfo,
            timestamp: Date.now()
          });

          console.log(`[OfflineContentManager] Successfully cached ${lessonsToCache.length} lessons for Class ${classNum}`);
        },
        {
          maxRetries: 2,
          delay: 500,
          backoff: 'exponential'
        }
      );
    } catch (error) {
      const appError = error instanceof AppError
        ? error
        : new AppError(
            'Failed to cache lessons',
            'CACHE_LESSONS_ERROR',
            undefined,
            { classNum, subjects, originalError: error }
          );
      
      console.error('[OfflineContentManager] Error caching essential lessons:', appError);
      throw appError;
    }
  }

  // Cache multimedia assets
  async cacheMultimediaAssets(lessonIds: string[], priority: 'high' | 'medium' | 'low' = 'medium'): Promise<void> {
    if (!this.db) await this.init();

    const transaction = this.db!.transaction(['multimedia'], 'readwrite');
    const mediaStore = transaction.objectStore('multimedia');

    try {
      for (const lessonId of lessonIds) {
        const lesson = await this.getLesson(lessonId);
        if (lesson?.multimedia) {
          for (const media of lesson.multimedia) {
            const asset: MultimediaAsset = {
              id: `${lessonId}_${media.type}_${Date.now()}`,
              type: media.type,
              url: media.url,
              size: 0, // Would be determined when actually downloading
              cached: false,
              priority
            };

            await mediaStore.put(asset);
          }
        }
      }
    } catch (error) {
      console.error('Error caching multimedia assets:', error);
      throw error;
    }
  }

  // Get cached lesson
  async getLesson(lessonId: string): Promise<LessonContent | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['lessons'], 'readonly');
      const store = transaction.objectStore('lessons');
      const request = store.get(lessonId);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  // Get lessons by class and subject
  async getLessonsByClassAndSubject(classNum: number, subject: string): Promise<LessonContent[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['lessons'], 'readonly');
      const store = transaction.objectStore('lessons');
      const lessons: LessonContent[] = [];

      const request = store.openCursor();
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const lesson = cursor.value as LessonContent;
          if (lesson.class === classNum && lesson.subject.toLowerCase() === subject.toLowerCase()) {
            lessons.push(lesson);
          }
          cursor.continue();
        } else {
          resolve(lessons);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Add item to sync queue for when connection is restored
  async addToSyncQueue(type: SyncQueueItem['type'], data: any, userId: string): Promise<void> {
    if (!this.db) await this.init();

    const item: SyncQueueItem = {
      id: `${type}_${userId}_${Date.now()}`,
      type,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      userId
    };

    const transaction = this.db!.transaction(['sync_queue'], 'readwrite');
    const store = transaction.objectStore('sync_queue');
    await store.put(item);

    console.log(`Added ${type} item to sync queue for user ${userId}`);
  }

  // Get pending sync items
  async getPendingSyncItems(userId?: string): Promise<SyncQueueItem[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sync_queue'], 'readonly');
      const store = transaction.objectStore('sync_queue');
      const items: SyncQueueItem[] = [];

      let request: IDBRequest;
      if (userId) {
        const index = store.index('userId');
        request = index.openCursor(IDBKeyRange.only(userId));
      } else {
        request = store.openCursor();
      }

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          items.push(cursor.value);
          cursor.continue();
        } else {
          resolve(items);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Remove synced items from queue
  async removeSyncedItem(itemId: string): Promise<void> {
    if (!this.db) await this.init();

    const transaction = this.db!.transaction(['sync_queue'], 'readwrite');
    const store = transaction.objectStore('sync_queue');
    await store.delete(itemId);
  }

  // Save user progress locally
  async saveProgressLocally(userId: string, lessonId: string, progressData: any): Promise<void> {
    if (!this.db) await this.init();

    const progressEntry = {
      id: `${userId}_${lessonId}`,
      userId,
      lessonId,
      data: progressData,
      timestamp: Date.now(),
      synced: false
    };

    const transaction = this.db!.transaction(['user_progress'], 'readwrite');
    const store = transaction.objectStore('user_progress');
    await store.put(progressEntry);

    // Also add to sync queue
    await this.addToSyncQueue('progress', progressEntry, userId);
  }

  // Get user progress
  async getUserProgress(userId: string, lessonId?: string): Promise<any[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['user_progress'], 'readonly');
      const store = transaction.objectStore('user_progress');
      const progress: any[] = [];

      let request: IDBRequest;
      if (lessonId) {
        request = store.get(`${userId}_${lessonId}`);
        request.onsuccess = () => {
          if (request.result) progress.push(request.result);
          resolve(progress);
        };
        request.onerror = () => reject(request.error);
      } else {
        const index = store.index('userId');
        request = index.openCursor(IDBKeyRange.only(userId));
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            progress.push(cursor.value);
            cursor.continue();
          } else {
            resolve(progress);
          }
        };
        request.onerror = () => reject(request.error);
      }
    });
  }

  // Check if content is available offline
  async isContentAvailableOffline(lessonId: string): Promise<boolean> {
    const lesson = await this.getLesson(lessonId);
    return lesson !== null;
  }

  // Sync with server when connection is restored
  async syncWithServer(apiEndpoint: string, authToken?: string): Promise<void> {
    if (!navigator.onLine) {
      console.log('Device is offline, skipping sync');
      return;
    }

    const pendingItems = await this.getPendingSyncItems();
    console.log(`Syncing ${pendingItems.length} pending items`);

    for (const item of pendingItems) {
      try {
        const response = await fetch(`${apiEndpoint}/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(authToken && { 'Authorization': `Bearer ${authToken}` })
          },
          body: JSON.stringify({
            type: item.type,
            data: item.data,
            timestamp: item.timestamp
          })
        });

        if (response.ok) {
          await this.removeSyncedItem(item.id);
          console.log(`Synced ${item.type} item for user ${item.userId}`);
        } else {
          console.error(`Failed to sync item ${item.id}:`, response.statusText);
          // Increment retry count
          item.retryCount += 1;
          if (item.retryCount < 5) {
            const transaction = this.db!.transaction(['sync_queue'], 'readwrite');
            const store = transaction.objectStore('sync_queue');
            await store.put(item);
          } else {
            console.error(`Max retries reached for item ${item.id}, removing from queue`);
            await this.removeSyncedItem(item.id);
          }
        }
      } catch (error) {
        console.error(`Error syncing item ${item.id}:`, error);
      }
    }
  }

  // Get cache statistics
  async getCacheStats(): Promise<{
    totalLessons: number;
    totalMultimedia: number;
    totalProgress: number;
    cacheSize: number;
    lastUpdated?: number;
  }> {
    if (!this.db) await this.init();

    const [lessons, multimedia, progress] = await Promise.all([
      this.countRecords('lessons'),
      this.countRecords('multimedia'),
      this.countRecords('user_progress')
    ]);

    return {
      totalLessons: lessons,
      totalMultimedia: multimedia,
      totalProgress: progress,
      cacheSize: 0, // Would need to calculate actual storage size
      lastUpdated: Date.now()
    };
  }

  private async countRecords(storeName: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.count();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Clear old cache data
  async clearExpiredCache(): Promise<void> {
    if (!this.db) await this.init();

    const expiredTime = Date.now() - this.CACHE_EXPIRY;
    
    // Clear expired lessons, multimedia, etc.
    const transaction = this.db!.transaction(['offline_cache_meta'], 'readwrite');
    const store = transaction.objectStore('offline_cache_meta');
    
    const request = store.openCursor();
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        const item = cursor.value;
        if (item.timestamp < expiredTime) {
          cursor.delete();
        }
        cursor.continue();
      }
    };
  }
}

// Create singleton instance
export const offlineContentManager = new OfflineContentManager();

// Hook for React components
export function useOfflineContent() {
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [cacheStats, setCacheStats] = React.useState<any>(null);

  React.useEffect(() => {
    const initManager = async () => {
      try {
        await offlineContentManager.init();
        setIsInitialized(true);
        
        const stats = await offlineContentManager.getCacheStats();
        setCacheStats(stats);
      } catch (error) {
        console.error('Failed to initialize offline content manager:', error);
      }
    };

    initManager();
  }, []);

  const cacheClassContent = React.useCallback(async (classNum: number, subjects: string[]) => {
    await offlineContentManager.cacheEssentialLessons(classNum, subjects);
    const stats = await offlineContentManager.getCacheStats();
    setCacheStats(stats);
  }, []);

  const syncWhenOnline = React.useCallback(async (apiEndpoint: string, authToken?: string) => {
    if (navigator.onLine) {
      await offlineContentManager.syncWithServer(apiEndpoint, authToken);
    }
  }, []);

  return {
    isInitialized,
    cacheStats,
    cacheClassContent,
    syncWhenOnline,
    saveProgress: offlineContentManager.saveProgressLocally.bind(offlineContentManager),
    getProgress: offlineContentManager.getUserProgress.bind(offlineContentManager),
    getLessons: offlineContentManager.getLessonsByClassAndSubject.bind(offlineContentManager),
    isContentAvailable: offlineContentManager.isContentAvailableOffline.bind(offlineContentManager)
  };
}

export default offlineContentManager;