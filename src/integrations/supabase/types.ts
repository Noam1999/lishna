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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          achievement_type: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_type: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_type?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      activity_celebrations: {
        Row: {
          activity_id: string
          celebration_type: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          activity_id: string
          celebration_type?: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          activity_id?: string
          celebration_type?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_celebrations_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "user_activities"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_submissions: {
        Row: {
          assignment_id: string
          details: Json | null
          id: string
          score: number
          student_id: string
          submitted_at: string
          total: number
        }
        Insert: {
          assignment_id: string
          details?: Json | null
          id?: string
          score?: number
          student_id: string
          submitted_at?: string
          total?: number
        }
        Update: {
          assignment_id?: string
          details?: Json | null
          id?: string
          score?: number
          student_id?: string
          submitted_at?: string
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "assignment_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          class_id: string
          created_at: string
          due_at: string | null
          id: string
          settings: Json
          teacher_id: string
          title: string
          type: string
          word_ids: number[]
        }
        Insert: {
          class_id: string
          created_at?: string
          due_at?: string | null
          id?: string
          settings?: Json
          teacher_id: string
          title: string
          type?: string
          word_ids?: number[]
        }
        Update: {
          class_id?: string
          created_at?: string
          due_at?: string | null
          id?: string
          settings?: Json
          teacher_id?: string
          title?: string
          type?: string
          word_ids?: number[]
        }
        Relationships: [
          {
            foreignKeyName: "assignments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      class_mail: {
        Row: {
          body: string
          class_id: string
          created_at: string
          id: string
          subject: string | null
          teacher_id: string
        }
        Insert: {
          body: string
          class_id: string
          created_at?: string
          id?: string
          subject?: string | null
          teacher_id: string
        }
        Update: {
          body?: string
          class_id?: string
          created_at?: string
          id?: string
          subject?: string | null
          teacher_id?: string
        }
        Relationships: []
      }
      class_members: {
        Row: {
          class_id: string
          id: string
          joined_at: string
          student_id: string
        }
        Insert: {
          class_id: string
          id?: string
          joined_at?: string
          student_id: string
        }
        Update: {
          class_id?: string
          id?: string
          joined_at?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_members_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          class_code: string
          created_at: string
          forbidden_words: string[]
          id: string
          name: string
          school_id: string | null
          teacher_id: string
        }
        Insert: {
          class_code: string
          created_at?: string
          forbidden_words?: string[]
          id?: string
          name: string
          school_id?: string | null
          teacher_id: string
        }
        Update: {
          class_code?: string
          created_at?: string
          forbidden_words?: string[]
          id?: string
          name?: string
          school_id?: string | null
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_words: {
        Row: {
          aramaic: string
          created_at: string
          cultural_context: string
          hebrew: string
          id: number
          word_type: string
        }
        Insert: {
          aramaic: string
          created_at?: string
          cultural_context?: string
          hebrew: string
          id?: number
          word_type?: string
        }
        Update: {
          aramaic?: string
          created_at?: string
          cultural_context?: string
          hebrew?: string
          id?: number
          word_type?: string
        }
        Relationships: []
      }
      daily_quests: {
        Row: {
          bonus_xp: number
          claimed: boolean
          completed: boolean
          created_at: string
          current_value: number
          id: string
          quest_date: string
          quest_type: string
          target_value: number
          user_id: string
        }
        Insert: {
          bonus_xp?: number
          claimed?: boolean
          completed?: boolean
          created_at?: string
          current_value?: number
          id?: string
          quest_date?: string
          quest_type: string
          target_value: number
          user_id: string
        }
        Update: {
          bonus_xp?: number
          claimed?: boolean
          completed?: boolean
          created_at?: string
          current_value?: number
          id?: string
          quest_date?: string
          quest_type?: string
          target_value?: number
          user_id?: string
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          read_at: string | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      duels: {
        Row: {
          code: string
          created_at: string
          current_question: number
          guest_answer: Json | null
          guest_id: string | null
          guest_score: number
          host_answer: Json | null
          host_id: string
          host_score: number
          id: string
          questions: Json
          status: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          current_question?: number
          guest_answer?: Json | null
          guest_id?: string | null
          guest_score?: number
          host_answer?: Json | null
          host_id: string
          host_score?: number
          id?: string
          questions?: Json
          status?: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          current_question?: number
          guest_answer?: Json | null
          guest_id?: string | null
          guest_score?: number
          host_answer?: Json | null
          host_id?: string
          host_score?: number
          id?: string
          questions?: Json
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      feedback: {
        Row: {
          created_at: string
          email: string | null
          feedback_type: string
          id: string
          message: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          feedback_type?: string
          id?: string
          message: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          feedback_type?: string
          id?: string
          message?: string
          user_id?: string | null
        }
        Relationships: []
      }
      friendships: {
        Row: {
          created_at: string
          friend_id: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_id: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          friend_id?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          coin_multiplier_remaining: number
          coins: number
          created_at: string
          daily_xp: number
          diamonds: number
          display_name: string | null
          equipped_skin: string
          id: string
          last_perk_grant_date: string | null
          last_quiz_date: string | null
          last_wheel_spin_at: string | null
          last_xp_date: string | null
          owned_skins: string[]
          pass_claims_free: number[]
          pass_claims_plus: number[]
          pass_claims_pro: number[]
          pass_plus: boolean
          pass_pro: boolean
          points: number
          power_up_5050: number
          streak: number
          updated_at: string
          user_id: string
          username: string | null
          week_start_date: string | null
          weekly_points: number
          wheel_spins: number
          words_mastered: number
          xp_multiplier_remaining: number
        }
        Insert: {
          avatar_url?: string | null
          coin_multiplier_remaining?: number
          coins?: number
          created_at?: string
          daily_xp?: number
          diamonds?: number
          display_name?: string | null
          equipped_skin?: string
          id?: string
          last_perk_grant_date?: string | null
          last_quiz_date?: string | null
          last_wheel_spin_at?: string | null
          last_xp_date?: string | null
          owned_skins?: string[]
          pass_claims_free?: number[]
          pass_claims_plus?: number[]
          pass_claims_pro?: number[]
          pass_plus?: boolean
          pass_pro?: boolean
          points?: number
          power_up_5050?: number
          streak?: number
          updated_at?: string
          user_id: string
          username?: string | null
          week_start_date?: string | null
          weekly_points?: number
          wheel_spins?: number
          words_mastered?: number
          xp_multiplier_remaining?: number
        }
        Update: {
          avatar_url?: string | null
          coin_multiplier_remaining?: number
          coins?: number
          created_at?: string
          daily_xp?: number
          diamonds?: number
          display_name?: string | null
          equipped_skin?: string
          id?: string
          last_perk_grant_date?: string | null
          last_quiz_date?: string | null
          last_wheel_spin_at?: string | null
          last_xp_date?: string | null
          owned_skins?: string[]
          pass_claims_free?: number[]
          pass_claims_plus?: number[]
          pass_claims_pro?: number[]
          pass_plus?: boolean
          pass_pro?: boolean
          points?: number
          power_up_5050?: number
          streak?: number
          updated_at?: string
          user_id?: string
          username?: string | null
          week_start_date?: string | null
          weekly_points?: number
          wheel_spins?: number
          words_mastered?: number
          xp_multiplier_remaining?: number
        }
        Relationships: []
      }
      school_members: {
        Row: {
          id: string
          joined_at: string
          school_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          school_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          school_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_members_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          created_at: string
          id: string
          name: string
          school_code: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          school_code: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          school_code?: string
        }
        Relationships: []
      }
      season_history: {
        Row: {
          created_at: string
          final_points: number
          final_rank: number
          id: string
          user_id: string
          week_number: number
          year: number
        }
        Insert: {
          created_at?: string
          final_points?: number
          final_rank: number
          id?: string
          user_id: string
          week_number: number
          year: number
        }
        Update: {
          created_at?: string
          final_points?: number
          final_rank?: number
          id?: string
          user_id?: string
          week_number?: number
          year?: number
        }
        Relationships: []
      }
      system_mail: {
        Row: {
          body: string
          created_at: string
          id: string
          kind: string
          meta: Json | null
          read_at: string | null
          recipient_id: string
          sender_id: string | null
          title: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          kind?: string
          meta?: Json | null
          read_at?: string | null
          recipient_id: string
          sender_id?: string | null
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          kind?: string
          meta?: Json | null
          read_at?: string | null
          recipient_id?: string
          sender_id?: string | null
          title?: string
        }
        Relationships: []
      }
      user_activities: {
        Row: {
          activity_data: Json | null
          activity_type: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          activity_data?: Json | null
          activity_type: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          activity_data?: Json | null
          activity_type?: string
          created_at?: string
          id?: string
          user_id?: string
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
      user_words: {
        Row: {
          id: string
          learned_at: string
          user_id: string
          word_id: number
        }
        Insert: {
          id?: string
          learned_at?: string
          user_id: string
          word_id: number
        }
        Update: {
          id?: string
          learned_at?: string
          user_id?: string
          word_id?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      duel_answer_slot_empty: { Args: never; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_class_member: {
        Args: { _class_id: string; _user_id: string }
        Returns: boolean
      }
      is_class_teacher: {
        Args: { _class_id: string; _user_id: string }
        Returns: boolean
      }
      is_school_member: {
        Args: { _school_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "teacher"
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
      app_role: ["admin", "moderator", "user", "teacher"],
    },
  },
} as const
