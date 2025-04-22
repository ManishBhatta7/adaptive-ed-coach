
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Mic } from 'lucide-react';

// Import the type from the speechRecognition.d.ts file
import type { SpeechRecognition } from '@/types/speechRecognition';

interface VoiceRecorderProps {
  onTranscriptionChange: (text: string) => void;
  onError: (error: string) => void;
}

const VoiceRecorder = ({ onTranscriptionChange, onError }: VoiceRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognitionAPI();
      
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        onTranscriptionChange(finalTranscript || interimTranscript);
      };
      
      recognitionRef.current.onerror = (event) => {
        onError(`Speech recognition error: ${event.error}`);
        setIsRecording(false);
      };
      
      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    } else {
      onError('Speech recognition is not supported in this browser.');
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onError, onTranscriptionChange]);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      onError('Speech recognition is not available.');
      return;
    }
    
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      onTranscriptionChange('');
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recording Controls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={toggleRecording}
          className={`w-full ${isRecording ? 'bg-red-500 hover:bg-red-600' : ''}`}
        >
          <Mic className="h-4 w-4 mr-2" />
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default VoiceRecorder;
