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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          created_at: string
          description: string
          id: string
          ref_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          ref_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          ref_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          id: number
          inactive_days: number
          mastery_threshold: number
          max_recommendations: number
          support_threshold: number
          updated_at: string
        }
        Insert: {
          id?: number
          inactive_days?: number
          mastery_threshold?: number
          max_recommendations?: number
          support_threshold?: number
          updated_at?: string
        }
        Update: {
          id?: number
          inactive_days?: number
          mastery_threshold?: number
          max_recommendations?: number
          support_threshold?: number
          updated_at?: string
        }
        Relationships: []
      }
      material_progress: {
        Row: {
          completed_at: string | null
          id: string
          last_opened_at: string
          material_id: string
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          last_opened_at?: string
          material_id: string
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          last_opened_at?: string
          material_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_progress_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          content: string
          cover_url: string | null
          created_at: string
          created_by: string | null
          difficulty: string
          duration_minutes: number
          id: string
          is_published: boolean
          is_sample: boolean
          levels: Database["public"]["Enums"]["edu_level"][]
          objectives: string[]
          order_index: number
          prerequisite_ids: string[]
          subject_id: string
          summary: string
          title: string
          topic: string
          updated_at: string
        }
        Insert: {
          content?: string
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          difficulty?: string
          duration_minutes?: number
          id?: string
          is_published?: boolean
          is_sample?: boolean
          levels: Database["public"]["Enums"]["edu_level"][]
          objectives?: string[]
          order_index?: number
          prerequisite_ids?: string[]
          subject_id: string
          summary?: string
          title: string
          topic?: string
          updated_at?: string
        }
        Update: {
          content?: string
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          difficulty?: string
          duration_minutes?: number
          id?: string
          is_published?: boolean
          is_sample?: boolean
          levels?: Database["public"]["Enums"]["edu_level"][]
          objectives?: string[]
          order_index?: number
          prerequisite_ids?: string[]
          subject_id?: string
          summary?: string
          title?: string
          topic?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "materials_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          id: string
          level: Database["public"]["Enums"]["edu_level"] | null
          status: string
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          display_name: string
          id: string
          level?: Database["public"]["Enums"]["edu_level"] | null
          status?: string
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          level?: Database["public"]["Enums"]["edu_level"] | null
          status?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          correct_index: number
          created_at: string
          explanation: string
          id: string
          level: Database["public"]["Enums"]["edu_level"]
          options: Json
          points: number
          prompt: string
          subject_id: string
          topic: string
          type: string
          updated_at: string
        }
        Insert: {
          correct_index: number
          created_at?: string
          explanation?: string
          id?: string
          level: Database["public"]["Enums"]["edu_level"]
          options: Json
          points?: number
          prompt: string
          subject_id: string
          topic?: string
          type?: string
          updated_at?: string
        }
        Update: {
          correct_index?: number
          created_at?: string
          explanation?: string
          id?: string
          level?: Database["public"]["Enums"]["edu_level"]
          options?: Json
          points?: number
          prompt?: string
          subject_id?: string
          topic?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_answers: {
        Row: {
          attempt_id: string
          id: string
          is_correct: boolean
          points_awarded: number
          question_id: string
          selected_index: number | null
        }
        Insert: {
          attempt_id: string
          id?: string
          is_correct: boolean
          points_awarded: number
          question_id: string
          selected_index?: number | null
        }
        Update: {
          attempt_id?: string
          id?: string
          is_correct?: boolean
          points_awarded?: number
          question_id?: string
          selected_index?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "quiz_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          attempt_number: number
          client_token: string
          correct_count: number
          id: string
          passed: boolean
          points_earned: number
          points_total: number
          question_count: number
          quiz_id: string
          score: number
          submitted_at: string
          user_id: string
        }
        Insert: {
          attempt_number: number
          client_token: string
          correct_count: number
          id?: string
          passed: boolean
          points_earned: number
          points_total: number
          question_count: number
          quiz_id: string
          score: number
          submitted_at?: string
          user_id: string
        }
        Update: {
          attempt_number?: number
          client_token?: string
          correct_count?: number
          id?: string
          passed?: boolean
          points_earned?: number
          points_total?: number
          question_count?: number
          quiz_id?: string
          score?: number
          submitted_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          id: string
          points: number | null
          position: number
          question_id: string
          quiz_id: string
        }
        Insert: {
          id?: string
          points?: number | null
          position?: number
          question_id: string
          quiz_id: string
        }
        Update: {
          id?: string
          points?: number | null
          position?: number
          question_id?: string
          quiz_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          allow_retake: boolean
          available_from: string | null
          available_until: string | null
          created_at: string
          description: string
          id: string
          is_published: boolean
          kind: string
          level: Database["public"]["Enums"]["edu_level"]
          material_id: string | null
          max_attempts: number | null
          passing_score: number
          show_review: boolean
          subject_id: string
          title: string
          updated_at: string
        }
        Insert: {
          allow_retake?: boolean
          available_from?: string | null
          available_until?: string | null
          created_at?: string
          description?: string
          id?: string
          is_published?: boolean
          kind?: string
          level: Database["public"]["Enums"]["edu_level"]
          material_id?: string | null
          max_attempts?: number | null
          passing_score?: number
          show_review?: boolean
          subject_id: string
          title: string
          updated_at?: string
        }
        Update: {
          allow_retake?: boolean
          available_from?: string | null
          available_until?: string | null
          created_at?: string
          description?: string
          id?: string
          is_published?: boolean
          kind?: string
          level?: Database["public"]["Enums"]["edu_level"]
          material_id?: string | null
          max_attempts?: number | null
          passing_score?: number
          show_review?: boolean
          subject_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          created_at: string
          description: string
          icon: string
          id: string
          levels: Database["public"]["Enums"]["edu_level"][]
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          levels?: Database["public"]["Enums"]["edu_level"][]
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          levels?: Database["public"]["Enums"]["edu_level"][]
          name?: string
          slug?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_level: {
        Args: never
        Returns: Database["public"]["Enums"]["edu_level"]
      }
      get_attempt_review: { Args: { p_attempt: string }; Returns: Json }
      get_quiz_for_student: { Args: { p_quiz: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_pendamping: { Args: never; Returns: boolean }
      public_material_preview: {
        Args: never
        Returns: {
          difficulty: string
          duration_minutes: number
          id: string
          levels: Database["public"]["Enums"]["edu_level"][]
          subject_name: string
          subject_slug: string
          summary: string
          title: string
          topic: string
        }[]
      }
      submit_quiz: {
        Args: { p_answers: Json; p_quiz: string; p_token: string }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "pendamping" | "siswa"
      edu_level: "SD" | "SMP" | "SMA"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "pendamping", "siswa"],
      edu_level: ["SD", "SMP", "SMA"],
    },
  },
} as const
