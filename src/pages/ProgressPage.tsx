import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '@/components/layout/PageLayout';

const ProgressPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the new AI Tutor page
    navigate('/ai-tutor', { replace: true });
  }, [navigate]);

  return (
    <PageLayout title="Redirecting..." subtitle="Taking you to AI Tutor">
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to AI Tutor...</p>
        </div>
      </div>
    </PageLayout>
  );
};

export default ProgressPage;