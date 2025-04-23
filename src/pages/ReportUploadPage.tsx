
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import MainLayout from '@/components/layout/MainLayout';
import ReportUploader from '@/components/reports/ReportUploader';
import ReportResults from '@/components/reports/ReportResults';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const ReportUploadPage = () => {
  const navigate = useNavigate();
  const { state } = useAppContext();
  const { isAuthenticated } = state;
  const [extractedData, setExtractedData] = useState<Record<string, any> | null>(null);
  
  useEffect(() => {
    // We'll let the component render even if not authenticated
    // But will show a login prompt instead of redirecting immediately
    // This allows the user to see what the feature offers before logging in
  }, []);

  const handleLogin = () => {
    navigate('/login', { state: { returnTo: '/report-upload' } });
  };

  return (
    <MainLayout>
      <div className="container px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Report Card Analysis</h1>
            <p className="text-gray-600 mt-2">
              Upload a photo of your report card to automatically extract and analyze your grades
            </p>
          </div>
          
          {!isAuthenticated ? (
            <Alert className="mb-6">
              <AlertTitle>Authentication Required</AlertTitle>
              <AlertDescription className="flex flex-col gap-4">
                <p>You need to be logged in to use the report card analysis feature.</p>
                <Button onClick={handleLogin} className="w-fit">
                  Log in to continue
                </Button>
              </AlertDescription>
            </Alert>
          ) : null}
          
          <div className="grid md:grid-cols-2 gap-6">
            <ReportUploader onProcessComplete={setExtractedData} />
            <ReportResults data={extractedData} />
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ReportUploadPage;
