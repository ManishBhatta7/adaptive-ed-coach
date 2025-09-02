
import { supabase } from "@/lib/supabase";
import { Classroom } from "@/types";

// Updated classroom fetching logic that works with our database structure
export const fetchClassrooms = async (
  userId: string, 
  isTeacher: boolean
): Promise<Classroom[] | null> => {
  try {
    if (isTeacher) {
      // Teachers: Get classrooms they created
      const { data, error } = await supabase
        .from('classrooms')
        .select('*')
        .eq('teacher_id', userId)
        .eq('is_active', true);
      
      if (error) {
        console.error('Error fetching teacher classrooms:', error);
        return null;
      }
      
      // Convert to Classroom type
      return data?.map(classroom => ({
        id: classroom.id,
        name: classroom.name,
        description: classroom.description || '',
        teacherId: classroom.teacher_id,
        studentIds: [], // Will be populated separately if needed
        assignments: [], // Will be populated separately if needed
        joinCode: classroom.join_code,
        createdAt: classroom.created_at
      })) || [];
      
    } else {
      // Students: Get classrooms they've joined
      const { data, error } = await supabase
        .from('classroom_students')
        .select(`
          classroom_id,
          classrooms!inner (
            id,
            name,
            description,
            teacher_id,
            join_code,
            is_active,
            created_at,
            updated_at
          )
        `)
        .eq('student_id', userId)
        .eq('is_active', true);
      
      if (error) {
        console.error('Error fetching student classrooms:', error);
        return null;
      }
      
      // Convert to Classroom type
      return data?.map(item => ({
        id: item.classrooms.id,
        name: item.classrooms.name,
        description: item.classrooms.description || '',
        teacherId: item.classrooms.teacher_id,
        studentIds: [], // Will be populated separately if needed
        assignments: [], // Will be populated separately if needed  
        joinCode: item.classrooms.join_code,
        createdAt: item.classrooms.created_at
      })) || [];
    }
  } catch (error) {
    console.error('Error in fetchClassrooms:', error);
    return null;
  }
};

// Create a new classroom (teachers only)
export const createClassroom = async (
  name: string,
  teacherId: string,
  description?: string
): Promise<Classroom | null> => {
  try {
    // Generate a unique 6-digit join code
    const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const { data, error } = await supabase
      .from('classrooms')
      .insert({
        name,
        description,
        teacher_id: teacherId,
        join_code: joinCode
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating classroom:', error);
      return null;
    }
    
    return {
      id: data.id,
      name: data.name,
      description: data.description || '',
      teacherId: data.teacher_id,
      studentIds: [],
      assignments: [],
      joinCode: data.join_code,
      createdAt: data.created_at
    };
  } catch (error) {
    console.error('Error in createClassroom:', error);
    return null;
  }
};

// Join a classroom using join code (students only)
export const joinClassroom = async (
  joinCode: string,
  studentId: string
): Promise<boolean> => {
  try {
    // First, find the classroom by join code
    const { data: classroom, error: classroomError } = await supabase
      .from('classrooms')
      .select('id')
      .eq('join_code', joinCode.toUpperCase())
      .eq('is_active', true)
      .single();
    
    if (classroomError || !classroom) {
      console.error('Classroom not found:', classroomError);
      return false;
    }
    
    // Check if student is already in the classroom
    const { data: existing } = await supabase
      .from('classroom_students')
      .select('id')
      .eq('classroom_id', classroom.id)
      .eq('student_id', studentId)
      .single();
    
    if (existing) {
      console.log('Student already in classroom');
      return true; // Already joined
    }
    
    // Add student to classroom
    const { error: joinError } = await supabase
      .from('classroom_students')
      .insert({
        classroom_id: classroom.id,
        student_id: studentId
      });
    
    if (joinError) {
      console.error('Error joining classroom:', joinError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in joinClassroom:', error);
    return false;
  }
};
