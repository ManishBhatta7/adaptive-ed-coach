
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import MainLayout from '@/components/layout/MainLayout';
import ReportUploader from '@/components/reports/ReportUploader';
import ReportResults from '@/components/reports/ReportResults';

const ReportUploadPage = () => {
  const navigate = useNavigate();
  const { state } = useAppContext();
  const { isAuthenticated } = state;
  const [extractedData, setExtractedData] = useState<Record<string, any> | null>(null);
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

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
