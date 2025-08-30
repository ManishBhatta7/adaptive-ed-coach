import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';

const GeminiTest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isChatting, setIsChatting] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [testResult, setTestResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);
  const [chatResult, setChatResult] = useState<{ success: boolean; response?: string; error?: string } | null>(null);

  const testGemini = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-gemini');
      
      if (error) throw error;
      setTestResult(data);
    } catch (error) {
      console.error('Error testing Gemini:', error);
      setTestResult({
        success: false,
        error: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const chatWithGemini = async () => {
    if (!prompt.trim()) return;
    
    setIsChatting(true);
    setChatResult(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: { 
          prompt: prompt.trim(),
          systemPrompt: "You are a helpful educational AI assistant."
        }
      });
      
      if (error) throw error;
      setChatResult(data);
    } catch (error) {
      console.error('Error chatting with Gemini:', error);
      setChatResult({
        success: false,
        error: error.message
      });
    } finally {
      setIsChatting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="w-full max-w-xl mx-auto">
        <CardHeader>
          <CardTitle>Test Gemini Flash API</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={testGemini} 
            disabled={isLoading}
          >
            {isLoading ? 'Testing...' : 'Test Gemini Connection'}
          </Button>

          {testResult && (
            <Alert variant={testResult.success ? "default" : "destructive"}>
              <AlertTitle>
                {testResult.success ? 'Success!' : 'Error'}
              </AlertTitle>
              <AlertDescription>
                {testResult.success ? testResult.message : testResult.error}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Chat with Gemini Flash</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Ask Gemini anything..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
          />
          
          <Button 
            onClick={chatWithGemini} 
            disabled={isChatting || !prompt.trim()}
          >
            {isChatting ? 'Generating...' : 'Send to Gemini'}
          </Button>

          {chatResult && (
            <Alert variant={chatResult.success ? "default" : "destructive"}>
              <AlertTitle>
                {chatResult.success ? 'Gemini Response:' : 'Error'}
              </AlertTitle>
              <AlertDescription className="whitespace-pre-wrap">
                {chatResult.success ? chatResult.response : chatResult.error}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GeminiTest;