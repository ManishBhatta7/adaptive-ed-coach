
import { useState } from 'react';
import { Classroom } from '@/types';

export const useClassroom = () => {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);

  const joinClassroom = async (joinCode: string): Promise<boolean> => {
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
