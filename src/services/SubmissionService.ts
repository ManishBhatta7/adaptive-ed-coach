import { supabase } from "@/lib/supabase";

export interface SubmissionData {
  assignmentType: 'answer_sheet' | 'essay' | 'report_card' | 'voice_reading';
  contentData: Record<string, any>;
  score?: number;
  aiFeedback?: Record<string, any>;
  status?: string;
}

export interface Submission {
  id: string;
  userId: string;
  assignmentType: string;
  contentData: any;
  aiFeedback?: any;
  score?: number;
  submittedAt: string;
  processedAt?: string;
  status: string;
}

export class SubmissionService {
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
          ai_feedback: submissionData.aiFeedback,
          score: submissionData.score,
          status: submissionData.status || 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating submission:', error);
        return null;
      }

      return {
        id: data.id,
        userId: data.user_id,
        assignmentType: data.assignment_type,
        contentData: data.content_data as any,
        aiFeedback: data.ai_feedback as any,
        score: data.score,
        submittedAt: data.submitted_at,
        processedAt: data.processed_at,
        status: data.status as string
      };
    } catch (error) {
      console.error('Error in createSubmission:', error);
      return null;
    }
  }

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
  ): Promise<{ success: boolean; analysis?: any; error?: string }> {
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

      return { success: true, analysis: data.analysis };
    } catch (error: any) {
      console.error('Service Exception:', error);
      return { success: false, error: error.message || 'Unknown error occurred' };
    }
  }

  // === FIX: MANUAL FETCH AND MERGE ===
  static async getClassSubmissions(): Promise<(Submission & { studentName?: string })[]> {
    try {
      // 1. Get Submissions
      const { data: submissions, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('status', 'processed')
        .order('submitted_at', { ascending: false });

      if (error) {
        console.error('Error fetching submissions:', error);
        return [];
      }

      if (!submissions || submissions.length === 0) return [];

      // 2. Get Unique User IDs
      const userIds = [...new Set(submissions.map(s => s.user_id))];

      // 3. Fetch Profiles for those IDs
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', userIds);

      // 4. Create a Lookup Map
      const profileMap: Record<string, string> = {};
      profiles?.forEach(p => {
        profileMap[p.id] = p.name || 'Anonymous';
      });

      // 5. Merge Data
      return submissions.map(item => ({
        id: item.id,
        userId: item.user_id,
        studentName: profileMap[item.user_id] || 'Unknown Student', // <--- Safely mapped
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
  
  static async updateSubmissionWithFeedback(
    submissionId: string,
    aiFeedback: Record<string, any>,
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
}