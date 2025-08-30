
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/AppContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import ReportImagePreview from './ReportImagePreview';
import ReportUploadInput from './ReportUploadInput';
import ProcessingProgress from './ProcessingProgress';
import useReportFileInput from '@/hooks/useReportFileInput';
import useReportProcessing from '@/hooks/useReportProcessing';

interface ReportUploaderProps {
  onProcessComplete: (data: Record<string, any>) => void;
  disabled?: boolean;
}

const ReportUploader = ({ onProcessComplete, disabled = false }: ReportUploaderProps) => {
  const { state } = useAppContext();
  const navigate = useNavigate();
  const { toast } = useToast();

  // File handling via custom hook
  const {
    reportImage,
    reportImageUrl,
    uploadError,
    handleFileChange,
    clearFile,
    setUploadError,
  } = useReportFileInput({ toast });

  // Report processing via custom hook
  const {
    isProcessing,
    progressValue,
    processReport,
  } = useReportProcessing({
    reportImage,
    onProcessComplete,
    setUploadError,
    state,
    navigate,
    toast,
    clearFile,
  });

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
              onRemove={clearFile}
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
            User not authenticated. Please{' '}
            <Button
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
            disabled={!state.isAuthenticated || disabled}
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

