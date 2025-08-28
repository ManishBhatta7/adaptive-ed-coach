
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Edit, Upload, FileImage } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import EssayFeedback from '@/components/essay-checker/EssayFeedback';

const EssayCheckerPage = () => {
  const navigate = useNavigate();
  const { state } = useAppContext();
  const { isAuthenticated } = state;
  
  const [essay, setEssay] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<null | {
    overall: string;
    grammar: string;
    structure: string;
    creativity: string;
    scores: {
      clarity: number;
      flow: number;
      expression: number;
    };
    suggestions: string[];
  }>(null);
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }
  
  const handleEssayChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEssay(e.target.value);
  };
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file type
    if (!file.type.match('image.*')) {
      setOcrError('Please upload an image file (JPG, PNG, etc.)');
      return;
    }
    
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setOcrError('File size must be less than 10MB');
      return;
    }
    
    setSelectedImage(file);
    setOcrError(null);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  const processImageWithOCR = () => {
    if (!selectedImage) return;
    
    setIsProcessingOCR(true);
    setOcrError(null);
    
    // Mock OCR processing - in a real implementation, this would use Tesseract.js or similar
    setTimeout(() => {
      // Simulate OCR extraction with a sample essay text
      const mockExtractedText = `The Importance of Personal Responsibility

Personal responsibility is a fundamental principle that shapes our character and determines our success in life. It involves taking ownership of our actions, decisions, and their consequences, rather than blaming external circumstances or other people for our failures.

When we embrace personal responsibility, we gain control over our lives. Instead of being victims of circumstance, we become active agents in shaping our destiny. This mindset shift is crucial because it empowers us to make positive changes and improvements in our lives.

Furthermore, personal responsibility builds trust and respect in our relationships. When others know they can count on us to follow through on our commitments and own up to our mistakes, they are more likely to trust us with important tasks and responsibilities.

However, taking personal responsibility is not always easy. It requires courage to admit when we are wrong and discipline to make difficult changes. It also means giving up the comfort of blaming others for our problems.

In conclusion, personal responsibility is essential for personal growth, healthy relationships, and success in all areas of life. By embracing this principle, we can transform ourselves and positively impact those around us.`;
      
      setEssay(mockExtractedText);
      setIsProcessingOCR(false);
    }, 3000);
  };
  
  // Enhanced feedback generation based on Jordan Peterson's essay writing principles
  const generateJordanPetersonFeedback = (essayText: string) => {
    const wordCount = essayText.split(/\s+/).length;
    const paragraphCount = essayText.split(/\n\s*\n/).length;
    const sentences = essayText.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Jordan Peterson's key essay principles
    const hasThesis = /\b(argue|claim|believe|contend|assert)\b/i.test(essayText);
    const hasEvidence = /\b(because|since|for example|research shows|studies indicate)\b/i.test(essayText);
    const hasCounterargument = /\b(however|although|despite|on the other hand|critics argue)\b/i.test(essayText);
    const hasConclusion = /\b(in conclusion|therefore|thus|in summary|finally)\b/i.test(essayText);
    
    return {
      overall: generateOverallFeedback(essayText, hasThesis, hasEvidence, hasCounterargument, hasConclusion),
      grammar: generateGrammarFeedback(sentences),
      structure: generateStructureFeedback(paragraphCount, hasThesis, hasConclusion),
      creativity: generateCreativityFeedback(essayText, wordCount),
      scores: {
        clarity: calculateClarityScore(sentences, hasThesis),
        flow: calculateFlowScore(essayText, paragraphCount),
        expression: calculateExpressionScore(essayText, wordCount)
      },
      suggestions: generateJordanPetersonSuggestions(essayText, hasThesis, hasEvidence, hasCounterargument)
    };
  };
  
  const generateOverallFeedback = (text: string, hasThesis: boolean, hasEvidence: boolean, hasCounterargument: boolean, hasConclusion: boolean) => {
    let feedback = "Your essay demonstrates ";
    
    if (hasThesis && hasEvidence && hasConclusion) {
      feedback += "a solid understanding of argumentative structure. You've presented a clear thesis, supported it with evidence, and provided a conclusion. ";
    } else {
      feedback += "potential but needs strengthening in key areas. ";
    }
    
    if (hasCounterargument) {
      feedback += "Your acknowledgment of counterarguments shows intellectual honesty and strengthens your position. ";
    } else {
      feedback += "Consider addressing potential counterarguments to demonstrate intellectual rigor. ";
    }
    
    feedback += "Remember Jordan Peterson's advice: 'Be precise in your speech' - ensure every sentence serves your argument.";
    
    return feedback;
  };
  
  const generateGrammarFeedback = (sentences: string[]) => {
    const avgSentenceLength = sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentences.length;
    
    if (avgSentenceLength > 25) {
      return "Your sentences tend to be quite long. Peterson advocates for clarity - consider breaking complex sentences into shorter, more digestible parts while maintaining sophistication.";
    } else if (avgSentenceLength < 10) {
      return "Your sentences are quite short. While clarity is important, you can develop more complex ideas by combining related thoughts into more substantial sentences.";
    } else {
      return "Your sentence structure shows good balance. Continue to vary sentence length to maintain reader engagement while ensuring clarity of thought.";
    }
  };
  
  const generateStructureFeedback = (paragraphCount: number, hasThesis: boolean, hasConclusion: boolean) => {
    let feedback = "";
    
    if (paragraphCount < 3) {
      feedback += "Your essay needs more paragraphs to fully develop your ideas. Peterson emphasizes the importance of thorough exploration of concepts. ";
    } else if (paragraphCount > 7) {
      feedback += "Consider consolidating some paragraphs to maintain focus and coherence. ";
    }
    
    if (!hasThesis) {
      feedback += "Establish a clear thesis statement early in your essay. Peterson teaches that you must know what you're arguing before you can argue it effectively. ";
    }
    
    if (!hasConclusion) {
      feedback += "Your essay needs a stronger conclusion that ties your arguments together and reinforces your main point.";
    } else {
      feedback += "Your conclusion helps reinforce your main arguments effectively.";
    }
    
    return feedback;
  };
  
  const generateCreativityFeedback = (text: string, wordCount: number) => {
    const uniqueWords = new Set(text.toLowerCase().match(/\b\w+\b/g) || []).size;
    const vocabularyRichness = uniqueWords / wordCount;
    
    if (vocabularyRichness > 0.6) {
      return "Your vocabulary demonstrates good range and precision. Peterson values precise language - continue to choose words that convey exactly what you mean.";
    } else if (vocabularyRichness < 0.4) {
      return "Consider expanding your vocabulary to express ideas more precisely. Peterson emphasizes that imprecise language leads to imprecise thinking.";
    } else {
      return "Your word choice shows decent variety. Challenge yourself to find more precise terms that capture the nuances of your ideas.";
    }
  };
  
  const calculateClarityScore = (sentences: string[], hasThesis: boolean) => {
    let score = 60;
    if (hasThesis) score += 20;
    if (sentences.length > 5) score += 10;
    if (sentences.every(s => s.length < 200)) score += 10;
    return Math.min(score, 100);
  };
  
  const calculateFlowScore = (text: string, paragraphCount: number) => {
    let score = 60;
    if (paragraphCount >= 3 && paragraphCount <= 6) score += 20;
    if (/\b(furthermore|moreover|however|therefore|consequently)\b/i.test(text)) score += 15;
    if (/\b(first|second|finally|in addition)\b/i.test(text)) score += 5;
    return Math.min(score, 100);
  };
  
  const calculateExpressionScore = (text: string, wordCount: number) => {
    let score = 60;
    if (wordCount > 200) score += 15;
    if (wordCount > 400) score += 10;
    if (/\b(metaphor|analogy|example|illustrate)\b/i.test(text)) score += 15;
    return Math.min(score, 100);
  };
  
  const generateJordanPetersonSuggestions = (text: string, hasThesis: boolean, hasEvidence: boolean, hasCounterargument: boolean) => {
    const suggestions = [];
    
    if (!hasThesis) {
      suggestions.push("Establish a clear, arguable thesis statement. Peterson says: 'If you can't say it clearly, you don't understand it yourself.'");
    }
    
    if (!hasEvidence) {
      suggestions.push("Support your claims with specific evidence, examples, or reasoning. Peterson emphasizes backing up assertions with concrete support.");
    }
    
    if (!hasCounterargument) {
      suggestions.push("Address potential counterarguments to strengthen your position. Peterson advocates for intellectual honesty and considering opposing viewpoints.");
    }
    
    suggestions.push("Read your essay aloud to catch awkward phrasing. Peterson recommends this practice for improving clarity and flow.");
    
    suggestions.push("Ensure each paragraph serves your main argument. Peterson teaches that every element should contribute to your central point.");
    
    if (text.length < 500) {
      suggestions.push("Develop your ideas more thoroughly. Peterson believes in exploring concepts deeply rather than superficially.");
    }
    
    return suggestions;
  };
  
  const analyzeEssay = () => {
    if (!essay.trim()) return;
    
    setIsAnalyzing(true);
    
    setTimeout(() => {
      const mockFeedback = generateJordanPetersonFeedback(essay);
      
      setFeedback(mockFeedback);
      setIsAnalyzing(false);
    }, 2000);
  };
  
  const handleFixEssay = () => {
    if (!essay || !feedback) return;
    
    // In a real implementation, this would use an AI to suggest improvements
    const improvedEssay = essay.replace(/\b(very|really)\b/g, 'significantly')
      .replace(/\b(good)\b/g, 'excellent')
      .replace(/\b(bad)\b/g, 'problematic')
      .replace(/\bi think\b/gi, 'I believe')
      .replace(/\ba lot\b/gi, 'considerably');
    
    setEssay(improvedEssay);
  };

  return (
    <MainLayout>
      <div className="container px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Essay Writing Checker</h1>
            <p className="text-gray-600 mt-2">
              Improve your writing skills with our AI-powered essay analysis
            </p>
          </div>
          
          <Tabs defaultValue={feedback ? "feedback" : "write"}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="write">Write Essay</TabsTrigger>
              <TabsTrigger value="feedback" disabled={!feedback}>Feedback</TabsTrigger>
            </TabsList>
            
            <TabsContent value="write">
              <Card>
                <CardHeader>
                  <CardTitle>Write, Paste, or Upload Your Essay</CardTitle>
                  <CardDescription>
                    Our AI will analyze your essay using Jordan Peterson's essay writing principles and provide targeted feedback.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Tabs defaultValue="text" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="text">Type/Paste Text</TabsTrigger>
                      <TabsTrigger value="image">Upload Image</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="text" className="space-y-4">
                      <Textarea 
                        placeholder="Type or paste your essay here..." 
                        className="min-h-[300px]" 
                        value={essay}
                        onChange={handleEssayChange}
                      />
                    </TabsContent>
                    
                    <TabsContent value="image" className="space-y-4">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <input
                          type="file"
                          id="essay-image"
                          className="hidden"
                          accept="image/*"
                          onChange={handleImageUpload}
                        />
                        <label htmlFor="essay-image" className="cursor-pointer flex flex-col items-center">
                          <FileImage className="h-10 w-10 text-gray-400 mb-2" />
                          <span className="text-gray-700 font-medium">
                            {selectedImage ? selectedImage.name : 'Click to upload or drag and drop'}
                          </span>
                          <span className="text-sm text-gray-500 mt-1">
                            JPG, PNG, or other image formats (max 10MB)
                          </span>
                        </label>
                      </div>
                      
                      {ocrError && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Error</AlertTitle>
                          <AlertDescription>{ocrError}</AlertDescription>
                        </Alert>
                      )}
                      
                      {imagePreview && (
                        <div className="mt-4">
                          <p className="font-medium mb-2">Preview:</p>
                          <img 
                            src={imagePreview} 
                            alt="Essay preview" 
                            className="max-h-[300px] mx-auto rounded-md border border-gray-200" 
                          />
                          <div className="flex justify-center mt-4">
                            <Button 
                              onClick={processImageWithOCR}
                              disabled={isProcessingOCR}
                              className="w-full max-w-xs"
                            >
                              {isProcessingOCR ? 'Processing OCR...' : 'Extract Text from Image'}
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {essay && (
                        <div className="mt-4">
                          <p className="font-medium mb-2">Extracted Text:</p>
                          <Textarea 
                            value={essay}
                            onChange={handleEssayChange}
                            className="min-h-[200px]"
                            placeholder="Extracted text will appear here..."
                          />
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                  
                  <div className="flex justify-between">
                    <Button onClick={() => setEssay('')} variant="outline">
                      Clear
                    </Button>
                    <Button 
                      onClick={analyzeEssay} 
                      disabled={!essay.trim() || isAnalyzing || isProcessingOCR}
                    >
                      {isAnalyzing ? 'Analyzing...' : 'Analyze Essay'}
                    </Button>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-md">
                    <h3 className="font-medium text-blue-900 mb-2">Jordan Peterson's Essay Writing Principles</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Be precise in your speech and writing</li>
                      <li>• Make a clear, arguable thesis statement</li>
                      <li>• Support claims with evidence and reasoning</li>
                      <li>• Address counterarguments honestly</li>
                      <li>• Structure your thoughts logically</li>
                      <li>• Write to think, not just to communicate</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="feedback">
              {feedback && (
                <>
                  <EssayFeedback feedback={feedback} />
                  
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Edit className="h-5 w-5 mr-2" />
                        Fix-It Mode
                      </CardTitle>
                      <CardDescription>
                        Let our AI suggest improvements to your essay based on the feedback.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button onClick={handleFixEssay} className="w-full">
                        Suggest Improvements
                      </Button>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
};

export default EssayCheckerPage;
