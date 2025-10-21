export type MetacogStrategy = 'Visualize' | 'Formula' | 'Example' | 'Trial-and-error' | 'Break-down' | 'Other';

export interface Reflection {
  id: string;
  student_id: string;
  assignment_id?: string | null;
  classroom_id?: string | null;
  problem_description: string;
  subject_area: string;
  strategy_used: MetacogStrategy;
  reflection_text: string;
  was_helpful: boolean;
  difficulty_rating?: number | null;
  teacher_rating?: number | null;
  teacher_id?: string | null;
  teacher_feedback?: string | null;
  ai_feedback?: string | null;
  feedback_generated_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface MetacogSummary {
  total_reflections: number;
  avg_teacher_rating: number | null;
  strategies_used: Record<MetacogStrategy, number>;
}
