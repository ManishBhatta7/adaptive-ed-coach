
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Upload, AlertCircle } from 'lucide-react';
import AnswerSheetFeedback from '@/components/answer-sheet/AnswerSheetFeedback';

const AnswerSheetPage = () => {
  const navigate = useNavigate();
  const { state } = useAppContext();
  const { isAuthenticated } = state;
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    content: string[];
    completed: boolean;
    score: number;
    strengths: string[];
    improvements: string[];
  } | null>(null);
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file type
    if (!file.type.match('image.*')) {
      setError('Please upload an image file (JPG, PNG, etc.)');
      return;
    }
    
    setSelectedFile(file);
    setError(null);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  const processAnswerSheet = () => {
    if (!selectedFile) return;
    
    setIsProcessing(true);
    setFeedback(null);
    
    // Mock OCR extraction - in a real app, this would use Tesseract OCR
    setTimeout(() => {
      // Mock extracted text from a student's answer sheet
      const mockExtractedText = 
        "The water cycle, also known as the hydrologic cycle, describes the continuous movement of water on, above, and below the surface of the Earth. Water can change states between liquid, vapor, and ice during this cycle.\n\n" +
        "The main steps of the water cycle are evaporation, condensation, precipitation, and collection. During evaporation, the sun heats up water from oceans, lakes, and rivers, turning it into water vapor. This water vapor rises into the atmosphere.\n\n" +
        "When water vapor in the air cools down, it changes back into liquid water through condensation. We can see this as clouds. When the water droplets in clouds become heavy enough, they fall back to Earth as precipitation (rain, snow, hail).\n\n" +
        "Finally, the water is collected in oceans, lakes, rivers, and underground, where the cycle begins again.";
      
      setExtractedText(mockExtractedText);
      
      // Simulate streaming AI feedback
      const mockFeedbackParts = [
        "Your answer provides a good overview of the water cycle.",
        "You've correctly identified the main processes: evaporation, condensation, precipitation, and collection.",
        "The explanation of evaporation is accurate and mentions the sun's role in heating water bodies.",
        "Your description of condensation forming clouds is well explained.",
        "The precipitation explanation covers different forms (rain, snow, hail).",
        "To improve, consider mentioning transpiration from plants as part of the evaporation process.",
        "You could also discuss infiltration when water seeps into the ground.",
        "Adding information about groundwater movement would make your answer more comprehensive.",
        "Overall, this is a solid explanation of the basic water cycle.",
      ];
      
      let feedbackIndex = 0;
      const fullFeedback: string[] = [];
      
      const feedbackInterval = setInterval(() => {
        if (feedbackIndex < mockFeedbackParts.length) {
          fullFeedback.push(mockFeedbackParts[feedbackIndex]);
          setFeedback({
            content: [...fullFeedback],
            completed: false,
            score: 0,
            strengths: [],
            improvements: []
          });
          feedbackIndex++;
        } else {
          clearInterval(feedbackInterval);
          setFeedback({
            content: fullFeedback,
            completed: true,
            score: 85,
            strengths: [
              "Clear explanation of the main water cycle processes",
              "Good description of how water changes states",
              "Logical sequence of events in the cycle"
            ],
            improvements: [
              "Include transpiration from plants",
              "Mention infiltration and groundwater processes",
              "Add more specific examples of how the water cycle impacts ecosystems"
            ]
          });
          setIsProcessing(false);
        }
      }, 800);
    }, 1500);
  };
  
  const resetForm = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setExtractedText('');
    setFeedback(null);
    setError(null);
  };

  return (
    <MainLayout>
      <div className="container px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Answer Sheet Feedback</h1>
            <p className="text-gray-600 mt-2">
              Upload your handwritten answer and get detailed AI feedback
            </p>
          </div>
          
          <Tabs defaultValue={feedback ? "feedback" : "upload"}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="upload">Upload Answer</TabsTrigger>
              <TabsTrigger value="feedback" disabled={!feedback}>AI Feedback</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Upload className="h-5 w-5 mr-2" />
                    Upload Answer Sheet
                  </CardTitle>
                  <CardDescription>
                    Upload a clear image of your handwritten answer for AI analysis
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      id="answer-sheet"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                    <label 
                      htmlFor="answer-sheet" 
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <FileText className="h-10 w-10 text-gray-400 mb-2" />
                      <span className="text-gray-700 font-medium">
                        {selectedFile ? selectedFile.name : 'Click to upload or drag and drop'}
                      </span>
                      <span className="text-sm text-gray-500 mt-1">
                        JPG, PNG, or other image formats
                      </span>
                    </label>
                  </div>
                  
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  {previewUrl && (
                    <div className="mt-4">
                      <p className="font-medium mb-2">Preview:</p>
                      <img 
                        src={previewUrl} 
                        alt="Answer sheet preview" 
                        className="max-h-[400px] mx-auto rounded-md border border-gray-200" 
                      />
                    </div>
                  )}
                  
                  <div className="flex justify-between pt-4">
                    <Button onClick={resetForm} variant="outline">
                      Reset
                    </Button>
                    <Button 
                      onClick={processAnswerSheet}
                      disabled={!selectedFile || isProcessing}
                    >
                      {isProcessing ? 'Processing...' : 'Analyze Answer'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {extractedText && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Extracted Text</CardTitle>
                    <CardDescription>
                      The text extracted from your handwritten answer
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 p-4 rounded-md whitespace-pre-line">
                      {extractedText}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="feedback">
              {feedback && (
                <AnswerSheetFeedback feedback={feedback} />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
};

export default AnswerSheetPage;
