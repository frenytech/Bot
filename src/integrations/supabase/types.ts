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
      academic_levels: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          position: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          position?: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          position?: number
          updated_at?: string
        }
        Relationships: []
      }
      ai_usage: {
        Row: {
          completion_tokens: number
          created_at: string
          feature: string
          id: string
          model: string
          prompt_tokens: number
          user_id: string
        }
        Insert: {
          completion_tokens?: number
          created_at?: string
          feature: string
          id?: string
          model?: string
          prompt_tokens?: number
          user_id: string
        }
        Update: {
          completion_tokens?: number
          created_at?: string
          feature?: string
          id?: string
          model?: string
          prompt_tokens?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          status: string
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          status?: string
          subject?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          status?: string
          subject?: string
        }
        Relationships: []
      }
      cookie_consents: {
        Row: {
          analytics: boolean
          essentials: boolean
          id: string
          marketing: boolean
          session_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          analytics?: boolean
          essentials?: boolean
          id?: string
          marketing?: boolean
          session_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          analytics?: boolean
          essentials?: boolean
          id?: string
          marketing?: boolean
          session_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cookie_consents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      course_materials: {
        Row: {
          course_id: string
          created_at: string
          description: string
          file_name: string
          has_selectable_text: boolean | null
          id: string
          is_published: boolean
          page_count: number
          status: Database["public"]["Enums"]["material_status"]
          storage_path: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string
          file_name?: string
          has_selectable_text?: boolean | null
          id?: string
          is_published?: boolean
          page_count?: number
          status?: Database["public"]["Enums"]["material_status"]
          storage_path: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string
          file_name?: string
          has_selectable_text?: boolean | null
          id?: string
          is_published?: boolean
          page_count?: number
          status?: Database["public"]["Enums"]["material_status"]
          storage_path?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_materials_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_materials_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          academic_level_id: string | null
          code: string
          created_at: string
          created_by: string | null
          department_id: string | null
          description: string
          faculty_id: string | null
          id: string
          is_published: boolean
          semester_id: string | null
          title: string
          university_id: string | null
          updated_at: string
        }
        Insert: {
          academic_level_id?: string | null
          code: string
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          description?: string
          faculty_id?: string | null
          id?: string
          is_published?: boolean
          semester_id?: string | null
          title: string
          university_id?: string | null
          updated_at?: string
        }
        Update: {
          academic_level_id?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          description?: string
          faculty_id?: string | null
          id?: string
          is_published?: boolean
          semester_id?: string | null
          title?: string
          university_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_academic_level_id_fkey"
            columns: ["academic_level_id"]
            isOneToOne: false
            referencedRelation: "academic_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "faculties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_semester_id_fkey"
            columns: ["semester_id"]
            isOneToOne: false
            referencedRelation: "semesters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          code: string | null
          created_at: string
          faculty_id: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          faculty_id: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          faculty_id?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "faculties"
            referencedColumns: ["id"]
          },
        ]
      }
      extracted_questions: {
        Row: {
          correct_option: string | null
          course_id: string | null
          created_at: string
          diagram_path: string | null
          exam_year: number | null
          flags: Json
          id: string
          job_id: string | null
          material_id: string
          options: Json
          page_number: number | null
          question_number: number | null
          question_text: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["review_status"]
          topic: string | null
          updated_at: string
        }
        Insert: {
          correct_option?: string | null
          course_id?: string | null
          created_at?: string
          diagram_path?: string | null
          exam_year?: number | null
          flags?: Json
          id?: string
          job_id?: string | null
          material_id: string
          options?: Json
          page_number?: number | null
          question_number?: number | null
          question_text: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["review_status"]
          topic?: string | null
          updated_at?: string
        }
        Update: {
          correct_option?: string | null
          course_id?: string | null
          created_at?: string
          diagram_path?: string | null
          exam_year?: number | null
          flags?: Json
          id?: string
          job_id?: string | null
          material_id?: string
          options?: Json
          page_number?: number | null
          question_number?: number | null
          question_text?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["review_status"]
          topic?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "extracted_questions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extracted_questions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "pdf_processing_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extracted_questions_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "course_materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extracted_questions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      faculties: {
        Row: {
          code: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          university_id: string
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          university_id: string
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          university_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "faculties_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      flashcard_reviews: {
        Row: {
          id: string
          question_id: string
          reviewed_at: string
          understood: boolean
          user_id: string
        }
        Insert: {
          id?: string
          question_id: string
          reviewed_at?: string
          understood?: boolean
          user_id: string
        }
        Update: {
          id?: string
          question_id?: string
          reviewed_at?: string
          understood?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcard_reviews_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "extracted_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_naira: number
          created_at: string
          email: string
          id: string
          paid_at: string | null
          plan: Database["public"]["Enums"]["membership_plan"]
          provider_response: Json
          reference: string
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_naira: number
          created_at?: string
          email?: string
          id?: string
          paid_at?: string | null
          plan: Database["public"]["Enums"]["membership_plan"]
          provider_response?: Json
          reference: string
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_naira?: number
          created_at?: string
          email?: string
          id?: string
          paid_at?: string | null
          plan?: Database["public"]["Enums"]["membership_plan"]
          provider_response?: Json
          reference?: string
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pdf_processing_jobs: {
        Row: {
          awaiting_review: number
          created_at: string
          duplicates_detected: number
          error_message: string | null
          finished_at: string | null
          id: string
          material_id: string
          ocr_errors: number
          options_extracted: number
          pages_scanned: number
          pages_total: number
          progress_percent: number
          questions_detected: number
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          awaiting_review?: number
          created_at?: string
          duplicates_detected?: number
          error_message?: string | null
          finished_at?: string | null
          id?: string
          material_id: string
          ocr_errors?: number
          options_extracted?: number
          pages_scanned?: number
          pages_total?: number
          progress_percent?: number
          questions_detected?: number
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          awaiting_review?: number
          created_at?: string
          duplicates_detected?: number
          error_message?: string | null
          finished_at?: string | null
          id?: string
          material_id?: string
          ocr_errors?: number
          options_extracted?: number
          pages_scanned?: number
          pages_total?: number
          progress_percent?: number
          questions_detected?: number
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pdf_processing_jobs_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "course_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          academic_level_id: string | null
          avatar_url: string | null
          created_at: string
          department_id: string | null
          faculty_id: string | null
          full_name: string
          id: string
          onboarded: boolean
          semester_id: string | null
          university_id: string | null
          updated_at: string
        }
        Insert: {
          academic_level_id?: string | null
          avatar_url?: string | null
          created_at?: string
          department_id?: string | null
          faculty_id?: string | null
          full_name?: string
          id: string
          onboarded?: boolean
          semester_id?: string | null
          university_id?: string | null
          updated_at?: string
        }
        Update: {
          academic_level_id?: string | null
          avatar_url?: string | null
          created_at?: string
          department_id?: string | null
          faculty_id?: string | null
          full_name?: string
          id?: string
          onboarded?: boolean
          semester_id?: string | null
          university_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_academic_level_id_fkey"
            columns: ["academic_level_id"]
            isOneToOne: false
            referencedRelation: "academic_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "faculties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_semester_id_fkey"
            columns: ["semester_id"]
            isOneToOne: false
            referencedRelation: "semesters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_daily_usage: {
        Row: {
          id: string
          material_id: string
          pages_read: number
          updated_at: string
          usage_date: string
          user_id: string
        }
        Insert: {
          id?: string
          material_id: string
          pages_read?: number
          updated_at?: string
          usage_date: string
          user_id: string
        }
        Update: {
          id?: string
          material_id?: string
          pages_read?: number
          updated_at?: string
          usage_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_daily_usage_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "course_materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reading_daily_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_progress: {
        Row: {
          completed: boolean
          created_at: string
          id: string
          last_page_read: number
          material_id: string
          pages_read_total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          id?: string
          last_page_read?: number
          material_id: string
          pages_read_total?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          id?: string
          last_page_read?: number
          material_id?: string
          pages_read_total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_progress_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "course_materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reading_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          author: string
          body: string
          category: string
          created_at: string
          excerpt: string
          id: string
          published: boolean
          published_at: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          author?: string
          body?: string
          category?: string
          created_at?: string
          excerpt?: string
          id?: string
          published?: boolean
          published_at?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          author?: string
          body?: string
          category?: string
          created_at?: string
          excerpt?: string
          id?: string
          published?: boolean
          published_at?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      semesters: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          position: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          position?: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          position?: number
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "site_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      study_notes: {
        Row: {
          content: string
          course_id: string | null
          created_at: string
          id: string
          topic: string
          user_id: string
        }
        Insert: {
          content: string
          course_id?: string | null
          created_at?: string
          id?: string
          topic: string
          user_id: string
        }
        Update: {
          content?: string
          course_id?: string | null
          created_at?: string
          id?: string
          topic?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_notes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          auto_renew: boolean
          created_at: string
          expires_at: string | null
          id: string
          paystack_reference: string | null
          plan: Database["public"]["Enums"]["membership_plan"]
          started_at: string
          status: Database["public"]["Enums"]["membership_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_renew?: boolean
          created_at?: string
          expires_at?: string | null
          id?: string
          paystack_reference?: string | null
          plan?: Database["public"]["Enums"]["membership_plan"]
          started_at?: string
          status?: Database["public"]["Enums"]["membership_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_renew?: boolean
          created_at?: string
          expires_at?: string | null
          id?: string
          paystack_reference?: string | null
          plan?: Database["public"]["Enums"]["membership_plan"]
          started_at?: string
          status?: Database["public"]["Enums"]["membership_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      universities: {
        Row: {
          code: string | null
          country: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
          website: string | null
        }
        Insert: {
          code?: string | null
          country?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string
          website?: string | null
        }
        Update: {
          code?: string | null
          country?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_material_authorized: {
        Args: { _material_id: string }
        Returns: boolean
      }
      is_super_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "super_admin" | "student"
      material_status: "uploaded" | "processing" | "processed" | "failed"
      membership_plan: "free" | "explorer" | "premium"
      membership_status: "active" | "expired" | "cancelled" | "pending"
      payment_status: "pending" | "success" | "failed" | "abandoned"
      review_status: "pending_review" | "approved" | "rejected" | "published"
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
      app_role: ["super_admin", "student"],
      material_status: ["uploaded", "processing", "processed", "failed"],
      membership_plan: ["free", "explorer", "premium"],
      membership_status: ["active", "expired", "cancelled", "pending"],
      payment_status: ["pending", "success", "failed", "abandoned"],
      review_status: ["pending_review", "approved", "rejected", "published"],
    },
  },
} as const
