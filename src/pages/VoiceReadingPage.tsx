
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Mic } from 'lucide-react';

const VoiceReadingPage = () => {
  const navigate = useNavigate();
  const { state } = useAppContext();
  const { currentUser, isAuthenticated } = state;
  
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [analysis, setAnalysis] = useState<{
    fluency: number;
    pronunciation: number;
    expression: number;
    feedback: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);
  
  // Set up speech recognition
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
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
        
        setTranscription(finalTranscript || interimTranscript);
      };
      
      recognitionRef.current.onerror = (event) => {
        setErrorMessage(`Speech recognition error: ${event.error}`);
        setIsRecording(false);
      };
      
      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    } else {
      setErrorMessage('Speech recognition is not supported in this browser.');
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);
  
  const toggleRecording = () => {
    if (!recognitionRef.current) {
      setErrorMessage('Speech recognition is not available.');
      return;
    }
    
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      // Analyze after stopping recording
      analyzeReading();
    } else {
      setTranscription('');
      setAnalysis(null);
      recognitionRef.current.start();
      setIsRecording(true);
      setErrorMessage(null);
    }
  };
  
  const analyzeReading = async () => {
    if (!transcription) {
      setErrorMessage('No speech was detected. Please try again.');
      return;
    }
    
    // In a real implementation, this would call the backend API
    // For now, simulate analysis with random scores
    
    // Simulate API call delay
    setTimeout(() => {
      const mockAnalysis = {
        fluency: Math.floor(Math.random() * 31) + 70, // 70-100
        pronunciation: Math.floor(Math.random() * 31) + 70, // 70-100
        expression: Math.floor(Math.random() * 31) + 70, // 70-100
        feedback: generateReadingFeedback(transcription)
      };
      
      setAnalysis(mockAnalysis);
    }, 1500);
  };
  
  // Helper function to generate simulated feedback
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
  
  // Sample reading passages for practice
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
  
  const [selectedPassage, setSelectedPassage] = useState(samplePassages[0]);
  
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
                <Card>
                  <CardHeader>
                    <CardTitle>Select a Reading Passage</CardTitle>
                    <CardDescription>
                      Choose one of the passages below to practice your reading
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {samplePassages.map((passage, index) => (
                      <div 
                        key={index}
                        className={`p-4 border rounded-md cursor-pointer transition-colors ${
                          selectedPassage.title === passage.title
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-200 hover:border-primary/50'
                        }`}
                        onClick={() => setSelectedPassage(passage)}
                      >
                        <h3 className="font-medium">{passage.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {passage.text.substring(0, 60)}...
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>{selectedPassage.title}</CardTitle>
                      <CardDescription>
                        Read this passage aloud when you're ready to record
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-gray-50 p-4 rounded-md">
                        <p className="text-gray-800 leading-relaxed">{selectedPassage.text}</p>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        onClick={toggleRecording}
                        className={`w-full ${isRecording ? 'bg-red-500 hover:bg-red-600' : ''}`}
                      >
                        <Mic className="h-4 w-4 mr-2" />
                        {isRecording ? 'Stop Recording' : 'Start Recording'}
                      </Button>
                    </CardFooter>
                  </Card>
                  
                  {isRecording && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Recording in Progress</CardTitle>
                        <CardDescription>
                          We're listening to your reading
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="animate-pulse flex justify-center py-4">
                          <div className="h-12 w-12 rounded-full bg-red-500 flex items-center justify-center">
                            <Mic className="h-6 w-6 text-white" />
                          </div>
                        </div>
                        
                        {transcription && (
                          <div className="bg-gray-50 p-4 rounded-md mt-4">
                            <p className="text-gray-800 italic">"{transcription}"</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                  
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
                <Card>
                  <CardHeader>
                    <CardTitle>Your Reading Analysis</CardTitle>
                    <CardDescription>
                      AI-powered feedback on your reading performance
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">Fluency</span>
                          <span className="text-sm font-medium">{analysis.fluency}%</span>
                        </div>
                        <Progress value={analysis.fluency} className="h-2" />
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">Pronunciation</span>
                          <span className="text-sm font-medium">{analysis.pronunciation}%</span>
                        </div>
                        <Progress value={analysis.pronunciation} className="h-2" />
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">Expression</span>
                          <span className="text-sm font-medium">{analysis.expression}%</span>
                        </div>
                        <Progress value={analysis.expression} className="h-2" />
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h3 className="font-medium mb-2">AI Feedback</h3>
                      <p className="text-gray-800">{analysis.feedback}</p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h3 className="font-medium mb-2">Your Reading</h3>
                      <p className="text-gray-800 italic">"{transcription}"</p>
                    </div>
                    
                    <div className="bg-edu-primary/10 p-4 rounded-md">
                      <h3 className="font-medium mb-2 text-edu-primary">Recommendations</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li className="text-sm">Practice reading aloud for 10 minutes each day</li>
                        <li className="text-sm">Pay attention to punctuation to improve your pacing</li>
                        <li className="text-sm">Record yourself reading and listen to identify areas for improvement</li>
                      </ul>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={() => toggleRecording()}>
                      Try Again
                    </Button>
                    <Button onClick={() => navigate('/dashboard')}>
                      Save & Return to Dashboard
                    </Button>
                  </CardFooter>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
};

export default VoiceReadingPage;
