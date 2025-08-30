
import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';

interface UseReportProcessingProps {
  reportImage: File | null;
  onProcessComplete: (data: Record<string, any>) => void;
  setUploadError: (error: string | null) => void;
  state: any;
  navigate: any;
  toast: any;
  clearFile: () => void;
}

const useReportProcessing = ({
  reportImage,
  onProcessComplete,
  setUploadError,
  state,
  navigate,
  toast,
  clearFile,
}: UseReportProcessingProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const processReport = async () => {
    if (!reportImage) return;

    if (!state.isAuthenticated || !state.currentUser) {
      setUploadError('You must be logged in to process reports');
      toast?.({
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
      const userId = state.currentUser?.id;
      if (!userId) throw new Error('User ID not available');

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) throw new Error('No valid authentication session found');

      const formData = new FormData();
      formData.append('file', reportImage);
      formData.append('userId', userId);

      progressIntervalRef.current = setInterval(() => {
        setProgressValue(prev => {
          if (prev < 70) return prev + Math.random() * 10;
          else if (prev < 90) return prev + Math.random() * 3;
          else return prev + Math.random() * 1;
        });
      }, 300);

      const authToken = sessionData.session.access_token;
      const response = await fetch('https://gwarmogcmeehajnevbmi.supabase.co/functions/v1/analyze-report', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` },
        body: formData
      });

      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      setProgressValue(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process report');
      }

      const result = await response.json();
      onProcessComplete(result);
      toast?.({
        title: 'Report processed',
        description: 'Your report has been successfully analyzed',
        variant: 'default'
      });
      clearFile();
    } catch (error: any) {
      setUploadError(error.message || 'Error processing report');
      toast?.({
        title: 'Processing Error',
        description: error.message || 'Unable to process the report. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    progressValue,
    processReport,
  };
};

export default useReportProcessing;
