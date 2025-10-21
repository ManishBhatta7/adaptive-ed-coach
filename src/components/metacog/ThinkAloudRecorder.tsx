import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/context/AppContext';
import { 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  Square, 
  Upload, 
  AlertTriangle,
  Shield,
  Clock,
  FileAudio
} from 'lucide-react';

interface RecordingData {
  id: string;
  blob: Blob;
  duration: number;
  transcript?: string;
  analysis?: {
    strategyWords: string[];
    qualityScore: number;
    insights: string[];
  };
}

interface ConsentState {
  hasConsent: boolean;
  consentGiven: boolean;
  parentalConsentRequired: boolean;
  consentDate?: Date;
}

export const ThinkAloudRecorder: React.FC = () => {
  const { state } = useAppContext();
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [currentRecording, setCurrentRecording] = useState<RecordingData | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [consentState, setConsentState] = useState<ConsentState>({
    hasConsent: false,
    consentGiven: false,
    parentalConsentRequired: false
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    checkConsentStatus();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const checkConsentStatus = async () => {
    if (!state.currentUser) return;

    try {
      // Check if user has given consent for voice recording
      const { data: consent, error } = await supabase
        .from('profiles')
        .select('voice_consent, date_of_birth, created_at')
        .eq('id', state.currentUser.id)
        .single();

      if (error) {
        console.error('Error checking consent:', error);
        return;
      }

      // Check if parental consent is required (under 18)
      const isMinor = consent?.date_of_birth ? 
        (new Date().getFullYear() - new Date(consent.date_of_birth).getFullYear()) < 18 : 
        false;

      setConsentState({
        hasConsent: !!consent?.voice_consent,
        consentGiven: !!consent?.voice_consent,
        parentalConsentRequired: isMinor,
        consentDate: consent?.voice_consent ? new Date(consent.created_at) : undefined
      });
    } catch (error) {
      console.error('Error checking consent status:', error);
    }
  };

  const requestPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });
      setHasPermission(true);
      
      // Stop the stream immediately as we just wanted to check permission
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.error('Error requesting permissions:', error);
      setHasPermission(false);
    }
  };

  const giveConsent = async (consentGiven: boolean) => {
    if (!state.currentUser) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          voice_consent: consentGiven,
          voice_consent_date: consentGiven ? new Date().toISOString() : null
        })
        .eq('id', state.currentUser.id);

      if (error) {
        console.error('Error updating consent:', error);
        return;
      }

      setConsentState(prev => ({
        ...prev,
        hasConsent: consentGiven,
        consentGiven,
        consentDate: consentGiven ? new Date() : undefined
      }));

      // Log consent event
      await supabase.rpc('log_metacog_event', {
        p_event_type: 'voice_consent_given',
        p_user_id: state.currentUser.id,
        p_payload: {
          consent_given: consentGiven,
          parental_consent_required: consentState.parentalConsentRequired
        }
      });

    } catch (error) {
      console.error('Error giving consent:', error);
    }
  };

  const startRecording = async () => {
    if (!hasPermission) {
      await requestPermissions();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const recordingId = Date.now().toString();
        
        setCurrentRecording({
          id: recordingId,
          blob,
          duration: recordingTime
        });

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(1000); // Collect data every second
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      setHasPermission(false);
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      
      // Resume timer
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  };

  const uploadRecording = async () => {
    if (!currentRecording || !state.currentUser) return;

    setIsUploading(true);
    try {
      // Convert blob to base64 for Edge Function
      const arrayBuffer = await currentRecording.blob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      // Call Edge Function for transcription and analysis
      const { data, error } = await supabase.functions.invoke('process-think-aloud', {
        body: {
          audio_data: base64Audio,
          duration: currentRecording.duration,
          student_id: state.currentUser.id
        }
      });

      if (error) {
        console.error('Error processing recording:', error);
        return;
      }

      // Update current recording with analysis
      setCurrentRecording(prev => prev ? {
        ...prev,
        transcript: data.transcript,
        analysis: data.analysis
      } : null);

      // Log the think-aloud event
      await supabase.rpc('log_metacog_event', {
        p_event_type: 'think_aloud_recorded',
        p_user_id: state.currentUser.id,
        p_payload: {
          duration: currentRecording.duration,
          transcript_length: data.transcript?.length || 0,
          strategy_words: data.analysis?.strategyWords || [],
          quality_score: data.analysis?.qualityScore || 0
        }
      });

    } catch (error) {
      console.error('Error uploading recording:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Show consent form if consent not given
  if (!consentState.hasConsent) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Voice Recording Consent
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Privacy Notice:</strong> Voice recordings help improve your learning by analyzing your 
              problem-solving strategies. Your voice data is processed securely and can be deleted at any time.
            </AlertDescription>
          </Alert>

          {consentState.parentalConsentRequired && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Parental Consent Required:</strong> You appear to be under 18. Please have a parent 
                or guardian review and approve voice recording before proceeding.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="consent-recording" 
                onCheckedChange={(checked) => {
                  // This is just for UI, actual consent is given via button
                }}
              />
              <Label htmlFor="consent-recording" className="text-sm">
                I understand that my voice will be recorded and transcribed for educational analysis
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="consent-storage" 
                onCheckedChange={(checked) => {
                  // This is just for UI, actual consent is given via button
                }}
              />
              <Label htmlFor="consent-storage" className="text-sm">
                I understand that recordings are stored securely and I can request deletion at any time
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="consent-analysis" 
                onCheckedChange={(checked) => {
                  // This is just for UI, actual consent is given via button
                }}
              />
              <Label htmlFor="consent-analysis" className="text-sm">
                I consent to AI analysis of my voice recordings to improve my learning experience
              </Label>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={() => giveConsent(true)}
              className="flex items-center gap-2"
            >
              <Shield className="w-4 h-4" />
              Give Consent & Enable Recording
            </Button>
            <Button 
              onClick={() => giveConsent(false)}
              variant="outline"
            >
              Decline
            </Button>
          </div>

          <p className="text-xs text-gray-500">
            You can change your consent preferences at any time in your profile settings.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Show permission request if needed
  if (hasPermission === false) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Mic className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Microphone Access Required</h3>
          <p className="text-gray-600 mb-4">
            Please allow microphone access to record your think-aloud sessions.
          </p>
          <Button onClick={requestPermissions} className="flex items-center gap-2">
            <Mic className="w-4 h-4" />
            Request Permission
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Recording Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="w-5 h-5" />
            Think-Aloud Recorder
          </CardTitle>
          <p className="text-sm text-gray-600">
            Record yourself explaining your problem-solving process (30-90 seconds recommended)
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Recording Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                isRecording 
                  ? isPaused 
                    ? 'bg-yellow-500' 
                    : 'bg-red-500 animate-pulse' 
                  : 'bg-gray-400'
              }`} />
              <span className="font-medium">
                {isRecording 
                  ? isPaused 
                    ? 'Paused' 
                    : 'Recording...' 
                  : 'Ready to Record'
                }
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="font-mono">{formatTime(recordingTime)}</span>
            </div>
          </div>

          {/* Recording Controls */}
          <div className="flex justify-center gap-2">
            {!isRecording ? (
              <Button 
                onClick={startRecording}
                className="flex items-center gap-2"
                size="lg"
              >
                <Mic className="w-4 h-4" />
                Start Recording
              </Button>
            ) : (
              <>
                {!isPaused ? (
                  <Button 
                    onClick={pauseRecording}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Pause className="w-4 h-4" />
                    Pause
                  </Button>
                ) : (
                  <Button 
                    onClick={resumeRecording}
                    className="flex items-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Resume
                  </Button>
                )}
                <Button 
                  onClick={stopRecording}
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  <Square className="w-4 h-4" />
                  Stop
                </Button>
              </>
            )}
          </div>

          {/* Recording Tips */}
          <Alert>
            <Mic className="h-4 w-4" />
            <AlertDescription>
              <strong>Tips for effective think-aloud:</strong> Explain your thought process as you solve 
              the problem. Mention strategies you're using, why you chose them, and what you're thinking 
              at each step.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Current Recording */}
      {currentRecording && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileAudio className="w-5 h-5" />
              Your Recording
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Recording Duration: {formatTime(currentRecording.duration)}</p>
                <p className="text-sm text-gray-600">Ready for analysis</p>
              </div>
              <Button 
                onClick={uploadRecording}
                disabled={isUploading}
                className="flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                {isUploading ? 'Processing...' : 'Analyze Recording'}
              </Button>
            </div>

            {/* Transcript */}
            {currentRecording.transcript && (
              <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                <h4 className="font-medium mb-2">Transcript:</h4>
                <p className="text-sm">{currentRecording.transcript}</p>
              </div>
            )}

            {/* Analysis */}
            {currentRecording.analysis && (
              <div className="space-y-3">
                <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
                  <h4 className="font-medium mb-2">Analysis Results:</h4>
                  <div className="space-y-2">
                    <p className="text-sm">
                      <strong>Quality Score:</strong> {(currentRecording.analysis.qualityScore * 100).toFixed(1)}%
                    </p>
                    <div>
                      <strong className="text-sm">Strategy Words Detected:</strong>
                      <div className="flex gap-1 mt-1">
                        {currentRecording.analysis.strategyWords.map((word, index) => (
                          <Badge key={index} variant="secondary">{word}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {currentRecording.analysis.insights.length > 0 && (
                  <div className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-400">
                    <h4 className="font-medium mb-2">Insights:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {currentRecording.analysis.insights.map((insight, index) => (
                        <li key={index} className="text-sm">{insight}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Privacy Notice */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-sm">Privacy & Data Usage</h4>
              <p className="text-xs text-gray-600 mt-1">
                Recordings are processed securely and used only for educational analysis. 
                Raw audio is not stored permanently. You can revoke consent at any time.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};