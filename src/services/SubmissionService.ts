import { supabase } from "@/lib/supabase";

// === 1. Strict Types for AI Feedback ===
export interface AIFeedback {
  score?: number;
  raw_score?: string;
  line_by_line_feedback?: string[];
  missing_concepts?: string[];
  overall_feedback?: string;
  strengths?: string[];
  improvements?: string[];
  [key: string]: unknown; // Safe extension for future fields
}

// === 2. Input Types ===
export interface SubmissionData {
  assignmentType: 'answer_sheet' | 'essay' | 'report_card' | 'voice_reading';
  contentData: Record<string, unknown>;
  score?: number;
  aiFeedback?: AIFeedback;
  status?: string;
}

// === 3. Frontend Output Type (CamelCase) ===
export interface Submission {
  id: string;
  userId: string;
  assignmentType: string;
  contentData: Record<string, unknown>;
  aiFeedback?: AIFeedback;
  score?: number;
  submittedAt: string;
  processedAt?: string;
  status: string;
}

// === 4. Database Row Type (snake_case) ===
// This matches your Supabase table structure exactly
interface DBSubmission {
  id: string;
  user_id: string;
  assignment_type: string;
  content_data: Record<string, unknown>;
  ai_feedback: AIFeedback; // JSONB column
  score: number;
  status: string;
  submitted_at: string;
  processed_at: string;
}

export class SubmissionService {
  
  // === CREATE ===
  static async createSubmission(
    userId: string,
    submissionData: SubmissionData
  ): Promise<Submission | null> {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .insert({
          user_id: userId,
          assignment_type: submissionData.assignmentType,
          content_data: submissionData.contentData,
          ai_feedback: submissionData.aiFeedback || {},
          score: submissionData.score,
          status: submissionData.status || 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating submission:', error);
        return null;
      }

      // Safe cast from DB type to Frontend type
      const row = data as unknown as DBSubmission;

      return {
        id: row.id,
        userId: row.user_id,
        assignmentType: row.assignment_type,
        contentData: row.content_data,
        aiFeedback: row.ai_feedback,
        score: row.score,
        submittedAt: row.submitted_at,
        processedAt: row.processed_at,
        status: row.status
      };
    } catch (error) {
      console.error('Error in createSubmission:', error);
      return null;
    }
  }

  // === ANALYZE (3-Way Grading) ===
  static async analyzeSubmission(
    submissionId: string,
    content: string,
    subject?: string,
    assignmentType?: string,
    question?: string,
    modelAnswer?: string,
    fileUrl?: string,
    questionPaperUrl?: string,
    markingSchemeUrl?: string
  ): Promise<{ success: boolean; analysis?: AIFeedback; error?: string }> {
    try {
      console.log('Calling AI Analysis...');
      
      const { data, error } = await supabase.functions.invoke('analyze-submission', {
        body: {
          submissionId,
          content,
          subject,
          assignmentType,
          question,
          modelAnswer,
          fileUrl,
          questionPaperUrl,
          markingSchemeUrl
        }
      });

      if (error) {
        console.error('Invocation Error:', error);
        return { success: false, error: error.message || 'Connection failed' };
      }

      if (data && data.success === false) {
        console.error('Logic Error:', data.error);
        return { success: false, error: data.error };
      }

      return { success: true, analysis: data.analysis as AIFeedback };
    } catch (error: any) {
      console.error('Service Exception:', error);
      return { success: false, error: error.message || 'Unknown error occurred' };
    }
  }

  // === SMART OCR (Digitizer) ===
  static async processSmartOCR(fileUrl: string): Promise<{ items: { q_number: string, question: string, solution: string }[] }> {
    const { data, error } = await supabase.functions.invoke('smart-ocr', {
      body: { fileUrl }
    });

    if (error) {
      console.error("Edge Function Error:", error);
      throw new Error(error.message || "Failed to connect to AI.");
    }
    
    if (data && Array.isArray(data.items)) {
      return data;
    }
    
    if (data && data.error) {
        throw new Error(data.error);
    }

    throw new Error("Invalid response format from AI.");
  }

  // === TEACHER DASHBOARD (Manual Join Fix) ===
  static async getClassSubmissions(): Promise<(Submission & { studentName?: string })[]> {
    try {
      // 1. Get Submissions
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('status', 'processed')
        .order('submitted_at', { ascending: false });

      if (error) {
        console.error('Error fetching submissions:', error);
        return [];
      }

      // Safe cast
      const submissions = data as unknown as DBSubmission[];

      if (!submissions || submissions.length === 0) return [];

      // 2. Get Unique User IDs
      const userIds = [...new Set(submissions.map(s => s.user_id))];

      // 3. Fetch Profiles Manually (Avoids Join Error)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', userIds);

      // 4. Create Map
      const profileMap: Record<string, string> = {};
      profiles?.forEach(p => {
        profileMap[p.id] = p.name || 'Anonymous';
      });

      // 5. Merge
      return submissions.map(item => ({
        id: item.id,
        userId: item.user_id,
        studentName: profileMap[item.user_id] || 'Unknown Student',
        assignmentType: item.assignment_type,
        contentData: item.content_data,
        aiFeedback: item.ai_feedback,
        score: item.score,
        submittedAt: item.submitted_at,
        processedAt: item.processed_at,
        status: item.status
      }));
    } catch (error) {
      console.error('Service Error:', error);
      return [];
    }
  }
  
  // === UTILITIES ===
  static async updateSubmissionWithFeedback(
    submissionId: string,
    aiFeedback: AIFeedback,
    score?: number
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('submissions')
        .update({
          ai_feedback: aiFeedback,
          score: score,
          processed_at: new Date().toISOString(),
          status: 'processed'
        })
        .eq('id', submissionId);
      return !error;
    } catch (error) {
      return false;
    }
  }

  static async getUserSubmissions(userId: string, limit = 50): Promise<Submission[]> {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('user_id', userId)
        .order('submitted_at', { ascending: false })
        .limit(limit);

      if (error) return [];

      const rows = data as unknown as DBSubmission[];

      return rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        assignmentType: row.assignment_type,
        contentData: row.content_data,
        aiFeedback: row.ai_feedback,
        score: row.score,
        submittedAt: row.submitted_at,
        processedAt: row.processed_at,
        status: row.status
      }));
    } catch (error) {
      return [];
    }
  }

  static async getSubmissionById(submissionId: string): Promise<Submission | null> {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('id', submissionId)
        .single();

      if (error) return null;

      const row = data as unknown as DBSubmission;

      return {
        id: row.id,
        userId: row.user_id,
        assignmentType: row.assignment_type,
        contentData: row.content_data,
        aiFeedback: row.ai_feedback,
        score: row.score,
        submittedAt: row.submitted_at,
        processedAt: row.processed_at,
        status: row.status
      };
    } catch (error) {
      return null;
    }
  }
}