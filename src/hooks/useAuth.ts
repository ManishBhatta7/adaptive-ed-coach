
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { StudentProfile } from '@/types';

export const useAuth = () => {
  const [currentUser, setCurrentUser] = useState<StudentProfile | undefined>(undefined);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isTeacher, setIsTeacher] = useState(false);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // For development when no Supabase credentials are available
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        console.warn('Using mock authentication (no Supabase credentials)');
        // Use a mock user for testing
        const mockUser: StudentProfile = {
          id: 'mock-user-id',
          name: 'Test User',
          email,
          avatar: '/placeholder.svg',
          joinedAt: new Date().toISOString(),
          lastActive: new Date().toISOString(),
          performances: []
        };
        setCurrentUser(mockUser);
        setIsAuthenticated(true);
        setIsTeacher(email.includes('teacher'));
        return true;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      if (data.session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.session.user.id)
          .single();

        if (profile) {
          setCurrentUser(profile as StudentProfile);
          setIsAuthenticated(true);
          setIsTeacher(profile.role === 'teacher');
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (name: string, email: string, password: string, role: 'student' | 'teacher' = 'student'): Promise<boolean> => {
    try {
      // Store role in user_metadata, so trigger/SQL works correctly
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, role }
        }
      });

      if (error) throw error;

      if (data.user) {
        // let database trigger set up the profiles row, so fetch it
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profile) {
          setCurrentUser(profile as StudentProfile);
          setIsAuthenticated(true);
          setIsTeacher(role === 'teacher');
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setCurrentUser(undefined);
      setIsAuthenticated(false);
      setIsTeacher(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateUserProfile = (profile: Partial<StudentProfile>) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, ...profile };
      setCurrentUser(updatedUser);
    }
  };

  return {
    currentUser,
    isAuthenticated,
    isTeacher,
    login,
    register,
    logout,
    updateUserProfile
  };
};
