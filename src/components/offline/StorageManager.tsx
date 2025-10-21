import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { AnimatedButton } from '@/components/ui/animated-button';
import { AnimatedCard, StatCard } from '@/components/ui/animated-card';
import { 
  HardDrive, 
  Trash2, 
  Download, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Database,
  Folder
} from 'lucide-react';
import { offlineContentManager, useOfflineContent } from '@/lib/offline-content-manager';

interface StorageStatus {
  used: number;
  available: number;
  quota: number;
  percentage: number;
  usedFormatted: string;
  availableFormatted: string;
  quotaFormatted: string;
}

interface CacheItem {
  key: string;
  type: 'lesson' | 'multimedia' | 'progress' | 'other';
  size: number;
  lastAccessed: number;
  canDelete: boolean;
}

export const StorageManager: React.FC = () => {
  const { t } = useTranslation();
  const { cacheStats, isInitialized } = useOfflineContent();
  const [storage, setStorage] = useState<StorageStatus | null>(null);
  const [cacheItems, setCacheItems] = useState<CacheItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const getStorageStatus = useCallback(async (): Promise<StorageStatus | null> => {
    if (navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        const used = estimate.usage || 0;
        const quota = estimate.quota || 0;
        const available = quota - used;
        const percentage = quota > 0 ? (used / quota) * 100 : 0;

        return {
          used,
          available,
          quota,
          percentage,
          usedFormatted: formatBytes(used),
          availableFormatted: formatBytes(available),
          quotaFormatted: formatBytes(quota)
        };
      } catch (error) {
        console.error('Failed to get storage estimate:', error);
        return null;
      }
    }
    return null;
  }, []);

  const loadStorageInfo = useCallback(async () => {
    setIsLoading(true);
    try {
      const storageStatus = await getStorageStatus();
      setStorage(storageStatus);

      // Load cache items (mock data for now - would need to implement actual cache listing)
      const items: CacheItem[] = [
        {
          key: 'lessons_cache',
          type: 'lesson',
          size: 5242880, // 5MB
          lastAccessed: Date.now() - 86400000,
          canDelete: true
        },
        {
          key: 'multimedia_cache',
          type: 'multimedia',
          size: 15728640, // 15MB
          lastAccessed: Date.now() - 172800000,
          canDelete: true
        },
        {
          key: 'user_progress',
          type: 'progress',
          size: 524288, // 512KB
          lastAccessed: Date.now(),
          canDelete: false
        }
      ];
      setCacheItems(items);
    } catch (error) {
      console.error('Failed to load storage info:', error);
    } finally {
      setIsLoading(false);
    }
  }, [getStorageStatus]);

  useEffect(() => {
    if (isInitialized) {
      loadStorageInfo();
    }
  }, [isInitialized, loadStorageInfo]);

  const handleSelectItem = (key: string, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(key);
    } else {
      newSelected.delete(key);
    }
    setSelectedItems(newSelected);
  };

  const handleClearSelected = async () => {
    if (selectedItems.size === 0) return;

    setIsClearing(true);
    try {
      // Would implement actual cache clearing logic here
      for (const key of selectedItems) {
        console.log('Clearing cache:', key);
        // await clearCacheItem(key);
      }

      setSelectedItems(new Set());
      await loadStorageInfo();
    } catch (error) {
      console.error('Failed to clear cache:', error);
    } finally {
      setIsClearing(false);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm(t('storage.confirmClearAll') || 'Clear all cached data? This will remove offline content and you\'ll need to download it again.')) {
      return;
    }

    setIsClearing(true);
    try {
      // Clear all caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }

      // Clear IndexedDB
      await offlineContentManager.clearExpiredCache();

      await loadStorageInfo();
    } catch (error) {
      console.error('Failed to clear all cache:', error);
    } finally {
      setIsClearing(false);
    }
  };

  if (isLoading) {
    return (
      <AnimatedCard variant="static" className="animate-pulse">
        <CardContent className="p-8 text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground animate-fade-in">{t('storage.loading') || 'Loading storage information...'}</p>
        </CardContent>
      </AnimatedCard>
    );
  }

  const getStorageStatusColor = () => {
    if (!storage) return 'bg-gray-500';
    if (storage.percentage >= 90) return 'bg-red-500';
    if (storage.percentage >= 75) return 'bg-orange-500';
    if (storage.percentage >= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-6">
      {/* Storage Overview */}
      <AnimatedCard variant="interactive" className="animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            {t('storage.title') || 'Storage Management'}
          </CardTitle>
          <CardDescription>
            {t('storage.description') || 'Manage your offline content and storage usage'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {storage ? (
            <>
              {/* Storage Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {t('storage.used') || 'Used'}: {storage.usedFormatted}
                  </span>
                  <span className="text-gray-600">
                    {t('storage.available') || 'Available'}: {storage.availableFormatted}
                  </span>
                </div>
                <Progress 
                  value={storage.percentage} 
                  className="h-3"
                  indicatorClassName={getStorageStatusColor()}
                />
                <p className="text-xs text-gray-500 text-right">
                  {storage.percentage.toFixed(1)}% of {storage.quotaFormatted}
                </p>
              </div>

              {/* Warning for low storage */}
              {storage.percentage >= 90 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {t('storage.lowSpace') || 'Storage space is running low. Consider clearing some cached content.'}
                  </AlertDescription>
                </Alert>
              )}

              {/* Cache Statistics */}
              {cacheStats && (
                <div className="grid grid-cols-3 gap-4">
                  <StatCard
                    label={t('storage.lessons') || 'Lessons'}
                    value={cacheStats.totalLessons || 0}
                    icon={<Database className="h-6 w-6" />}
                    className="bg-blue-50 border-blue-200"
                  />
                  <StatCard
                    label={t('storage.media') || 'Media Files'}
                    value={cacheStats.totalMultimedia || 0}
                    icon={<Folder className="h-6 w-6" />}
                    className="bg-purple-50 border-purple-200"
                  />
                  <StatCard
                    label={t('storage.records') || 'Progress Records'}
                    value={cacheStats.totalProgress || 0}
                    icon={<CheckCircle className="h-6 w-6" />}
                    className="bg-green-50 border-green-200"
                  />
                </div>
              )}
            </>
          ) : (
            <Alert>
              <AlertDescription>
                {t('storage.notSupported') || 'Storage API not supported in this browser'}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </AnimatedCard>

      {/* Cache Items Management */}
      <AnimatedCard variant="hover" className="animate-fade-in" style={{ animationDelay: '100ms' }}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Folder className="h-5 w-5" />
                {t('storage.cachedContent') || 'Cached Content'}
              </CardTitle>
              <CardDescription>
                {t('storage.selectItemsToDelete') || 'Select items to remove from offline storage'}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {selectedItems.size > 0 && (
                <AnimatedButton
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleClearSelected}
                  disabled={isClearing}
                  icon={Trash2}
                  iconAnimation="wiggle"
                  animation="scale"
                  isLoading={isClearing}
                >
                  {t('storage.clearSelected') || 'Clear Selected'} ({selectedItems.size})
                </AnimatedButton>
              )}
              <AnimatedButton
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                disabled={isClearing}
                icon={Trash2}
                iconAnimation="shake"
                animation="scale"
              >
                {t('storage.clearAll') || 'Clear All'}
              </AnimatedButton>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {cacheItems.map((item, index) => (
              <AnimatedCard
                key={item.key}
                variant="hover"
                className="p-4 animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {item.canDelete && (
                    <Checkbox
                      checked={selectedItems.has(item.key)}
                      onCheckedChange={(checked) => 
                        handleSelectItem(item.key, checked as boolean)
                      }
                      aria-label={`Select ${item.key}`}
                    />
                  )}
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {item.key.replace('_', ' ')}
                      <Badge variant="outline" className="text-xs">
                        {item.type}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatBytes(item.size)} • Last accessed {new Date(item.lastAccessed).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                {!item.canDelete && (
                  <Badge variant="secondary" className="text-xs animate-pulse">
                    {t('storage.protected') || 'Protected'}
                  </Badge>
                )}
                </div>
              </AnimatedCard>
            ))}
          </div>
        </CardContent>
      </AnimatedCard>

      {/* Tips */}
      <AnimatedCard variant="static" className="animate-fade-in" style={{ animationDelay: '200ms' }}>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            {t('storage.tips') || 'Storage Tips'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>{t('storage.tip1') || 'Cached content is automatically managed and cleaned up after 7 days'}</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>{t('storage.tip2') || 'Your progress data is always protected and won\'t be deleted'}</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>{t('storage.tip3') || 'Download content when on Wi-Fi to save mobile data'}</span>
            </li>
          </ul>
        </CardContent>
      </AnimatedCard>
    </div>
  );
};

export default StorageManager;
