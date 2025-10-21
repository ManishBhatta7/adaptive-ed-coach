import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface TextToSpeechOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  lang?: string;
  voice?: string;
}

interface VoiceNarrationState {
  isSupported: boolean;
  isPlaying: boolean;
  isPaused: boolean;
  currentText: string;
  availableVoices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  error: string | null;
}

interface VoiceNarrationActions {
  speak: (text: string, options?: TextToSpeechOptions) => Promise<void>;
  speakBilingual: (englishText: string, odiaText: string, playBoth?: boolean) => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  setVoice: (voice: SpeechSynthesisVoice) => void;
  setRate: (rate: number) => void;
  setPitch: (pitch: number) => void;
  setVolume: (volume: number) => void;
}

export function useTextToSpeech(): VoiceNarrationState & VoiceNarrationActions {
  const { i18n } = useTranslation();
  const [isSupported] = useState(() => 'speechSynthesis' in window);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoiceState] = useState<SpeechSynthesisVoice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rate, setRateState] = useState(1);
  const [pitch, setPitchState] = useState(1);
  const [volume, setVolumeState] = useState(1);

  const currentUtterance = useRef<SpeechSynthesisUtterance | null>(null);
  const isOdia = i18n.language === 'or';

  // Load available voices
  useEffect(() => {
    if (!isSupported) return;

    const loadVoices = () => {
      const voices = speechSynthesis.getVoices();
      setAvailableVoices(voices);
      
      // Auto-select appropriate voice based on current language
      if (voices.length > 0 && !selectedVoice) {
        let preferredVoice: SpeechSynthesisVoice | null = null;
        
        if (isOdia) {
          // Look for Hindi voice as closest to Odia (since Odia TTS might not be available)
          preferredVoice = voices.find(voice => 
            voice.lang.startsWith('hi') || 
            voice.lang.startsWith('or') ||
            voice.name.toLowerCase().includes('hindi') ||
            voice.name.toLowerCase().includes('odia')
          ) || null;
        }
        
        if (!preferredVoice) {
          // Fall back to English voice
          preferredVoice = voices.find(voice => 
            voice.lang.startsWith('en') || 
            voice.default
          ) || voices[0];
        }
        
        if (preferredVoice) {
          setSelectedVoiceState(preferredVoice);
        }
      }
    };

    loadVoices();
    speechSynthesis.addEventListener('voiceschanged', loadVoices);

    return () => {
      speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, [isSupported, isOdia, selectedVoice]);

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      if (currentUtterance.current) {
        speechSynthesis.cancel();
      }
    };
  }, []);

  const speak = useCallback(async (text: string, options: TextToSpeechOptions = {}) => {
    if (!isSupported) {
      setError('Text-to-speech is not supported in this browser');
      return;
    }

    if (!text.trim()) {
      setError('No text provided to speak');
      return;
    }

    try {
      // Cancel any ongoing speech
      speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      currentUtterance.current = utterance;
      
      // Set voice and speech parameters
      if (options.voice) {
        const voice = availableVoices.find(v => v.name === options.voice);
        if (voice) utterance.voice = voice;
      } else if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      
      if (options.lang) {
        utterance.lang = options.lang;
      } else if (isOdia) {
        // Use Hindi as fallback for Odia
        utterance.lang = 'hi-IN';
      } else {
        utterance.lang = 'en-US';
      }
      
      utterance.rate = options.rate || rate;
      utterance.pitch = options.pitch || pitch;
      utterance.volume = options.volume || volume;

      // Set up event listeners
      utterance.onstart = () => {
        setIsPlaying(true);
        setIsPaused(false);
        setCurrentText(text);
        setError(null);
      };

      utterance.onend = () => {
        setIsPlaying(false);
        setIsPaused(false);
        setCurrentText('');
        currentUtterance.current = null;
      };

      utterance.onerror = (event) => {
        setError(`Speech synthesis error: ${event.error}`);
        setIsPlaying(false);
        setIsPaused(false);
        setCurrentText('');
        currentUtterance.current = null;
      };

      utterance.onpause = () => {
        setIsPaused(true);
      };

      utterance.onresume = () => {
        setIsPaused(false);
      };

      // Start speaking
      speechSynthesis.speak(utterance);
      
    } catch (err) {
      setError(`Failed to speak: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setIsPlaying(false);
      setCurrentText('');
    }
  }, [isSupported, selectedVoice, availableVoices, rate, pitch, volume, isOdia]);

  const speakBilingual = useCallback(async (englishText: string, odiaText: string, playBoth: boolean = false) => {
    if (!isSupported) {
      setError('Text-to-speech is not supported in this browser');
      return;
    }

    try {
      if (playBoth) {
        // Play both languages in sequence
        if (isOdia) {
          // Play Odia first, then English
          await speak(odiaText, { lang: 'hi-IN' }); // Use Hindi voice for Odia
          
          // Wait for first speech to complete before starting second
          return new Promise<void>((resolve) => {
            const checkCompletion = () => {
              if (!isPlaying) {
                setTimeout(() => {
                  speak(englishText, { lang: 'en-US' });
                  resolve();
                }, 500); // Brief pause between languages
              } else {
                setTimeout(checkCompletion, 100);
              }
            };
            checkCompletion();
          });
        } else {
          // Play English first, then Odia
          await speak(englishText, { lang: 'en-US' });
          
          return new Promise<void>((resolve) => {
            const checkCompletion = () => {
              if (!isPlaying) {
                setTimeout(() => {
                  speak(odiaText, { lang: 'hi-IN' });
                  resolve();
                }, 500);
              } else {
                setTimeout(checkCompletion, 100);
              }
            };
            checkCompletion();
          });
        }
      } else {
        // Play only the text in current language
        const textToSpeak = isOdia ? odiaText : englishText;
        const lang = isOdia ? 'hi-IN' : 'en-US';
        await speak(textToSpeak, { lang });
      }
    } catch (err) {
      setError(`Failed to speak bilingual text: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [speak, isOdia, isPlaying, isSupported]);

  const pause = useCallback(() => {
    if (isSupported && isPlaying && !isPaused) {
      speechSynthesis.pause();
    }
  }, [isSupported, isPlaying, isPaused]);

  const resume = useCallback(() => {
    if (isSupported && isPaused) {
      speechSynthesis.resume();
    }
  }, [isSupported, isPaused]);

  const stop = useCallback(() => {
    if (isSupported) {
      speechSynthesis.cancel();
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentText('');
      currentUtterance.current = null;
    }
  }, [isSupported]);

  const setVoice = useCallback((voice: SpeechSynthesisVoice) => {
    setSelectedVoiceState(voice);
  }, []);

  const setRate = useCallback((newRate: number) => {
    setRateState(Math.max(0.1, Math.min(10, newRate)));
  }, []);

  const setPitch = useCallback((newPitch: number) => {
    setPitchState(Math.max(0, Math.min(2, newPitch)));
  }, []);

  const setVolume = useCallback((newVolume: number) => {
    setVolumeState(Math.max(0, Math.min(1, newVolume)));
  }, []);

  return {
    // State
    isSupported,
    isPlaying,
    isPaused,
    currentText,
    availableVoices,
    selectedVoice,
    error,
    
    // Actions
    speak,
    speakBilingual,
    pause,
    resume,
    stop,
    setVoice,
    setRate,
    setPitch,
    setVolume
  };
}

// Helper function to get voice recommendations for different languages
export function getRecommendedVoices(voices: SpeechSynthesisVoice[]) {
  return {
    english: voices.filter(voice => 
      voice.lang.startsWith('en') && 
      (voice.name.toLowerCase().includes('female') || voice.name.toLowerCase().includes('male'))
    ),
    hindi: voices.filter(voice => 
      voice.lang.startsWith('hi') || 
      voice.name.toLowerCase().includes('hindi')
    ),
    odia: voices.filter(voice => 
      voice.lang.startsWith('or') || 
      voice.name.toLowerCase().includes('odia')
    )
  };
}

// Educational content narration helper
export function createEducationalNarration(content: {
  title: string;
  titleOdia: string;
  explanation: string;
  explanationOdia: string;
  examples?: { description: string; descriptionOdia: string; }[];
}) {
  const englishNarration = `
    ${content.title}. 
    ${content.explanation}
    ${content.examples ? 
      'Here are some examples: ' + 
      content.examples.map((ex, i) => `Example ${i + 1}: ${ex.description}`).join('. ') 
      : ''}
  `.trim();

  const odiaNarration = `
    ${content.titleOdia}. 
    ${content.explanationOdia}
    ${content.examples ? 
      'କିଛି ଉଦାହରଣ: ' + 
      content.examples.map((ex, i) => `ଉଦାହରଣ ${i + 1}: ${ex.descriptionOdia}`).join('। ') 
      : ''}
  `.trim();

  return { englishNarration, odiaNarration };
}

export default useTextToSpeech;