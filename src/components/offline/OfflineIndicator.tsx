import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePWA } from '@/hooks/usePWA';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AnimatedButton, IconButton } from '@/components/ui/animated-button';
import { 
  WifiOff, 
  Wifi, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Download,
  CloudOff,
  X
} from 'lucide-react';

interface OfflineIndicatorProps {
  showWhenOnline?: boolean;
  position?: 'top' | 'bottom';
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ 
  showWhenOnline = false,
  position = 'top'
}) => {
  const { t } = useTranslation();
  const { isOffline, syncOfflineData } = usePWA();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showOnlineMessage, setShowOnlineMessage] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    // Track offline/online transitions
    if (isOffline) {
      setWasOffline(true);
      setIsDismissed(false);
    } else if (wasOffline && !isOffline) {
      // Just came back online
      setShowOnlineMessage(true);
      
      // Auto-dismiss online message after 5 seconds
      const timer = setTimeout(() => {
        setShowOnlineMessage(false);
        setWasOffline(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [isOffline, wasOffline]);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncOfflineData();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    setShowOnlineMessage(false);
  };

  // Don't show anything if dismissed or conditions not met
  if (isDismissed) return null;
  if (!isOffline && !showOnlineMessage) return null;
  if (!isOffline && !showWhenOnline && !showOnlineMessage) return null;

  const positionClass = position === 'top' 
    ? 'top-0' 
    : 'bottom-0';

  // Online indicator (after reconnecting)
  if (showOnlineMessage && !isOffline) {
    return (
      <div className={`fixed ${positionClass} left-0 right-0 z-50 px-4 py-2 animate-slide-in-down`}>
        <Alert className="bg-green-500 text-white border-green-600 shadow-lg max-w-4xl mx-auto animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 animate-scale-in" />
              <div>
                <AlertDescription className="text-white font-medium">
                  {t('common.backOnline') || 'Back Online'}
                </AlertDescription>
                <p className="text-sm text-green-100 mt-1">
                  {t('common.syncingData') || 'Syncing your offline data...'}
                </p>
              </div>
            </div>
            <IconButton
              icon={X}
              label="Dismiss notification"
              onClick={handleDismiss}
              className="text-white hover:bg-green-600"
              animation="scale"
            />
          </div>
        </Alert>
      </div>
    );
  }

  // Offline indicator
  return (
    <div className={`fixed ${positionClass} left-0 right-0 z-50 px-4 py-2 animate-slide-in-down`}>
      <Alert className="bg-orange-500 text-white border-orange-600 shadow-lg max-w-4xl mx-auto animate-fade-in">
          <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <CloudOff className="h-5 w-5 animate-pulse" aria-hidden="true" />
            <div className="flex-1">
              <AlertDescription className="text-white font-medium flex items-center gap-2">
                {t('common.offlineMode') || 'Offline Mode'}
                <Badge variant="secondary" className="bg-orange-600 text-white border-orange-700">
                  {t('common.noInternet') || 'No Internet'}
                </Badge>
              </AlertDescription>
              <p className="text-sm text-orange-100 mt-1">
                {t('common.offlineDescription') || 'You can still access cached content. Changes will sync when you\'re back online.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AnimatedButton
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleSync}
              disabled={isSyncing || isOffline}
              className="bg-orange-600 text-white hover:bg-orange-700 border-orange-700"
              icon={RefreshCw}
              iconAnimation="rotate"
              animation="scale"
              isLoading={isSyncing}
              loadingText={t('common.syncing') || 'Syncing...'}
            >
              {t('common.retry') || 'Retry'}
            </AnimatedButton>
            <IconButton
              icon={X}
              label="Dismiss notification"
              onClick={handleDismiss}
              className="text-white hover:bg-orange-600"
              animation="scale"
            />
          </div>
        </div>
      </Alert>
    </div>
  );
};

// Mini offline status badge for use in headers/toolbars
export const OfflineStatusBadge: React.FC = () => {
  const { t } = useTranslation();
  const { isOffline } = usePWA();

  if (!isOffline) {
    return (
      <Badge variant="outline" className="flex items-center gap-1 bg-green-50 text-green-700 border-green-300">
        <Wifi className="h-3 w-3" />
        <span className="text-xs">{t('common.online') || 'Online'}</span>
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="flex items-center gap-1 bg-orange-50 text-orange-700 border-orange-300">
      <WifiOff className="h-3 w-3" />
      <span className="text-xs">{t('common.offline') || 'Offline'}</span>
    </Badge>
  );
};

// Content availability indicator for lessons
export const ContentAvailabilityBadge: React.FC<{ isAvailableOffline: boolean }> = ({ 
  isAvailableOffline 
}) => {
  const { t } = useTranslation();

  if (isAvailableOffline) {
    return (
      <Badge variant="outline" className="flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-300">
        <Download className="h-3 w-3" />
        <span className="text-xs">{t('common.availableOffline') || 'Available Offline'}</span>
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="flex items-center gap-1 bg-gray-50 text-gray-600 border-gray-300">
      <AlertCircle className="h-3 w-3" />
      <span className="text-xs">{t('common.requiresInternet') || 'Requires Internet'}</span>
    </Badge>
  );
};

export default OfflineIndicator;
