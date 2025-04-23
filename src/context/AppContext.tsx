import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useClassroom } from '@/hooks/useClassroom';
import { AppState, Classroom, StudentProfile } from '@/types';

const initialState: AppState = {
  currentUser: undefined,
  classrooms: [],
  isAuthenticated: false,
  isTeacher: false
};

export const AppContext = createContext<{
  state: AppState;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, role?: 'student' | 'teacher') => Promise<boolean>;
  logout: () => Promise<void>;
  updateUserProfile: (profile: Partial<StudentProfile>) => void;
  joinClassroom: (joinCode: string) => Promise<boolean>;
  createClassroom: (name: string, description?: string) => Promise<Classroom>;
}>({
  state: initialState,
  login: () => Promise.resolve(false),
  register: () => Promise.resolve(false),
  logout: () => Promise.resolve(),
  updateUserProfile: () => {},
  joinClassroom: () => Promise.resolve(false),
  createClassroom: () => Promise.resolve({} as Classroom)
});

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const {
    currentUser,
    isAuthenticated,
    isTeacher,
    login,
    register,
    logout,
    updateUserProfile
  } = useAuth();
  
  const { classrooms, joinClassroom, createClassroom } = useClassroom();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          updateUserProfile(profile as StudentProfile);
        }
      }
    };

    checkSession();
  }, []);

  const state: AppState = {
    currentUser,
    classrooms,
    isAuthenticated,
    isTeacher
  };

  return (
    <AppContext.Provider
      value={{
        state,
        login,
        register,
        logout,
        updateUserProfile,
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
