import React, { useState, useEffect } from 'react';
import { Download, CheckCircle, Circle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { offlineContentManager } from '@/lib/offline-content-manager';
import { showSuccess, showInfo, handleError } from '@/utils/errorHandler';
import { LoadingProgress } from '@/components/loading/LoadingState';
import { AnimatedButton } from '@/components/ui/animated-button';
import { AnimatedCard } from '@/components/ui/animated-card';
import { TRANSITIONS } from '@/lib/animations';

interface Subject {
  id: string;
  name: string;
  nameKey: string;
  estimatedSize: string;
  isCached: boolean;
  lessonCount: number;
}

export interface ContentCacheSelectorProps {
  classNum: number;
  onDownloadComplete?: () => void;
}

export const ContentCacheSelector: React.FC<ContentCacheSelectorProps> = ({
  classNum,
  onDownloadComplete
}) => {
  const { t } = useTranslation();
  const [subjects, setSubjects] = useState<Subject[]>([
    {
      id: 'science',
      name: 'Science',
      nameKey: 'subjects.science',
      estimatedSize: '~45 MB',
      isCached: false,
      lessonCount: 0
    },
    {
      id: 'mathematics',
      name: 'Mathematics',
      nameKey: 'subjects.mathematics',
      estimatedSize: '~35 MB',
      isCached: false,
      lessonCount: 0
    },
    {
      id: 'social_studies',
      name: 'Social Studies',
      nameKey: 'subjects.socialScience',
      estimatedSize: '~40 MB',
      isCached: false,
      lessonCount: 0
    },
    {
      id: 'english',
      name: 'English',
      nameKey: 'subjects.english',
      estimatedSize: '~30 MB',
      isCached: false,
      lessonCount: 0
    }
  ]);

  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [currentDownload, setCurrentDownload] = useState<string>('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Update online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check which subjects are already cached
  useEffect(() => {
    const checkCachedStatus = async () => {
      try {
        const stats = await offlineContentManager.getCacheStats();
        
        setSubjects(prevSubjects =>
          prevSubjects.map(subject => ({
            ...subject,
            isCached: stats.lessons > 0, // Simple check for now
            lessonCount: Math.floor(stats.lessons / 4) // Estimate per subject
          }))
        );
      } catch (error) {
        console.error('Error checking cache status:', error);
      }
    };

    checkCachedStatus();
  }, []);

  const handleSubjectToggle = (subjectId: string) => {
    setSelectedSubjects(prev =>
      prev.includes(subjectId)
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const handleSelectAll = () => {
    if (selectedSubjects.length === subjects.length) {
      setSelectedSubjects([]);
    } else {
      setSelectedSubjects(subjects.map(s => s.id));
    }
  };

  const handleDownload = async () => {
    if (!isOnline) {
      showInfo(
        t('common.noInternet') as string,
        t('offline.downloadRequiresInternet', {
          defaultValue: 'Please connect to the internet to download content.'
        }) as string
      );
      return;
    }

    if (selectedSubjects.length === 0) {
      showInfo(
        t('common.info') as string,
        t('offline.selectSubjects', {
          defaultValue: 'Please select at least one subject to download.'
        }) as string
      );
      return;
    }

    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      const totalSubjects = selectedSubjects.length;
      
      for (let i = 0; i < selectedSubjects.length; i++) {
        const subjectId = selectedSubjects[i];
        const subject = subjects.find(s => s.id === subjectId);
        
        setCurrentDownload(subject?.name || subjectId);
        setDownloadProgress(((i + 0.5) / totalSubjects) * 100);

        // Cache the subject lessons
        await offlineContentManager.cacheEssentialLessons(
          classNum,
          [subjectId]
        );

        setDownloadProgress(((i + 1) / totalSubjects) * 100);
      }

      // Update cached status
      setSubjects(prevSubjects =>
        prevSubjects.map(subject => ({
          ...subject,
          isCached: selectedSubjects.includes(subject.id) ? true : subject.isCached
        }))
      );

      showSuccess(
        t('storage.downloadComplete', { defaultValue: 'Download Complete' }) as string,
        t('storage.contentAvailableOffline', {
          defaultValue: 'Content is now available offline.'
        }) as string
      );

      setSelectedSubjects([]);
      onDownloadComplete?.();
    } catch (error) {
      console.error('Download failed:', error);
      handleError(error, {
        title: t('errors.downloadFailed', { defaultValue: 'Download Failed' }) as string,
        retry: handleDownload
      });
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
      setCurrentDownload('');
    }
  };

  const totalSelected = selectedSubjects.length;
  const allSelected = selectedSubjects.length === subjects.length;

  return (
    <AnimatedCard variant="interactive" className="overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              {t('offline.downloadForOffline', { defaultValue: 'Download for Offline' })}
            </CardTitle>
            <CardDescription>
              {t('offline.selectSubjectsDescription', {
                defaultValue: 'Select subjects to download for offline access'
              })}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Badge variant="outline" className="gap-1 animate-fade-in">
                <Wifi className="h-3 w-3" />
                {t('common.online')}
              </Badge>
            ) : (
              <Badge variant="destructive" className="gap-1 animate-pulse">
                <WifiOff className="h-3 w-3" />
                {t('common.offline')}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Select All Checkbox */}
        <div className="flex items-center gap-3 pb-3 border-b">
          <Checkbox
            id="select-all"
            checked={allSelected}
            onCheckedChange={handleSelectAll}
            disabled={isDownloading}
          />
          <label
            htmlFor="select-all"
            className="text-sm font-medium cursor-pointer"
          >
            {allSelected
              ? t('common.deselectAll', { defaultValue: 'Deselect All' })
              : t('common.selectAll', { defaultValue: 'Select All' })}
          </label>
          {totalSelected > 0 && (
            <Badge variant="secondary">
              {totalSelected} {t('common.selected', { defaultValue: 'selected' })}
            </Badge>
          )}
        </div>

        {/* Subject List */}
        <div className="space-y-4">
          {subjects.map((subject, index) => (
            <AnimatedCard
              key={subject.id}
              variant="hover"
              isSelected={selectedSubjects.includes(subject.id)}
              className="p-3 animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center gap-3">
              <Checkbox
                id={subject.id}
                checked={selectedSubjects.includes(subject.id)}
                onCheckedChange={() => handleSubjectToggle(subject.id)}
                disabled={isDownloading}
              />
              
              <div className="flex-1">
                <label
                  htmlFor={subject.id}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <span className="font-medium">
                    {t(subject.nameKey, { defaultValue: subject.name })}
                  </span>
                  {subject.isCached && (
                    <Badge variant="outline" className="gap-1 text-green-600">
                      <CheckCircle className="h-3 w-3" />
                      {t('common.availableOffline')}
                    </Badge>
                  )}
                </label>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('offline.estimatedSize', { defaultValue: 'Estimated size' })}: {subject.estimatedSize}
                  {subject.lessonCount > 0 && ` • ${subject.lessonCount} lessons cached`}
                </p>
              </div>

                {subject.isCached ? (
                  <CheckCircle className="h-5 w-5 text-green-600 animate-scale-in" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </AnimatedCard>
          ))}
        </div>

        {/* Download Progress */}
        {isDownloading && (
          <div className="space-y-2">
            <LoadingProgress
              value={downloadProgress}
              message={t('offline.downloading', {
                defaultValue: `Downloading ${currentDownload}...`,
                subject: currentDownload
              })}
            />
          </div>
        )}

        {/* Download Button */}
        <AnimatedButton
          type="button"
          onClick={handleDownload}
          disabled={isDownloading || selectedSubjects.length === 0 || !isOnline}
          className="w-full"
          size="lg"
          icon={Download}
          iconAnimation="slideRight"
          animation="lift"
          isLoading={isDownloading}
          loadingText={t('offline.downloading', { defaultValue: 'Downloading...' })}
        >
          {t('offline.downloadSelected', {
            defaultValue: `Download Selected (${totalSelected})`,
            count: totalSelected
          })}
        </AnimatedButton>

        {/* Tip */}
        {!isOnline && (
          <div className="bg-muted p-3 rounded-md text-sm text-muted-foreground">
            <p>
              {t('storage.tip3', {
                defaultValue: 'Download content when on Wi-Fi to save mobile data'
              })}
            </p>
          </div>
        )}
      </CardContent>
    </AnimatedCard>
  );
};

export default ContentCacheSelector;
