// Performance Optimization System - Caching Layer
import { supabase } from '../supabase';

export interface CacheConfig {
  ttl: number; // Time to live in seconds
  maxSize: number; // Maximum cache size
  strategy: 'lru' | 'fifo' | 'lfu'; // Cache eviction strategy
}

export interface CacheItem<T = any> {
  key: string;
  value: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

export class CacheManager<T = any> {
  private cache = new Map<string, CacheItem<T>>();
  private config: CacheConfig;
  private hitCount = 0;
  private missCount = 0;

  constructor(config: CacheConfig) {
    this.config = config;
    this.startCleanupInterval();
  }

  set(key: string, value: T, customTTL?: number): void {
    const ttl = customTTL || this.config.ttl;
    const now = Date.now();

    // Evict items if cache is full
    if (this.cache.size >= this.config.maxSize) {
      this.evictItems();
    }

    const item: CacheItem<T> = {
      key,
      value,
      timestamp: now,
      ttl: ttl * 1000, // Convert to milliseconds
      accessCount: 0,
      lastAccessed: now,
    };

    this.cache.set(key, item);
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    const now = Date.now();

    if (!item) {
      this.missCount++;
      return null;
    }

    // Check if item has expired
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key);
      this.missCount++;
      return null;
    }

    // Update access statistics
    item.accessCount++;
    item.lastAccessed = now;
    this.hitCount++;

    return item.value;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.hitCount = 0;
    this.missCount = 0;
  }

  size(): number {
    return this.cache.size;
  }

  getStats() {
    const total = this.hitCount + this.missCount;
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate: total > 0 ? (this.hitCount / total) * 100 : 0,
      strategy: this.config.strategy,
    };
  }

  private evictItems(): void {
    if (this.cache.size === 0) return;

    const itemsToEvict = Math.ceil(this.cache.size * 0.1); // Evict 10% of items
    const items = Array.from(this.cache.values());

    let sortedItems: CacheItem<T>[];

    switch (this.config.strategy) {
      case 'lru': // Least Recently Used
        sortedItems = items.sort((a, b) => a.lastAccessed - b.lastAccessed);
        break;
      case 'lfu': // Least Frequently Used
        sortedItems = items.sort((a, b) => a.accessCount - b.accessCount);
        break;
      case 'fifo': // First In, First Out
        sortedItems = items.sort((a, b) => a.timestamp - b.timestamp);
        break;
      default:
        sortedItems = items;
    }

    for (let i = 0; i < itemsToEvict && i < sortedItems.length; i++) {
      this.cache.delete(sortedItems[i].key);
    }
  }

  private startCleanupInterval(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [key, item] of this.cache.entries()) {
        if (now - item.timestamp > item.ttl) {
          this.cache.delete(key);
        }
      }
    }, 60000); // Clean up every minute
  }
}

// Database Query Cache
export class DatabaseCache {
  private queryCache = new CacheManager<any>({
    ttl: 300, // 5 minutes
    maxSize: 1000,
    strategy: 'lru',
  });

  private resultCache = new CacheManager<any>({
    ttl: 600, // 10 minutes
    maxSize: 500,
    strategy: 'lfu',
  });

  async cachedQuery<T>(
    queryKey: string,
    queryFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Check cache first
    const cached = this.queryCache.get(queryKey);
    if (cached !== null) {
      return cached;
    }

    // Execute query and cache result
    try {
      const result = await queryFn();
      this.queryCache.set(queryKey, result, ttl);
      return result;
    } catch (error) {
      console.error(`Query failed for key ${queryKey}:`, error);
      throw error;
    }
  }

  invalidateQuery(queryKey: string): void {
    this.queryCache.delete(queryKey);
  }

  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.queryCache['cache'].keys()) {
      if (regex.test(key)) {
        this.queryCache.delete(key);
      }
    }
  }

  getStats() {
    return {
      queryCache: this.queryCache.getStats(),
      resultCache: this.resultCache.getStats(),
    };
  }
}

// Application-wide cache instances
export const dbCache = new DatabaseCache();

// User-specific caching
export class UserCache {
  private userCaches = new Map<string, CacheManager>();

  getUserCache(userId: string): CacheManager {
    if (!this.userCaches.has(userId)) {
      this.userCaches.set(userId, new CacheManager({
        ttl: 600, // 10 minutes
        maxSize: 100,
        strategy: 'lru',
      }));
    }
    return this.userCaches.get(userId)!;
  }

  clearUserCache(userId: string): void {
    const cache = this.userCaches.get(userId);
    if (cache) {
      cache.clear();
    }
  }

  clearAllUserCaches(): void {
    for (const cache of this.userCaches.values()) {
      cache.clear();
    }
    this.userCaches.clear();
  }
}

export const userCache = new UserCache();

// Browser Storage Cache (for offline support)
export class BrowserStorageCache {
  private prefix: string;

  constructor(prefix = 'aec_cache_') {
    this.prefix = prefix;
  }

