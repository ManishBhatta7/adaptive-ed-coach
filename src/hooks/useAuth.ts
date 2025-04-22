
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { StudentProfile } from '@/types';

export const useAuth = () => {
  const [currentUser, setCurrentUser] = useState<StudentProfile | undefined>(undefined);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isTeacher, setIsTeacher] = useState(false);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
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

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name }
        }
      });

      if (error) throw error;

      if (data.user) {
        const newProfile: StudentProfile = {
          id: data.user.id,
          name,
          email,
          avatar: '/placeholder.svg',
          joinedAt: new Date().toISOString(),
          lastActive: new Date().toISOString(),
          performances: []
        };

        const { error: profileError } = await supabase
          .from('profiles')
          .insert([newProfile]);

        if (profileError) throw profileError;

        setCurrentUser(newProfile);
        setIsAuthenticated(true);
        setIsTeacher(false);
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
