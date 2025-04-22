
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { AppState, StudentProfile, Classroom } from '@/types';

// Mock data - in a real app this would come from a database
const mockStudentProfile: StudentProfile = {
  id: '1',
  name: 'John Doe',
  email: 'john.doe@example.com',
  avatar: '/placeholder.svg',
  joinedAt: new Date().toISOString(),
  lastActive: new Date().toISOString(),
  performances: []
};

const mockClassrooms: Classroom[] = [
  {
    id: '1',
    name: 'Advanced Mathematics',
    description: 'A class focused on advanced mathematical concepts',
    teacherId: 'teacher1',
    studentIds: ['1', '2', '3'],
    assignments: [],
    joinCode: 'MATH101',
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Introduction to Literature',
    description: 'Exploring classic and contemporary literature',
    teacherId: 'teacher2',
    studentIds: ['1', '4', '5'],
    assignments: [],
    joinCode: 'LIT101',
    createdAt: new Date().toISOString()
  }
];

// Initial state
const initialState: AppState = {
  currentUser: undefined,
  classrooms: [],
  isAuthenticated: false,
  isTeacher: false
};

// Create context
export const AppContext = createContext<{
  state: AppState;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUserProfile: (profile: Partial<StudentProfile>) => void;
  joinClassroom: (joinCode: string) => Promise<boolean>;
  createClassroom: (name: string, description?: string) => Promise<Classroom>;
}>({
  state: initialState,
  login: () => Promise.resolve(false),
  logout: () => {},
  updateUserProfile: () => {},
  joinClassroom: () => Promise.resolve(false),
  createClassroom: () => Promise.resolve({} as Classroom)
});

// Context provider
export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AppState>(initialState);

  // Simulate loading data from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    const savedClassrooms = localStorage.getItem('classrooms');
    
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser) as StudentProfile;
        setState(prev => ({ 
          ...prev, 
          currentUser: user,
          isAuthenticated: true 
        }));
      } catch (error) {
        console.error('Error parsing saved user:', error);
      }
    }
    
    if (savedClassrooms) {
      try {
        const classrooms = JSON.parse(savedClassrooms) as Classroom[];
        setState(prev => ({ ...prev, classrooms }));
      } catch (error) {
        console.error('Error parsing saved classrooms:', error);
      }
    } else {
      // Load mock data if no saved data exists
      setState(prev => ({ ...prev, classrooms: mockClassrooms }));
    }
  }, []);

  // Save state changes to localStorage
  useEffect(() => {
    if (state.currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(state.currentUser));
    }
    if (state.classrooms.length > 0) {
      localStorage.setItem('classrooms', JSON.stringify(state.classrooms));
    }
  }, [state.currentUser, state.classrooms]);

  // Login function - in a real app this would verify credentials with a server
  const login = async (email: string, password: string): Promise<boolean> => {
    // Simple mock authentication
    if (email && password) {
      setState({
        ...state,
        currentUser: mockStudentProfile,
        isAuthenticated: true,
        isTeacher: email.includes('teacher')
      });
      return true;
    }
    return false;
  };

  // Logout function
  const logout = () => {
    setState({
      ...state,
      currentUser: undefined,
      isAuthenticated: false,
      isTeacher: false
    });
    localStorage.removeItem('currentUser');
  };

  // Update user profile
  const updateUserProfile = (profile: Partial<StudentProfile>) => {
    if (state.currentUser) {
      const updatedUser = { ...state.currentUser, ...profile };
      setState({
        ...state,
        currentUser: updatedUser
      });
    }
  };

  // Join a classroom with a join code
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

  // Create a new classroom (teacher only)
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

// Custom hook for using the app context
export const useAppContext = () => useContext(AppContext);
