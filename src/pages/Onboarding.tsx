import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { state } = useAppContext();

  // Redirect if not authenticated
  useEffect(() => {
    if (!state.isAuthenticated) {
      navigate('/login');
    }
    
    // Check if onboarding is already completed
    const onboarding = localStorage.getItem('onboarding');
    if (onboarding) {
      navigate('/dashboard');
    }
  }, [state.isAuthenticated, navigate]);

  return <OnboardingFlow />;
}