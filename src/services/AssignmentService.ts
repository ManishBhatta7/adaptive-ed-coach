import { supabase } from "@/lib/supabase";

export interface Assignment {
  id: string;
  teacher_id: string;
  title: string;
  description?: string;
  question_paper_url?: string;
  marking_scheme_url?: string;
  status: 'draft' | 'published';
  created_at: string;
}

export class AssignmentService {
  // Fetch assignments created by the current teacher
  static async getTeacherAssignments(): Promise<Assignment[]> {
    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching assignments:', error);
      return [];
    }
    return data as Assignment[];
  }

  // Create a new assignment
  static async createAssignment(
    teacherId: string,
    title: string,
    description: string,
    questionPaperUrl?: string,
    markingSchemeUrl?: string
  ): Promise<Assignment | null> {
    const { data, error } = await supabase
      .from('assignments')
      .insert({
        teacher_id: teacherId,
        title,
        description,
        question_paper_url: questionPaperUrl,
        marking_scheme_url: markingSchemeUrl,
        status: 'published'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating assignment:', error);
      return null;
    }
    return data as Assignment;
  }

  // Delete an assignment
  static async deleteAssignment(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('assignments')
      .delete()
      .eq('id', id);
    
    return !error;
  }
}