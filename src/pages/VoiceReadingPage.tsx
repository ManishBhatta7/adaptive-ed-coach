import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import MainLayout from '@/components/layout/MainLayout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VoiceRecorder from '@/components/voice-reading/VoiceRecorder';
import ReadingPassage from '@/components/voice-reading/ReadingPassage';
import ReadingAnalysis from '@/components/voice-reading/ReadingAnalysis';
import { Card, CardContent, CardTitle } from '@/components/ui/card';

// Sample reading passages
const samplePassages = [
  {
    title: "The Mysterious Garden",
    text: "Behind the old house was a garden unlike any other. Tall trees with silver leaves whispered secrets to anyone who would listen. Flowers of every color imaginable lined the winding paths. In the center stood a small fountain where water danced and sparkled in the sunlight. Many people said the garden was magical, but only those with kind hearts could see its true beauty."
  },
  {
    title: "Journey to the Stars",
    text: "The spaceship was ready for its first journey to the distant planets. Captain Maya checked all the controls one last time before takeoff. The engines hummed with power as the countdown began. Five, four, three, two, one... blast off! The ship rose into the sky, leaving Earth behind. Through the window, Maya could see the blue planet getting smaller and smaller as they headed toward the stars."
  },
  {
    title: "The Clever Fox",
    text: "Once there was a fox who was known throughout the forest for his cleverness. One day, he found himself trapped in a hunter's net. Instead of panicking, he stayed calm and thought carefully. He noticed a sharp rock nearby and slowly pulled it closer with his paw. Using the rock, he cut through the net and escaped. The other animals watched in amazement as the fox trotted away, tail high in the air."
  }
];

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
  
  const generateReadingFeedback = (text: string) => {
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const sentenceCount = text.split(/[.!?]+/).filter(Boolean).length;
    
    const feedbackTemplates = [
      `Your reading included approximately ${wordCount} words across ${sentenceCount} sentences. Your pace was good, with clear articulation of most words. You demonstrated confidence in your reading, though there were a few hesitations. Continue practicing to improve fluency on longer passages.`,
      `I noticed good expression in your reading, particularly with dialogue sections. Your pronunciation was generally accurate with only a few challenging words. For improvement, try varying your tone more to match the emotional content of the text.`,
      `You read with good attention to punctuation, pausing appropriately at periods and commas. Your reading speed was appropriate for comprehension. To enhance your reading skills further, practice emphasizing key words in sentences to convey meaning more effectively.`
    ];
    
    return feedbackTemplates[Math.floor(Math.random() * feedbackTemplates.length)];
  };

  const analyzeReading = () => {
    if (!transcription) {
      setErrorMessage('No speech was detected. Please try again.');
      return;
    }
    
    setTimeout(() => {
      const mockAnalysis = {
        fluency: Math.floor(Math.random() * 31) + 70,
        pronunciation: Math.floor(Math.random() * 31) + 70,
        expression: Math.floor(Math.random() * 31) + 70,
        feedback: generateReadingFeedback(transcription)
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
