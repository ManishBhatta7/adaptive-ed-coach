
import { useState } from 'react';
import { Classroom } from '@/types';
import { supabase } from '@/lib/supabase';

export const useClassroom = () => {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);

  const joinClassroom = async (joinCode: string): Promise<boolean> => {
    // Check if we're using the mock client
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      console.warn('Using mock classroom service (no Supabase credentials)');
      // Create a mock classroom for testing
      const mockClassroom: Classroom = {
        id: `mock-classroom-${Date.now()}`,
        name: 'Mock Classroom',
        description: 'This is a mock classroom for testing',
        teacherId: 'mock-teacher-id',
        studentIds: [],
        assignments: [],
        joinCode,
        createdAt: new Date().toISOString()
      };
      
      setClassrooms(prev => [...prev, mockClassroom]);
      return true;
    }
    
    const classroom = classrooms.find(c => c.joinCode === joinCode);
    
    if (classroom) {
      // Update classrooms state with the joined classroom
      setClassrooms(prevClassrooms =>
        prevClassrooms.map(c => {
          if (c.id === classroom.id) {
            return {
              ...c,
              studentIds: [...c.studentIds]
            };
          }
          return c;
        })
      );
      return true;
    }
    return false;
  };

  const createClassroom = async (
    name: string,
    teacherId: string,
    description?: string
  ): Promise<Classroom> => {
    // Check if we're using the mock client
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      console.warn('Using mock classroom service (no Supabase credentials)');
      // Create a mock classroom for testing
      const mockClassroom: Classroom = {
        id: `mock-classroom-${Date.now()}`,
        name,
        description,
        teacherId,
        studentIds: [],
        assignments: [],
        joinCode: `${name.substring(0, 3).toUpperCase()}${Math.floor(Math.random() * 900) + 100}`,
        createdAt: new Date().toISOString()
      };
      
      setClassrooms(prev => [...prev, mockClassroom]);
      return mockClassroom;
    }
    
    const newClassroom: Classroom = {
      id: `classroom-${Date.now()}`,
      name,
      description,
      teacherId,
      studentIds: [],
      assignments: [],
      joinCode: `${name.substring(0, 3).toUpperCase()}${Math.floor(Math.random() * 900) + 100}`,
      createdAt: new Date().toISOString()
    };
    
    setClassrooms(prev => [...prev, newClassroom]);
    return newClassroom;
  };

  return {
    classrooms,
    joinClassroom,
    createClassroom
  };
};
