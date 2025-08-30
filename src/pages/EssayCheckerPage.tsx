
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Edit } from 'lucide-react';
import EssayFeedback from '@/components/essay-checker/EssayFeedback';

const EssayCheckerPage = () => {
  const navigate = useNavigate();
  const { state } = useAppContext();
  const { isAuthenticated } = state;
  
  const [essay, setEssay] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
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
  
  const analyzeEssay = () => {
    if (!essay.trim()) return;
    
    setIsAnalyzing(true);
    
    // Mock API call - in a real implementation, this would call an AI service
    setTimeout(() => {
      const mockFeedback = {
        overall: "Your essay shows good understanding of the topic with some well-structured arguments.",
        grammar: "There are a few grammatical errors and typos that need attention.",
        structure: "Your introduction is effective, but the conclusion could be stronger to tie your arguments together.",
        creativity: "You present some original ideas, but could expand on them with more specific examples.",
        scores: {
          clarity: Math.floor(Math.random() * 31) + 60,
          flow: Math.floor(Math.random() * 31) + 60,
          expression: Math.floor(Math.random() * 31) + 60
        },
        suggestions: [
          "Consider using more transition words between paragraphs to improve flow.",
          "Try to vary your sentence structure more for better readability.",
          "Add more specific examples to support your main arguments.",
          "Check for consistency in tense throughout your essay.",
          "Strengthen your conclusion by restating your thesis in a new way."
        ]
      };
      
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
                  <CardTitle>Write or Paste Your Essay</CardTitle>
                  <CardDescription>
                    Our AI will analyze your essay and provide constructive feedback on grammar, structure, and creativity.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea 
                    placeholder="Type or paste your essay here..." 
                    className="min-h-[300px]" 
                    value={essay}
                    onChange={handleEssayChange}
                  />
                  
                  <div className="flex justify-between">
                    <Button onClick={() => setEssay('')} variant="outline">
                      Clear
                    </Button>
                    <Button 
                      onClick={analyzeEssay} 
                      disabled={!essay.trim() || isAnalyzing}
                    >
                      {isAnalyzing ? 'Analyzing...' : 'Analyze Essay'}
                    </Button>
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
