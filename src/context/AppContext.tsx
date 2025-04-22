
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { AppState, StudentProfile, Classroom } from '@/types';

// Get Supabase credentials with fallbacks for development
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if Supabase credentials are available
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials are missing. Please check your environment variables.');
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Initial state
const initialState: AppState = {
  currentUser: undefined,
  classrooms: [],
  isAuthenticated: false,
  isTeacher: false
};

export const AppContext = createContext<{
  state: AppState;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
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
  const [state, setState] = useState<AppState>(initialState);

  useEffect(() => {
    // Check for existing session on load
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          setState(prev => ({
            ...prev,
            currentUser: profile as StudentProfile,
            isAuthenticated: true,
            isTeacher: profile.role === 'teacher'
          }));
        }
      }
    };

    checkSession();
  }, []);

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
          setState(prev => ({
            ...prev,
            currentUser: profile as StudentProfile,
            isAuthenticated: true,
            isTeacher: profile.role === 'teacher'
          }));
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
          data: {
            name
          }
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

        setState(prev => ({
          ...prev,
          currentUser: newProfile,
          isAuthenticated: true,
          isTeacher: false
        }));
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

      setState(initialState);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateUserProfile = (profile: Partial<StudentProfile>) => {
    if (state.currentUser) {
      const updatedUser = { ...state.currentUser, ...profile };
      setState({
        ...state,
        currentUser: updatedUser
      });
    }
  };

  const joinClassroom = async (joinCode: string): Promise<boolean> => {
    const classroom = state.classrooms.find(c => c.joinCode === joinCode);
    
    if (classroom && state.currentUser) {
      // Check if student is already in classroom
      if (classroom.studentIds.includes(state.currentUser.id)) {
        return true; // Already joined
      }
      
      // Add student to classroom
      const updatedClassrooms = state.classrooms.map(c => {
        if (c.id === classroom.id) {
          return {
            ...c,
            studentIds: [...c.studentIds, state.currentUser!.id]
          };
        }
        return c;
      });
      
      setState({
        ...state,
        classrooms: updatedClassrooms
      });
      return true;
    }
    return false;
  };

  const createClassroom = async (name: string, description?: string): Promise<Classroom> => {
    if (!state.currentUser || !state.isTeacher) {
      throw new Error('Only teachers can create classrooms');
    }
    
    const newClassroom: Classroom = {
      id: `classroom-${Date.now()}`,
      name,
      description,
      teacherId: state.currentUser.id,
      studentIds: [],
      assignments: [],
      joinCode: `${name.substring(0, 3).toUpperCase()}${Math.floor(Math.random() * 900) + 100}`,
      createdAt: new Date().toISOString()
    };
    
    setState({
      ...state,
      classrooms: [...state.classrooms, newClassroom]
    });
    
    return newClassroom;
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
        createClassroom
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
