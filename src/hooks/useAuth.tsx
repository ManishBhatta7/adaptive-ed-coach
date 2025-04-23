
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { StudentProfile } from '@/types';

export const useAuth = () => {
  const [currentUser, setCurrentUser] = useState<StudentProfile | undefined>(undefined);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isTeacher, setIsTeacher] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state and set up listener
  useEffect(() => {
    // First set up the auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log('Auth state changed:', event, currentSession?.user?.id);
        setSession(currentSession);
        
        if (currentSession?.user) {
          setIsAuthenticated(true);
          
          // Use setTimeout to avoid potential deadlocks with Supabase auth
          setTimeout(async () => {
            try {
              // Get the user profile data
              const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', currentSession.user.id)
                .single();
                
              if (error) {
                console.error('Error fetching profile:', error);
                return;
              }
              
              if (profile) {
                setCurrentUser(profile as StudentProfile);
                setIsTeacher(profile.role === 'teacher');
                
                // Update the last_active field in the database
                const { error: updateError } = await supabase
                  .from('profiles')
                  .update({ last_active: new Date().toISOString() })
                  .eq('id', currentSession.user.id);
                  
                if (updateError) {
                  console.error('Error updating last_active:', updateError);
                }
              }
            } catch (err) {
              console.error('Error in auth state change handler:', err);
            } finally {
              setIsLoading(false);
            }
          }, 0);
        } else {
          setIsAuthenticated(false);
          setCurrentUser(undefined);
          setIsTeacher(false);
          setIsLoading(false);
        }
      }
    );

    // Then check for an existing session
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        const { data: { session: initialSession } } = await supabase.auth.getSession();

        if (initialSession?.user) {
          setSession(initialSession);
          setIsAuthenticated(true);
          
          // Fetch the user profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', initialSession.user.id)
            .single();
            
          if (profile) {
            setCurrentUser(profile as StudentProfile);
            setIsTeacher(profile.role === 'teacher');
            
            // Update last_active
            await supabase
              .from('profiles')
              .update({ last_active: new Date().toISOString() })
              .eq('id', initialSession.user.id);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Clean up the subscription when the component unmounts
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Mock authentication for development
  const mockAuth = (email: string, role: string = 'student') => {
    console.warn('Using mock authentication (no Supabase credentials)');
    const mockUser: StudentProfile = {
      id: 'mock-user-id',
      name: email.split('@')[0],
      email,
      avatar: '/placeholder.svg',
      joinedAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      role: role as 'student' | 'teacher',
      primaryLearningStyle: 'visual',
      secondaryLearningStyle: 'auditory',
      learningStyleStrengths: { visual: 80, auditory: 60, reading: 40, kinesthetic: 30 },
      performances: [
        {
          id: 'perf-1',
          title: 'Math Quiz',
          score: 85,
          maxScore: 100, 
          feedback: 'Good work on algebra!',
          submittedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          type: 'quiz'
        },
        {
          id: 'perf-2',
          title: 'Science Report',
          score: 90,
          maxScore: 100,
          feedback: 'Excellent analysis!',
          submittedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          type: 'assignment'
        }
      ]
    };
    setCurrentUser(mockUser);
    setIsAuthenticated(true);
    setIsTeacher(role === 'teacher');
    setIsLoading(false);
    return mockUser;
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // For development when no Supabase credentials are available
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        mockAuth(email, email.includes('teacher') ? 'teacher' : 'student');
        return true;
      }

      console.log('Attempting login with email:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Login error:', error);
        throw error;
      }

      console.log('Login successful, session:', data.session);
      
      if (data.session) {
        setSession(data.session);
        // Actual user profile fetch is handled by the onAuthStateChange listener
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (name: string, email: string, password: string, role: 'student' | 'teacher' = 'student'): Promise<boolean> => {
    try {
      // For development when no Supabase credentials are available
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        const mockUser = mockAuth(email, role);
        // Update the name since register provides it
        setCurrentUser({...mockUser, name});
        return true;
      }

      console.log('Registering user with role:', role);

      // Store role in user_metadata, so trigger/SQL works correctly
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, role }
        }
      });

      if (error) {
        console.error('Registration error:', error);
        throw error;
      }

      console.log('Registration successful:', data);
      
      if (data.session) {
        setSession(data.session);
        // Actual user profile fetch is handled by the onAuthStateChange listener
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setSession(null);
      setCurrentUser(undefined);
      setIsAuthenticated(false);
      setIsTeacher(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateUserProfile = async (profile: Partial<StudentProfile>) => {
    if (!currentUser || !session) return;
    
    try {
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        // For development with mock data
        setCurrentUser({ ...currentUser, ...profile });
        return;
      }
      
      // Update the profile in the database
      const { error } = await supabase
        .from('profiles')
        .update(profile)
        .eq('id', currentUser.id);
        
      if (error) {
        console.error('Error updating profile:', error);
        return;
      }
      
      // Update the local state
      setCurrentUser({ ...currentUser, ...profile });
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  return {
    currentUser,
    session,
    isAuthenticated,
    isTeacher,
    isLoading,
    login,
    register,
    logout,
    updateUserProfile
  };
};
