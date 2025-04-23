import { useState, useEffect } from 'react';
import { Classroom, Assignment, SubjectArea } from '@/types';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/context/AppContext';

export const useClassroom = () => {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { state } = useAppContext();

  useEffect(() => {
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      if (state.isAuthenticated && state.currentUser && classrooms.length === 0) {
        const mockClassrooms = generateMockClassrooms(state.currentUser.id, state.isTeacher);
        setClassrooms(mockClassrooms);
      }
    } else {
      if (state.isAuthenticated && state.currentUser) {
        fetchClassrooms(state.currentUser.id, state.isTeacher);
      }
    }
  }, [state.isAuthenticated, state.currentUser, state.isTeacher]);

  const fetchClassrooms = async (userId: string, isTeacher: boolean) => {
    setIsLoading(true);
    try {
      let query;
      if (isTeacher) {
        query = supabase
          .from('classrooms')
          .select('*')
          .eq('teacherId', userId);
      } else {
        query = supabase
          .from('classroom_students')
          .select('classroom_id')
          .eq('student_id', userId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching classrooms:', error);
        return;
      }
      
      console.log('Fetched classrooms:', data);
    } catch (error) {
      console.error('Error in fetchClassrooms:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const joinClassroom = async (joinCode: string): Promise<boolean> => {
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      console.warn('Using mock classroom service (no Supabase credentials)');
      
      const existingClassroom = classrooms.find(c => c.joinCode === joinCode);
      
      if (existingClassroom) {
        return true;
      }
      
      const mockClassroom: Classroom = {
        id: `mock-classroom-${Date.now()}`,
        name: `Class ${joinCode}`,
        description: 'This is a mock classroom for testing',
        teacherId: 'mock-teacher-id',
        studentIds: [state.currentUser?.id || 'mock-student-id'],
        assignments: generateMockAssignments(),
        joinCode,
        createdAt: new Date().toISOString()
      };
      
      setClassrooms(prev => [...prev, mockClassroom]);
      return true;
    }
    
    const classroom = classrooms.find(c => c.joinCode === joinCode);
    
    if (classroom) {
      setClassrooms(prevClassrooms =>
        prevClassrooms.map(c => {
          if (c.id === classroom.id) {
            return {
              ...c,
              studentIds: [...c.studentIds, state.currentUser?.id || '']
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
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      console.warn('Using mock classroom service (no Supabase credentials)');
      
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

  const generateMockClassrooms = (userId: string, isTeacher: boolean): Classroom[] => {
    if (isTeacher) {
      return [
        {
          id: 'classroom-1',
          name: 'Mathematics 101',
          description: 'Introduction to basic mathematics concepts',
          teacherId: userId,
          studentIds: ['student-1', 'student-2', 'student-3'],
          assignments: generateMockAssignments(),
          joinCode: 'MAT101',
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'classroom-2',
          name: 'Physics for Beginners',
          description: 'Learn the fundamentals of physics',
          teacherId: userId,
          studentIds: ['student-2', 'student-4', 'student-5'],
          assignments: generateMockAssignments(),
          joinCode: 'PHY101',
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
    } else {
      return [
        {
          id: 'classroom-1',
          name: 'Mathematics 101',
          description: 'Introduction to basic mathematics concepts',
          teacherId: 'teacher-1',
          studentIds: [userId, 'student-2', 'student-3'],
          assignments: generateMockAssignments(),
          joinCode: 'MAT101',
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'classroom-3',
          name: 'Biology 201',
          description: 'Advanced biological concepts and theories',
          teacherId: 'teacher-2',
          studentIds: [userId, 'student-6', 'student-7'],
          assignments: generateMockAssignments(),
          joinCode: 'BIO201',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
    }
  };

  const generateMockAssignments = (): Assignment[] => {
    return [
      {
        id: `assignment-${Date.now()}-1`,
        title: 'Weekly Problem Set',
        description: 'Complete the problem set from chapter 5',
        subjectArea: SubjectArea.MATH,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        maxScore: 100
      },
      {
        id: `assignment-${Date.now()}-2`,
        title: 'Research Paper',
        description: 'Write a 5-page paper on a topic of your choice',
        subjectArea: SubjectArea.LITERATURE,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        maxScore: 100
      }
    ];
  };

  return {
    classrooms,
    isLoading,
    joinClassroom,
    createClassroom
  };
};
