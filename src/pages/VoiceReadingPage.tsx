import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import MainLayout from '@/components/layout/MainLayout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VoiceRecorder from '@/components/voice-reading/VoiceRecorder';
import ReadingPassage from '@/components/voice-reading/ReadingPassage';
import ReadingAnalysis from '@/components/voice-reading/ReadingAnalysis';
import { samplePassages } from '@/data/readingPassages';
import { generateReadingFeedback } from '@/data/feedbackTemplates';

const VoiceReadingPage = () => {
  const navigate = useNavigate();
  const { state } = useAppContext();
  const { isAuthenticated } = state;
  
  const [transcription, setTranscription] = useState('');
  const [analysis, setAnalysis] = useState<{
    fluency: number;
    pronunciation: number;
    expression: number;
    feedback: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedPassage, setSelectedPassage] = useState(samplePassages[0]);
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const analyzeReading = () => {
    if (!transcription) {
      setErrorMessage('No speech was detected. Please try again.');
      return;
    }
    
    const wordCount = transcription.split(/\s+/).filter(Boolean).length;
    const sentenceCount = transcription.split(/[.!?]+/).filter(Boolean).length;
    
    setTimeout(() => {
      const mockAnalysis = {
        fluency: Math.floor(Math.random() * 31) + 70,
        pronunciation: Math.floor(Math.random() * 31) + 70,
        expression: Math.floor(Math.random() * 31) + 70,
        feedback: generateReadingFeedback(wordCount, sentenceCount)
      };
      
      setAnalysis(mockAnalysis);
    }, 1500);
  };

  const handleTranscriptionChange = (text: string) => {
    setTranscription(text);
    if (text && !analysis) {
      analyzeReading();
    }
  };

  return (
    <MainLayout>
      <div className="container px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Reading Practice</h1>
            <p className="text-gray-600 mt-2">
              Practice your reading skills and get AI feedback on your fluency, pronunciation, and expression
            </p>
          </div>
          
          <Tabs defaultValue="practice">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="practice">Reading Practice</TabsTrigger>
              <TabsTrigger value="results" disabled={!analysis}>Feedback & Analysis</TabsTrigger>
            </TabsList>
            
            <TabsContent value="practice">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {samplePassages.map((passage, index) => (
                    <ReadingPassage
                      key={index}
                      title={passage.title}
                      text={passage.text}
                      isSelected={selectedPassage.title === passage.title}
                      onSelect={() => setSelectedPassage(passage)}
                    />
                  ))}
                </div>
                
                <div className="space-y-6">
                  <Card>
                    <CardTitle>{selectedPassage.title}</CardTitle>
                    <CardContent>
                      <div className="bg-gray-50 p-4 rounded-md">
                        <p className="text-gray-800 leading-relaxed">{selectedPassage.text}</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <VoiceRecorder
                    onTranscriptionChange={handleTranscriptionChange}
                    onError={setErrorMessage}
                  />
                  
                  {errorMessage && (
                    <Alert variant="destructive">
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{errorMessage}</AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="results">
              {analysis && (
                <ReadingAnalysis
                  analysis={analysis}
                  transcription={transcription}
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
};

export default VoiceReadingPage;
