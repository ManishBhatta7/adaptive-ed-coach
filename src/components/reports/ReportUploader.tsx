import { useState } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { useAppContext } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import ReportImagePreview from './ReportImagePreview';
import ReportUploadInput from './ReportUploadInput';
import ProcessingProgress from './ProcessingProgress';

interface ReportUploaderProps {
  onProcessComplete: (data: Record<string, any>) => void;
}

const ReportUploader = ({ onProcessComplete }: ReportUploaderProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
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
    
    // Check authentication first
    if (!state.isAuthenticated || !state.currentUser) {
      setUploadError('You must be logged in to process reports');
      toast({
        title: 'Authentication required',
        description: 'Please log in to process report cards',
        variant: 'destructive'
      });
      navigate('/login', { state: { returnTo: '/report-upload' } });
      return;
    }
    
    setIsProcessing(true);
    setProgressValue(0);
    setUploadError(null);
    
    try {
      // Get the current user's ID directly from the state
      const userId = state.currentUser?.id;
      
      if (!userId) {
        throw new Error('User ID not available');
      }

      // First check if there's a valid session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData.session) {
        throw new Error('No valid authentication session found');
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
      const authToken = sessionData.session.access_token;
      
      console.log('Auth token available:', !!authToken);
      
      // Call the Supabase Edge Function with authentication
      const response = await fetch('https://gwarmogcmeehajnevbmi.supabase.co/functions/v1/analyze-report', {
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
            <ReportImagePreview 
              imageUrl={reportImageUrl}
              onRemove={() => {
                setReportImage(null);
                setReportImageUrl(null);
                setUploadError(null);
              }}
            />
          ) : (
            <ReportUploadInput onSelectFile={handleFileChange} />
          )}
        </div>
        
        {uploadError && (
          <div className="text-red-500 text-sm mb-4 text-center">
            {uploadError}
          </div>
        )}
        
        {!state.isAuthenticated && (
          <div className="text-amber-500 text-sm mb-4 text-center">
            User not authenticated. Please <Button 
              variant="link" 
              className="p-0 h-auto text-amber-600" 
              onClick={() => navigate('/login', { state: { returnTo: '/report-upload' } })}
            >
              log in
            </Button> to process reports.
          </div>
        )}
        
        {reportImage && !isProcessing && (
          <Button 
            className="w-full" 
            onClick={processReport}
            disabled={!state.isAuthenticated}
          >
            Process Report Card
          </Button>
        )}
        
        {isProcessing && (
          <ProcessingProgress progressValue={progressValue} />
        )}
      </CardContent>
    </Card>
  );
};

export default ReportUploader;
