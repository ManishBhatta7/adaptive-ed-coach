
import { useState, useEffect } from "react";
import { Classroom } from "@/types";
import { useAppContext } from "@/context/AppContext";
import { 
  fetchClassrooms, 
  createClassroom as createSupabaseClassroom,
  joinClassroom as joinSupabaseClassroom
} from "./useSupabaseClassroomService";
import { generateMockAssignments, generateMockClassrooms } from "./useClassroomMockUtils";

export const useClassroom = () => {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { state } = useAppContext();

  useEffect(() => {
    if (state.isAuthenticated && state.currentUser) {
      handleFetchClassrooms(state.currentUser.id, state.isTeacher);
    }
  }, [state.isAuthenticated, state.currentUser, state.isTeacher]);

  const handleFetchClassrooms = async (userId: string, isTeacher: boolean) => {
    setIsLoading(true);
    try {
      const fetchedClassrooms = await fetchClassrooms(userId, isTeacher);
      if (fetchedClassrooms) {
        setClassrooms(fetchedClassrooms);
      } else {
        // Fallback to mock data if Supabase fails
        const mockClassrooms = generateMockClassrooms(userId, isTeacher);
        setClassrooms(mockClassrooms);
      }
    } catch (error) {
      console.error("Error in fetchClassrooms:", error);
      // Fallback to mock data
      const mockClassrooms = generateMockClassrooms(userId, isTeacher);
      setClassrooms(mockClassrooms);
    } finally {
      setIsLoading(false);
    }
  };

  const joinClassroom = async (joinCode: string): Promise<boolean> => {
    if (!state.currentUser?.id) return false;
    
    try {
      const success = await joinSupabaseClassroom(joinCode, state.currentUser.id);
      if (success) {
        // Refresh classrooms list
        await handleFetchClassrooms(state.currentUser.id, state.isTeacher);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error joining classroom:", error);
      // Fallback to mock behavior
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
  };

  const createClassroom = async (
    name: string,
    teacherId: string,
    description?: string
  ): Promise<Classroom> => {
    try {
      const newClassroom = await createSupabaseClassroom(name, teacherId, description);
      if (newClassroom) {
        setClassrooms((prev) => [...prev, newClassroom]);
        return newClassroom;
      }
      throw new Error("Failed to create classroom");
    } catch (error) {
      console.error("Error creating classroom:", error);
      // Fallback to mock creation
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
  };

  const refreshClassrooms = async () => {
    if (state.currentUser) {
      await handleFetchClassrooms(state.currentUser.id, state.isTeacher);
    }
  };

  return {
    classrooms,
    isLoading,
    joinClassroom,
    createClassroom,
    refreshClassrooms,
  };
};
