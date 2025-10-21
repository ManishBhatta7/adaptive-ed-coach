import React, { useState, useEffect } from 'react';
import { Volume2, Square, Pause, Play, Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { cn } from '@/lib/utils';
import { AnimatedButton, IconButton } from '@/components/ui/animated-button';
import { AnimatedCard } from '@/components/ui/animated-card';

export interface ContentViewerProps {
  title: string;
  content: string;
  language?: 'en' | 'or';
  enableTTS?: boolean;
  className?: string;
  onLanguageChange?: (lang: 'en' | 'or') => void;
}

/**
 * Content viewer with integrated Text-to-Speech functionality
 */
export const ContentViewer: React.FC<ContentViewerProps> = ({
  title,
  content,
  language = 'en',
  enableTTS = true,
  className,
  onLanguageChange
}) => {
  const { t, i18n } = useTranslation();
  const { speak, stop, pause, resume, isSpeaking, isPaused, isSupported } = useTextToSpeech();
  const [currentLang, setCurrentLang] = useState<'en' | 'or'>(language);

  useEffect(() => {
    setCurrentLang(language);
  }, [language]);

  const handleSpeak = () => {
    if (isSpeaking) {
      if (isPaused) {
        resume();
      } else {
        pause();
      }
    } else {
      // Speak the content in the selected language
      speak(content, currentLang);
    }
  };

  const handleStop = () => {
    stop();
  };

  const handleLanguageToggle = () => {
    const newLang = currentLang === 'en' ? 'or' : 'en';
    setCurrentLang(newLang);
    onLanguageChange?.(newLang);
    
    // Stop current speech if speaking
    if (isSpeaking) {
      stop();
    }
  };

  return (
    <AnimatedCard variant="interactive" className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          
          {enableTTS && isSupported && (
            <div className="flex items-center gap-2">
              {/* Language Toggle */}
              <AnimatedButton
                type="button"
                variant="outline"
                size="sm"
                onClick={handleLanguageToggle}
                icon={Languages}
                iconAnimation="rotate"
                animation="scale"
                aria-label={t('common.changeLanguage', { defaultValue: 'Change Language' })}
              >
                <span className="text-xs font-medium">
                  {currentLang === 'en' ? 'English' : 'ଓଡ଼ିଆ'}
                </span>
              </AnimatedButton>

              {/* TTS Controls */}
              <div className="flex gap-1">
                <AnimatedButton
                  type="button"
                  variant={isSpeaking && !isPaused ? 'default' : 'outline'}
                  size="sm"
                  onClick={handleSpeak}
                  icon={isSpeaking ? (isPaused ? Play : Pause) : Volume2}
                  iconAnimation={isSpeaking ? 'bounce' : 'slideRight'}
                  animation="scale"
                  aria-label={
                    isSpeaking
                      ? isPaused
                        ? t('common.resume', { defaultValue: 'Resume' })
                        : t('common.pause', { defaultValue: 'Pause' })
                      : t('tts.readAloud', { defaultValue: 'Read Aloud' })
                  }
                >
                  <span className="hidden sm:inline">
                    {isSpeaking
                      ? isPaused
                        ? t('common.resume', { defaultValue: 'Resume' })
                        : t('common.pause', { defaultValue: 'Pause' })
                      : t('tts.readAloud', { defaultValue: 'Read' })}
                  </span>
                </AnimatedButton>

                {isSpeaking && (
                  <IconButton
                    icon={Square}
                    label={t('common.stop', { defaultValue: 'Stop' })}
                    onClick={handleStop}
                    variant="outline"
                    size="sm"
                    animation="scale"
                    className="animate-scale-in"
                  />
                )}
              </div>

              {/* Speaking Indicator */}
              {isSpeaking && !isPaused && (
                <Badge variant="outline" className="gap-1 animate-pulse animate-scale-in">
                  <Volume2 className="h-3 w-3 animate-bounce" />
                  {t('tts.speaking', { defaultValue: 'Speaking' })}
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div 
          className={cn(
            'prose prose-sm max-w-none dark:prose-invert',
            isSpeaking && !isPaused && 'animate-pulse'
          )}
          dangerouslySetInnerHTML={{ __html: content }}
        />

        {!isSupported && enableTTS && (
          <div className="mt-4 p-3 bg-muted rounded-md text-sm text-muted-foreground">
            {t('tts.notSupported', {
              defaultValue: 'Text-to-speech is not supported in your browser.'
            })}
          </div>
        )}
      </CardContent>
    </AnimatedCard>
  );
};

/**
 * Minimal TTS control bar that can be added to any content
 */
export const TTSControlBar: React.FC<{
  text: string;
  language?: 'en' | 'or';
  className?: string;
}> = ({ text, language = 'en', className }) => {
  const { t } = useTranslation();
  const { speak, stop, pause, resume, isSpeaking, isPaused, isSupported } = useTextToSpeech();

  if (!isSupported) {
    return null;
  }

  const handleToggleSpeak = () => {
    if (isSpeaking) {
      if (isPaused) {
        resume();
      } else {
        pause();
      }
    } else {
      speak(text, language);
    }
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <IconButton
        icon={isSpeaking ? (isPaused ? Play : Pause) : Volume2}
        label={isSpeaking ? t('common.pause') : t('tts.readAloud')}
        onClick={handleToggleSpeak}
        variant="ghost"
        size="sm"
        animation="scale"
      />

      {isSpeaking && (
        <IconButton
          icon={Square}
          label={t('common.stop')}
          onClick={stop}
          variant="ghost"
          size="sm"
          animation="scale"
          className="animate-scale-in"
        />
      )}

      {isSpeaking && !isPaused && (
        <span className="text-xs text-muted-foreground animate-pulse">
          {t('tts.speaking')}
        </span>
      )}
    </div>
  );
};

/**
 * Simple "Listen" button for inline use
 */
export const ListenButton: React.FC<{
  text: string;
  language?: 'en' | 'or';
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ text, language = 'en', variant = 'outline', size = 'sm', className }) => {
  const { t } = useTranslation();
  const { speak, isSpeaking, isSupported } = useTextToSpeech();

  if (!isSupported) {
    return null;
  }

  const handleClick = () => {
    if (!isSpeaking) {
      speak(text, language);
    }
  };

  return (
    <AnimatedButton
      type="button"
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={isSpeaking}
      icon={Volume2}
      iconAnimation="bounce"
      animation="scale"
      className={className}
      aria-label={t('tts.readAloud', { defaultValue: 'Read Aloud' })}
    >
      {t('tts.listen', { defaultValue: 'Listen' })}
    </AnimatedButton>
  );
};

export default ContentViewer;
