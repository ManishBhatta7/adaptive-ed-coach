import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { StudentProfile, LearningStyle, SubjectArea } from '@/types';
import { useTestDataMode } from '@/hooks/useTestDataMode';

export const useAuth = () => {
  const [currentUser, setCurrentUser] = useState<StudentProfile | undefined>(undefined);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isTeacher, setIsTeacher] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { testMode } = useTestDataMode();

  // Initialize auth state and set up listener
  useEffect(() => {
    // If test mode is enabled and has a profile, use it instead of real auth
    if (testMode.enabled && testMode.studentProfile) {
      setCurrentUser(testMode.studentProfile);
      setIsAuthenticated(true);
      setIsTeacher(false);
      setIsLoading(false);
      console.log('Using test data profile:', testMode.studentProfile.name);
      return;
    }

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
  }, [testMode.enabled, testMode.studentProfile]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('Attempting login with email:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Login error:', error);
        // Don't throw here, let the calling component handle the error
        return false;
      }

      console.log('Login successful, session:', data.session);
      
      if (data.session) {
        setSession(data.session);
        // User profile fetch is handled by the onAuthStateChange listener
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (name: string, email: string, password: string, role: 'student' | 'teacher' = 'student', school?: string): Promise<boolean> => {
    try {
      console.log('Registering user with role:', role, 'and school:', school);
      
      const redirectUrl = `${window.location.origin}/dashboard`;

      // Store role, name, and school in user_metadata for the trigger function
      const metadata: any = { name, role };
      if (school) {
        metadata.school = school;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: metadata,
          // Skip email confirmation for development
          // Remove this in production if you want email verification
          emailRedirectTo: undefined
        }
      });

      if (error) {
        console.error('Registration error:', error);
        // Throw the error so it can be caught by the signup page
        throw error;
      }

      console.log('Registration successful:', data);
      console.log('Session created:', data.session ? 'Yes' : 'No');
      console.log('User created:', data.user ? 'Yes' : 'No');
      
      // If session is created, user is auto-logged in (email confirmation disabled)
      if (data.session) {
        console.log('User auto-logged in with session');
        setSession(data.session);
        setIsAuthenticated(true);
        
        // Wait for profile to be created by trigger
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Fetch the newly created profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
        
        if (profile) {
          console.log('Profile fetched:', profile);
          setCurrentUser(profile as StudentProfile);
          setIsTeacher(profile.role === 'teacher');
        } else {
          console.error('Profile not found:', profileError);
        }
        
        return true;
      }
      
      // Email confirmation required (shouldn't happen with autoConfirm)
      if (data.user && !data.session) {
        console.log('Email confirmation required for:', data.user.email);
        return true;
      }
      
      return true; // Account created successfully
    } catch (error) {
      console.error('Registration error:', error);
      // Re-throw the error so the component can handle it
      throw error;
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
    if (!currentUser || !session) {
      throw new Error('User must be authenticated to update profile');
    }
    
    try {
      // Log the payload for debugging
      console.log('Updating profile with payload:', profile);
      
      // Update the profile in the database
      const { data, error } = await supabase
        .from('profiles')
        .update(profile)
        .eq('id', currentUser.id)
        .select();
        
      if (error) {
        console.error('Supabase error updating profile:', {
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw new Error(`Failed to update profile: ${error.message}`);
      }
      
      if (!data || data.length === 0) {
        throw new Error('No profile data returned after update');
      }
      
      // Update the local state with the returned data
      setCurrentUser({ ...currentUser, ...data[0] });
      
      console.log('Profile updated successfully');
    } catch (error) {
      console.error('Error in updateUserProfile:', error);
      throw error;
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
