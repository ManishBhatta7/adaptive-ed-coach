import { supabase } from "@/integrations/supabase/client";

export interface SubmissionData {
  assignmentType: 'answer_sheet' | 'essay' | 'report_card' | 'voice_reading';
  contentData: Record<string, any>;
  score?: number;
  aiFeedback?: Record<string, any>;
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
  // Create a new submission
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
          status: 'pending'
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

  // Update submission with AI feedback
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

      if (error) {
        console.error('Error updating submission:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateSubmissionWithFeedback:', error);
      return false;
    }
  }

  // Get user's submissions
  static async getUserSubmissions(
    userId: string,
    limit = 50
  ): Promise<Submission[]> {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('user_id', userId)
        .order('submitted_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching submissions:', error);
        return [];
      }

      return data?.map(item => ({
        id: item.id,
        userId: item.user_id,
        assignmentType: item.assignment_type,
        contentData: item.content_data as any,
        aiFeedback: item.ai_feedback as any,
        score: item.score,
        submittedAt: item.submitted_at,
        processedAt: item.processed_at,
        status: item.status as string
      })) || [];
    } catch (error) {
      console.error('Error in getUserSubmissions:', error);
      return [];
    }
  }

  // Get submission by ID
  static async getSubmissionById(submissionId: string): Promise<Submission | null> {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('id', submissionId)
        .single();

      if (error) {
        console.error('Error fetching submission:', error);
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
      console.error('Error in getSubmissionById:', error);
      return null;
    }
  }
}