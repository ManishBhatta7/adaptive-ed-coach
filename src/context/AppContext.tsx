
import React, { createContext, useContext, useEffect, ReactNode, useState } from 'react';
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

export const AppContext = createContext<{
  state: AppState;
  session: Session | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, role?: 'student' | 'teacher') => Promise<boolean>;
  logout: () => Promise<void>;
  updateUserProfile: (profile: Partial<StudentProfile>) => Promise<void>;
  updateOnboarding: (data: OnboardingData) => Promise<void>;
  joinClassroom: (joinCode: string) => Promise<boolean>;
  createClassroom: (name: string, description?: string) => Promise<Classroom>;
}>({
  state: initialState,
  session: null,
  login: () => Promise.resolve(false),
  register: () => Promise.resolve(false),
  logout: () => Promise.resolve(),
  updateOnboarding: (data: OnboardingData) => Promise.resolve(),
  updateUserProfile: () => Promise.resolve(),
  joinClassroom: () => Promise.resolve(false),
  createClassroom: () => Promise.resolve({} as Classroom)
});

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { currentUser, session, isAuthenticated, isTeacher, isLoading, login, register, logout, updateUserProfile } = useAuth();
  const { classrooms, joinClassroom, createClassroom } = useClassroom();

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
        updateOnboarding: async (data: OnboardingData) => {
          if (!currentUser?.id) return;
          await supabase
            .from('user_preferences')
            .upsert({
              user_id: currentUser.id,
              ...data
            });
          
          // Get updated profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();
            
          if (profile) {
            // Update the current user profile
            // This would need to be implemented based on your auth hook
          }
        },
        joinClassroom,
        createClassroom: (name: string, description?: string) => 
          createClassroom(name, currentUser?.id || '', description)
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
