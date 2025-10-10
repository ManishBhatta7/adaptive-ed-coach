import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useClassroom } from '@/hooks/useClassroom';
import { AppState, Classroom, StudentProfile } from '@/types';
import { OnboardingData } from '@/types/user';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

const initialState: AppState = {
  currentUser: undefined,
  classrooms: [],
  isAuthenticated: false,
  isTeacher: false,
  isLoading: true
};

interface AppContextType {
  state: AppState;
  session: Session | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, role?: 'student' | 'teacher') => Promise<boolean>;
  logout: () => Promise<void>;
  updateUserProfile: (profile: Partial<StudentProfile>) => Promise<void>;
  updateOnboarding: (data: OnboardingData) => Promise<void>;
  joinClassroom: (joinCode: string) => Promise<boolean>;
  createClassroom: (name: string, description?: string) => Promise<Classroom>;
}

export const AppContext = createContext<AppContextType>({
  state: initialState,
  session: null,
  login: () => Promise.resolve(false),
  register: () => Promise.resolve(false),
  logout: () => Promise.resolve(),
  updateUserProfile: () => Promise.resolve(),
  updateOnboarding: () => Promise.resolve(),
  joinClassroom: () => Promise.resolve(false),
  createClassroom: () => Promise.resolve({} as Classroom)
});

export const AppProvider = ({ children }: { children: ReactNode }): JSX.Element => {
  const { 
    currentUser,
    session,
    isAuthenticated,
    isTeacher,
    isLoading,
    login,
    register,
    logout,
    updateUserProfile
  } = useAuth();

  const { classrooms, createClassroom, joinClassroom } = useClassroom(currentUser?.id);

  const updateOnboarding = async (data: OnboardingData) => {
    if (!currentUser?.id) return;

    try {
      // Update preferences in database
      await supabase
        .from('user_preferences')
        .upsert({
          user_id: currentUser.id,
          ...data
        });

      // Update user profile with new preferences
      await updateUserProfile({
        preferences: {
          ...currentUser.preferences,
          ...data
        }
      });
    } catch (error) {
      console.error('Error updating onboarding data:', error);
    }
  };

  const state: AppState = {
    currentUser,
    classrooms,
    isAuthenticated,
    isTeacher,
    isLoading
  };

  return (
    <AppContext.Provider
      value={{
        state,
        session,
        login,
        register,
        logout,
        updateUserProfile,
        updateOnboarding,
        joinClassroom,
        createClassroom
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);