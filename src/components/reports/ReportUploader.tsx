
import { useState } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { useAppContext } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';

interface ReportUploaderProps {
  onProcessComplete: (data: Record<string, any>) => void;
}

const ReportUploader = ({ onProcessComplete }: ReportUploaderProps) => {
  const { toast } = useToast();
  const { state } = useAppContext();
  const [reportImage, setReportImage] = useState<File | null>(null);
  const [reportImageUrl, setReportImageUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadError(null);
      
      if (!file.type.match('image.*')) {
        setUploadError('Please upload an image file (JPEG, PNG)');
        toast({
          title: 'Invalid file type',
          description: 'Please upload an image file (JPEG, PNG)',
          variant: 'destructive'
        });
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setUploadError('Maximum file size is 5MB');
        toast({
          title: 'File too large',
          description: 'Maximum file size is 5MB',
          variant: 'destructive'
        });
        return;
      }
      
      setReportImage(file);
      setReportImageUrl(URL.createObjectURL(file));
    }
  };
  
  const processReport = async () => {
    if (!reportImage) return;
    
    setIsProcessing(true);
    setProgressValue(0);
    setUploadError(null);
    
    try {
      // Get the current user's ID
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const formData = new FormData();
      formData.append('file', reportImage);
      formData.append('userId', userId);

      // Create a progress updater that simulates the analysis process
      const progressInterval = setInterval(() => {
        setProgressValue(prev => {
          // More realistic progression that slows down at 70%
          if (prev < 70) {
            return prev + Math.random() * 10;
          } else if (prev < 90) {
            return prev + Math.random() * 3;
          } else {
            return prev + Math.random() * 1;
          }
        });
      }, 300);

      // Get the Supabase JWT token for authentication
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      const authToken = currentSession?.access_token;
      
      if (!authToken) {
        throw new Error('Authentication token not available');
      }

      // Call the Supabase Edge Function with authentication
      const response = await fetch('/functions/v1/analyze-report', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: formData
      });

      clearInterval(progressInterval);
      setProgressValue(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process report');
      }

      const result = await response.json();
      
      onProcessComplete(result);
      
      toast({
        title: 'Report processed',
        description: 'Your report has been successfully analyzed',
        variant: 'default'
      });

    } catch (error) {
      console.error('Report processing error:', error);
      
      setUploadError(error.message || 'Error processing report');
      
      toast({
        title: 'Processing Error',
        description: error.message || 'Unable to process the report. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Report Card</CardTitle>
        <CardDescription>
          Take a clear photo of your report card or upload an existing image
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 mb-4">
          {reportImageUrl ? (
            <div className="w-full">
              <img 
                src={reportImageUrl} 
                alt="Report Card Preview" 
                className="max-h-64 mx-auto object-contain rounded-md shadow-sm" 
              />
              <Button 
                variant="ghost" 
                size="sm" 
                className="mt-4"
                onClick={() => {
                  setReportImage(null);
                  setReportImageUrl(null);
                  setUploadError(null);
                }}
              >
                Remove image
              </Button>
            </div>
          ) : (
            <>
              <Upload className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-sm text-gray-500 text-center mb-2">
                Drag and drop your image here, or click to browse
              </p>
              <p className="text-xs text-gray-400 text-center mb-4">
                Supports JPEG, PNG • Max size 5MB
              </p>
              <Button
                variant="outline"
                onClick={() => document.getElementById('report-upload')?.click()}
              >
                Select File
              </Button>
            </>
          )}
          <input
            id="report-upload"
            type="file"
            className="hidden"
            accept="image/jpeg,image/png"
            onChange={handleFileChange}
          />
        </div>
        
        {uploadError && (
          <div className="text-red-500 text-sm mb-4 text-center">
            {uploadError}
          </div>
        )}
        
        {reportImage && !isProcessing && (
          <Button 
            className="w-full" 
            onClick={processReport}
          >
            Process Report Card
          </Button>
        )}
        
        {isProcessing && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Processing...</span>
              <span>{Math.round(progressValue)}%</span>
            </div>
            <Progress value={progressValue} className="h-2" />
            <p className="text-xs text-center text-gray-500 mt-2">
              Our AI is analyzing your report card
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReportUploader;
