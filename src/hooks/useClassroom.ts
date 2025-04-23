import { useState, useEffect } from "react";
import { Classroom } from "@/types";
import { useAppContext } from "@/context/AppContext";
import { fetchClassrooms } from "./useSupabaseClassroomService";
import { generateMockClassrooms } from "./useClassroomMockUtils";

export const useClassroom = () => {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { state } = useAppContext();

  useEffect(() => {
    if (
      !import.meta.env.VITE_SUPABASE_URL ||
      !import.meta.env.VITE_SUPABASE_ANON_KEY
    ) {
      if (
        state.isAuthenticated &&
        state.currentUser &&
        classrooms.length === 0
      ) {
        const mockClassrooms = generateMockClassrooms(
          state.currentUser.id,
          state.isTeacher
        );
        setClassrooms(mockClassrooms);
      }
    } else {
      if (state.isAuthenticated && state.currentUser) {
        handleFetchClassrooms(state.currentUser.id, state.isTeacher);
      }
    }
    // eslint-disable-next-line
  }, [state.isAuthenticated, state.currentUser, state.isTeacher]);

  const handleFetchClassrooms = async (userId: string, isTeacher: boolean) => {
    setIsLoading(true);
    try {
      const fetchedClassrooms = await fetchClassrooms(userId, isTeacher);
      if (fetchedClassrooms) {
        setClassrooms(fetchedClassrooms);
      }
    } catch (error) {
      console.error("Error in fetchClassrooms:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const joinClassroom = async (joinCode: string): Promise<boolean> => {
    if (
      !import.meta.env.VITE_SUPABASE_URL ||
      !import.meta.env.VITE_SUPABASE_ANON_KEY
    ) {
      const existingClassroom = classrooms.find((c) => c.joinCode === joinCode);
      if (existingClassroom) return true;

      const mockClassroom: Classroom = {
        id: `mock-classroom-${Date.now()}`,
        name: `Class ${joinCode}`,
        description: "This is a mock classroom for testing",
        teacherId: "mock-teacher-id",
        studentIds: [state.currentUser?.id || "mock-student-id"],
        assignments: generateMockAssignments(),
        joinCode,
        createdAt: new Date().toISOString(),
      };

      setClassrooms((prev) => [...prev, mockClassroom]);
      return true;
    }
    // Production logic: find and update state (placeholder, real logic not implemented)
    const classroom = classrooms.find((c) => c.joinCode === joinCode);
    if (classroom) {
      setClassrooms((prevClassrooms) =>
        prevClassrooms.map((c) => {
          if (c.id === classroom.id) {
            return {
              ...c,
              studentIds: [...c.studentIds, state.currentUser?.id || ""],
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
    if (
      !import.meta.env.VITE_SUPABASE_URL ||
      !import.meta.env.VITE_SUPABASE_ANON_KEY
    ) {
      const mockClassroom: Classroom = {
        id: `mock-classroom-${Date.now()}`,
        name,
        description,
        teacherId,
        studentIds: [],
        assignments: [],
        joinCode: `${name.substring(0, 3).toUpperCase()}${
          Math.floor(Math.random() * 900) + 100
        }`,
        createdAt: new Date().toISOString(),
      };
      setClassrooms((prev) => [...prev, mockClassroom]);
      return mockClassroom;
    }
    // Production: just local creation (placeholder)
    const newClassroom: Classroom = {
      id: `classroom-${Date.now()}`,
      name,
      description,
      teacherId,
      studentIds: [],
      assignments: [],
      joinCode: `${name.substring(0, 3).toUpperCase()}${
        Math.floor(Math.random() * 900) + 100
      }`,
      createdAt: new Date().toISOString(),
    };
    setClassrooms((prev) => [...prev, newClassroom]);
    return newClassroom;
  };

  return {
    classrooms,
    isLoading,
    joinClassroom,
    createClassroom,
  };
};
