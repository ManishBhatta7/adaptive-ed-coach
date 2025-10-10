import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';

/**
 * This middleware handles onboarding flow and redirects
 */
export function useOnboardingMiddleware() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useAppContext();
  const { isAuthenticated, currentUser } = state;

  useEffect(() => {
    const publicPaths = ['/login', '/signup', '/', '/about', '/privacy', '/terms'];
    const isPublicPath = publicPaths.includes(location.pathname);

    // If not authenticated and trying to access a protected route
    if (!isAuthenticated && !isPublicPath) {
      navigate('/login');
      return;
    }

    // If authenticated but no onboarding data
    if (isAuthenticated && currentUser && !currentUser.preferences) {
      // Don't redirect if already on onboarding or trying to logout
      if (location.pathname !== '/onboarding' && location.pathname !== '/logout') {
        navigate('/onboarding');
      }
      return;
    }

    // If trying to access onboarding when already completed
    if (location.pathname === '/onboarding' && currentUser?.preferences) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, currentUser, location.pathname, navigate]);
}