  set(key: string, value: any, ttl: number = 3600): void {
    const item = {
      value,
      timestamp: Date.now(),
      ttl: ttl * 1000, // Convert to milliseconds
    };

    try {
      localStorage.setItem(
        `${this.prefix}${key}`,
        JSON.stringify(item)
      );
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }

  get(key: string): any | null {
    try {
      const stored = localStorage.getItem(`${this.prefix}${key}`);
      if (!stored) return null;

      const item = JSON.parse(stored);
      const now = Date.now();

      // Check if item has expired
      if (now - item.timestamp > item.ttl) {
        this.delete(key);
        return null;
      }

      return item.value;
    } catch (error) {
      console.warn('Failed to read from localStorage:', error);
      return null;
    }
  }

  delete(key: string): void {
    localStorage.removeItem(`${this.prefix}${key}`);
  }

  clear(): void {
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    }
  }

  cleanup(): void {
    const keys = Object.keys(localStorage);
    const now = Date.now();

    for (const key of keys) {
      if (key.startsWith(this.prefix)) {
        try {
          const stored = localStorage.getItem(key);
          if (stored) {
            const item = JSON.parse(stored);
            if (now - item.timestamp > item.ttl) {
              localStorage.removeItem(key);
            }
          }
        } catch (error) {
          // Remove corrupted items
          localStorage.removeItem(key);
        }
      }
    }
  }
}

export const browserCache = new BrowserStorageCache();

// High-level caching functions for common patterns
export const CacheHelpers = {
  // Cache user profile data
  async getCachedUserProfile(userId: string) {
    return dbCache.cachedQuery(
      `user_profile_${userId}`,
      async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) throw error;
        return data;
      },
      300 // 5 minutes
    );
  },

  // Cache classroom data
  async getCachedClassroom(classroomId: string) {
    return dbCache.cachedQuery(
      `classroom_${classroomId}`,
      async () => {
        const { data, error } = await supabase
          .from('classrooms')
          .select(`
            *,
            classroom_students (
              student_id,
              profiles:student_id (
                id,
                name,
                email
              )
            )
          `)
          .eq('id', classroomId)
          .single();

        if (error) throw error;
        return data;
      },
      600 // 10 minutes
    );
  },

  // Cache assessment results
  async getCachedAssessmentResults(studentId: string, limit: number = 10) {
    return dbCache.cachedQuery(
      `assessment_results_${studentId}_${limit}`,
      async () => {
        const { data, error } = await supabase
          .from('assessment_results')
          .select('*')
          .eq('student_id', studentId)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (error) throw error;
        return data;
      },
      180 // 3 minutes
    );
  },

  // Cache collaboration sessions
  async getCachedCollaborationSessions(userId: string) {
    return dbCache.cachedQuery(
      `collaboration_sessions_${userId}`,
      async () => {
        const { data, error } = await supabase
          .from('collaboration_sessions')
          .select('*')
          .or(`created_by.eq.${userId},participants.cs.{${userId}}`)
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
      },
      60 // 1 minute (shorter for real-time data)
    );
  },

  // Invalidation helpers
  invalidateUserData(userId: string) {
    dbCache.invalidatePattern(`.*_${userId}`);
    userCache.clearUserCache(userId);
  },

  invalidateClassroomData(classroomId: string) {
    dbCache.invalidatePattern(`classroom_${classroomId}`);
  },

  invalidateAllCaches() {
    dbCache.queryCache.clear();
    dbCache.resultCache.clear();
    userCache.clearAllUserCaches();
    browserCache.clear();
  },
};

// Performance monitoring
export class CachePerformanceMonitor {
  private metrics: {
    timestamp: number;
    cacheStats: any;
  }[] = [];

  startMonitoring(intervalMs: number = 60000): void {
    setInterval(() => {
      this.collectMetrics();
    }, intervalMs);
  }

  private collectMetrics(): void {
    const stats = {
      timestamp: Date.now(),
      cacheStats: {
        database: dbCache.getStats(),
        userCacheCount: userCache['userCaches'].size,
      },
    };

    this.metrics.push(stats);

    // Keep only last 100 measurements
    if (this.metrics.length > 100) {
      this.metrics.shift();
    }
  }

  getMetrics() {
    return this.metrics;
  }

  getAverageHitRate(lastN: number = 10): number {
    const recent = this.metrics.slice(-lastN);
    if (recent.length === 0) return 0;

    const totalHitRate = recent.reduce((sum, metric) => {
      return sum + (metric.cacheStats.database.queryCache.hitRate || 0);
    }, 0);

    return totalHitRate / recent.length;
  }
}

export const cacheMonitor = new CachePerformanceMonitor();

// Initialize cache cleanup and monitoring
if (typeof window !== 'undefined') {
  // Clean up browser cache on page load
  browserCache.cleanup();
  
  // Start performance monitoring
  cacheMonitor.startMonitoring();
  
  // Clean up browser cache every hour
  setInterval(() => {
    browserCache.cleanup();
  }, 3600000);
}