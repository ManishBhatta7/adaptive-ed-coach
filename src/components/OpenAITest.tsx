
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';

const OpenAITest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);

  const testOpenAI = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-openai');
      
      if (error) throw error;
      setResult(data);
    } catch (error) {
      console.error('Error testing OpenAI:', error);
      setResult({
        success: false,
        error: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader>
        <CardTitle>Test OpenAI Integration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={testOpenAI} 
          disabled={isLoading}
        >
          {isLoading ? 'Testing...' : 'Test OpenAI Connection'}
        </Button>

        {result && (
          <Alert variant={result.success ? "default" : "destructive"}>
            <AlertTitle>
              {result.success ? 'Success!' : 'Error'}
            </AlertTitle>
            <AlertDescription>
              {result.success ? result.message : result.error}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default OpenAITest;
