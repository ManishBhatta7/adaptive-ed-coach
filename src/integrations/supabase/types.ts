export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      assignments: {
        Row: {
          assignment_type: string
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          is_active: boolean | null
          teacher_id: string
          title: string
          total_points: number | null
          updated_at: string
        }
        Insert: {
          assignment_type: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_active?: boolean | null
          teacher_id: string
          title: string
          total_points?: number | null
          updated_at?: string
        }
        Update: {
          assignment_type?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_active?: boolean | null
          teacher_id?: string
          title?: string
          total_points?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      classroom_assignments: {
        Row: {
          assigned_at: string
          assignment_id: string
          classroom_id: string
          id: string
        }
        Insert: {
          assigned_at?: string
          assignment_id: string
          classroom_id: string
          id?: string
        }
        Update: {
          assigned_at?: string
          assignment_id?: string
          classroom_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "classroom_assignments_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_classroom_assignments_classroom_id"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
        ]
      }
      classroom_students: {
        Row: {
          classroom_id: string
          id: string
          is_active: boolean | null
          joined_at: string
          student_id: string
        }
        Insert: {
          classroom_id: string
          id?: string
          is_active?: boolean | null
          joined_at?: string
          student_id: string
        }
        Update: {
          classroom_id?: string
          id?: string
          is_active?: boolean | null
          joined_at?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "classroom_students_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
        ]
      }
      classrooms: {
        Row: {
          created_at: string
          description: string | null
          grade_level: string | null
          id: string
          is_active: boolean | null
          join_code: string
          name: string
          subject_area: string | null
          teacher_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          grade_level?: string | null
          id?: string
          is_active?: boolean | null
          join_code: string
          name: string
          subject_area?: string | null
          teacher_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          grade_level?: string | null
          id?: string
          is_active?: boolean | null
          join_code?: string
          name?: string
          subject_area?: string | null
          teacher_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      content_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      content_import_logs: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          error_details: Json | null
          failed_imports: number | null
          id: string
          import_source: string
          processed_items: number | null
          started_at: string
          status: string
          successful_imports: number | null
          total_items: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_details?: Json | null
          failed_imports?: number | null
          id?: string
          import_source: string
          processed_items?: number | null
          started_at?: string
          status: string
          successful_imports?: number | null
          total_items?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_details?: Json | null
          failed_imports?: number | null
          id?: string
          import_source?: string
          processed_items?: number | null
          started_at?: string
          status?: string
          successful_imports?: number | null
          total_items?: number | null
        }
        Relationships: []
      }
      doubt_responses: {
        Row: {
          created_at: string
          doubt_id: string
          helpful_votes: number | null
          id: string
          is_solution: boolean | null
          responder_id: string | null
          response_text: string
          response_type: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          doubt_id: string
          helpful_votes?: number | null
          id?: string
          is_solution?: boolean | null
          responder_id?: string | null
          response_text: string
          response_type?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          doubt_id?: string
          helpful_votes?: number | null
          id?: string
          is_solution?: boolean | null
          responder_id?: string | null
          response_text?: string
          response_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "doubt_responses_doubt_id_fkey"
            columns: ["doubt_id"]
            isOneToOne: false
            referencedRelation: "doubts"
            referencedColumns: ["id"]
          },
        ]
      }
      doubts: {
        Row: {
          ai_confidence_score: number | null
          assigned_to: string | null
          attachments: Json | null
          created_at: string
          description: string
          difficulty_level: string | null
          escalated_at: string | null
          id: string
          priority: string | null
          solved_at: string | null
          solved_by: string | null
          status: string | null
          student_id: string
          subject_area: string | null
          tags: string[] | null
          telegram_chat_id: number | null
          telegram_message_id: number | null
          title: string
          updated_at: string
        }
        Insert: {
          ai_confidence_score?: number | null
          assigned_to?: string | null
          attachments?: Json | null
          created_at?: string
          description: string
          difficulty_level?: string | null
          escalated_at?: string | null
          id?: string
          priority?: string | null
          solved_at?: string | null
          solved_by?: string | null
          status?: string | null
          student_id: string
          subject_area?: string | null
          tags?: string[] | null
          telegram_chat_id?: number | null
          telegram_message_id?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          ai_confidence_score?: number | null
          assigned_to?: string | null
          attachments?: Json | null
          created_at?: string
          description?: string
          difficulty_level?: string | null
          escalated_at?: string | null
          id?: string
          priority?: string | null
          solved_at?: string | null
          solved_by?: string | null
          status?: string | null
          student_id?: string
          subject_area?: string | null
          tags?: string[] | null
          telegram_chat_id?: number | null
          telegram_message_id?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      educational_content: {
        Row: {
          category_id: string | null
          content_data: Json | null
          content_type: string
          created_at: string
          description: string | null
          difficulty_level: string | null
          grade_level: string | null
          id: string
          imported_at: string
          is_active: boolean | null
          source_id: string | null
          source_url: string | null
          subject_area: string | null
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          content_data?: Json | null
          content_type: string
          created_at?: string
          description?: string | null
          difficulty_level?: string | null
          grade_level?: string | null
          id?: string
          imported_at?: string
          is_active?: boolean | null
          source_id?: string | null
          source_url?: string | null
          subject_area?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          content_data?: Json | null
          content_type?: string
          created_at?: string
          description?: string | null
          difficulty_level?: string | null
          grade_level?: string | null
          id?: string
          imported_at?: string
          is_active?: boolean | null
          source_id?: string | null
          source_url?: string | null
          subject_area?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "educational_content_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "content_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_sessions: {
        Row: {
          created_at: string
          duration_minutes: number | null
          id: string
          insights: Json | null
          performance_data: Json | null
          score: number | null
          session_type: string
          subject_area: string | null
          topic: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number | null
          id?: string
          insights?: Json | null
          performance_data?: Json | null
          score?: number | null
          session_type: string
          subject_area?: string | null
          topic?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number | null
          id?: string
          insights?: Json | null
          performance_data?: Json | null
          score?: number | null
          session_type?: string
          subject_area?: string | null
          topic?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar: string | null
          email: string | null
          id: string
          joined_at: string | null
          last_active: string | null
          name: string
          role: string
          telegram_chat_id: number | null
          telegram_username: string | null
        }
        Insert: {
          avatar?: string | null
          email?: string | null
          id: string
          joined_at?: string | null
          last_active?: string | null
          name: string
          role: string
          telegram_chat_id?: number | null
          telegram_username?: string | null
        }
        Update: {
          avatar?: string | null
          email?: string | null
          id?: string
          joined_at?: string | null
          last_active?: string | null
          name?: string
          role?: string
          telegram_chat_id?: number | null
          telegram_username?: string | null
        }
        Relationships: []
      }
      quiz_questions: {
        Row: {
          content_id: string | null
          correct_answer: string | null
          created_at: string
          difficulty_level: string | null
          explanation: string | null
          id: string
          options: Json | null
          points: number | null
          question_text: string
          question_type: string
          updated_at: string
        }
        Insert: {
          content_id?: string | null
          correct_answer?: string | null
          created_at?: string
          difficulty_level?: string | null
          explanation?: string | null
          id?: string
          options?: Json | null
          points?: number | null
          question_text: string
          question_type: string
          updated_at?: string
        }
        Update: {
          content_id?: string | null
          correct_answer?: string | null
          created_at?: string
          difficulty_level?: string | null
          explanation?: string | null
          id?: string
          options?: Json | null
          points?: number | null
          question_text?: string
          question_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "educational_content"
            referencedColumns: ["id"]
          },
        ]
      }
      report_analyses: {
        Row: {
          analysis_results: Json
          created_at: string | null
          id: string
          report_url: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          analysis_results: Json
          created_at?: string | null
          id?: string
          report_url: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          analysis_results?: Json
          created_at?: string | null
          id?: string
          report_url?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      student_performance: {
        Row: {
          created_at: string | null
          data: Json
          id: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data: Json
          id?: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json
          id?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      student_profiles: {
        Row: {
          id: string
          learning_style_strengths: Json | null
          primary_learning_style: string | null
          secondary_learning_style: string | null
        }
        Insert: {
          id: string
          learning_style_strengths?: Json | null
          primary_learning_style?: string | null
          secondary_learning_style?: string | null
        }
        Update: {
          id?: string
          learning_style_strengths?: Json | null
          primary_learning_style?: string | null
          secondary_learning_style?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          ai_feedback: Json | null
          assignment_type: string
          content_data: Json
          id: string
          processed_at: string | null
          score: number | null
          status: string
          submitted_at: string
          user_id: string
        }
        Insert: {
          ai_feedback?: Json | null
          assignment_type: string
          content_data?: Json
          id?: string
          processed_at?: string | null
          score?: number | null
          status?: string
          submitted_at?: string
          user_id: string
        }
        Update: {
          ai_feedback?: Json | null
          assignment_type?: string
          content_data?: Json
          id?: string
          processed_at?: string | null
          score?: number | null
          status?: string
          submitted_at?: string
          user_id?: string
        }
        Relationships: []
      }
      teacher_profiles: {
        Row: {
          bio: string | null
          id: string
          subjects: string[] | null
          years_experience: number | null
        }
        Insert: {
          bio?: string | null
          id: string
          subjects?: string[] | null
          years_experience?: number | null
        }
        Update: {
          bio?: string | null
          id?: string
          subjects?: string[] | null
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "teacher_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_profiles: {
        Row: {
          avatar: string | null
          id: string | null
          joined_at: string | null
          last_active: string | null
          name: string | null
          role: string | null
        }
        Insert: {
          avatar?: string | null
          id?: string | null
          joined_at?: string | null
          last_active?: string | null
          name?: string | null
          role?: string | null
        }
        Update: {
          avatar?: string | null
          id?: string | null
          joined_at?: string | null
          last_active?: string | null
          name?: string | null
          role?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      generate_join_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_all_profiles_admin: {
        Args: Record<PropertyKey, never>
        Returns: {
          avatar: string
          email: string
          id: string
          joined_at: string
          last_active: string
          name: string
          role: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "teacher" | "student"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "teacher", "student"],
    },
  },
} as const
