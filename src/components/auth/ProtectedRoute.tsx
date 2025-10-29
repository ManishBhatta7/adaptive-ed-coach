import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import LoadingScreen from '@/components/loading/LoadingScreen';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requiredRole?: 'admin' | 'teacher' | 'student';
  redirectTo?: string;
}

const ProtectedRoute = ({ 
  children, 
  requireAuth = true, 
  requiredRole,
  redirectTo = '/login' 
}: ProtectedRouteProps) => {
  const { state } = useAppContext();
  const location = useLocation();
  const { isAuthenticated, currentUser, isLoading } = state;

  // Show loading while checking authentication status
  if (isLoading) {
    return <LoadingScreen message="Checking authentication..." fullScreen />;
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location.pathname }} replace />;
  }

  // If user is authenticated but doesn't have required role
  if (requireAuth && isAuthenticated && requiredRole && currentUser?.role !== requiredRole) {
    // Redirect to appropriate dashboard based on user role
    const dashboardPath = currentUser?.role === 'teacher' ? '/teacher-dashboard' : 
                         currentUser?.role === 'admin' ? '/admin' : '/dashboard';
    return <Navigate to={dashboardPath} replace />;
  }

  // If user is authenticated but trying to access auth pages, redirect to appropriate dashboard
  if (!requireAuth && isAuthenticated && (location.pathname === '/login' || location.pathname === '/signup')) {
    const dashboardPath = currentUser?.role === 'teacher' ? '/teacher-dashboard' : 
                         currentUser?.role === 'admin' ? '/admin' : '/dashboard';
    return <Navigate to={dashboardPath} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;