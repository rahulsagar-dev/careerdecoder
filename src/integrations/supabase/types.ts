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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      active_generations: {
        Row: {
          feature: string
          id: string
          started_at: string
          user_id: string
        }
        Insert: {
          feature: string
          id?: string
          started_at?: string
          user_id: string
        }
        Update: {
          feature?: string
          id?: string
          started_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bug_reports: {
        Row: {
          browser_info: string | null
          created_at: string
          description: string
          expected_behavior: string | null
          id: string
          page_url: string | null
          screenshot_url: string | null
          severity: string
          status: string
          steps_to_reproduce: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          browser_info?: string | null
          created_at?: string
          description: string
          expected_behavior?: string | null
          id?: string
          page_url?: string | null
          screenshot_url?: string | null
          severity?: string
          status?: string
          steps_to_reproduce?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          browser_info?: string | null
          created_at?: string
          description?: string
          expected_behavior?: string | null
          id?: string
          page_url?: string | null
          screenshot_url?: string | null
          severity?: string
          status?: string
          steps_to_reproduce?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      career_recommendations: {
        Row: {
          career_title: string
          created_at: string
          description: string | null
          id: string
          input_hash: string | null
          match_score: number
          missing_skills: string[] | null
          required_skills: string[] | null
          salary_range: string | null
          user_id: string
        }
        Insert: {
          career_title: string
          created_at?: string
          description?: string | null
          id?: string
          input_hash?: string | null
          match_score?: number
          missing_skills?: string[] | null
          required_skills?: string[] | null
          salary_range?: string | null
          user_id: string
        }
        Update: {
          career_title?: string
          created_at?: string
          description?: string | null
          id?: string
          input_hash?: string | null
          match_score?: number
          missing_skills?: string[] | null
          required_skills?: string[] | null
          salary_range?: string | null
          user_id?: string
        }
        Relationships: []
      }
      feedback: {
        Row: {
          context: string
          created_at: string
          id: string
          rating: string
          user_id: string | null
        }
        Insert: {
          context: string
          created_at?: string
          id?: string
          rating: string
          user_id?: string | null
        }
        Update: {
          context?: string
          created_at?: string
          id?: string
          rating?: string
          user_id?: string | null
        }
        Relationships: []
      }
      github_analysis: {
        Row: {
          created_at: string
          github_url: string
          id: string
          languages: string[] | null
          portfolio_score: number
          strengths: string[] | null
          total_commits: number
          total_repos: number
          user_id: string
          weaknesses: string[] | null
        }
        Insert: {
          created_at?: string
          github_url: string
          id?: string
          languages?: string[] | null
          portfolio_score?: number
          strengths?: string[] | null
          total_commits?: number
          total_repos?: number
          user_id: string
          weaknesses?: string[] | null
        }
        Update: {
          created_at?: string
          github_url?: string
          id?: string
          languages?: string[] | null
          portfolio_score?: number
          strengths?: string[] | null
          total_commits?: number
          total_repos?: number
          user_id?: string
          weaknesses?: string[] | null
        }
        Relationships: []
      }
      interview_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          sender: string
          session_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string
          sender?: string
          session_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          sender?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "interview_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_sessions: {
        Row: {
          created_at: string
          current_question_index: number
          difficulty_level: string
          feedback: Json | null
          follow_up_count: number
          id: string
          mode: string
          role: string
          score: number
          topics_covered: string[]
          user_id: string
          weak_topics: string[]
        }
        Insert: {
          created_at?: string
          current_question_index?: number
          difficulty_level?: string
          feedback?: Json | null
          follow_up_count?: number
          id?: string
          mode?: string
          role?: string
          score?: number
          topics_covered?: string[]
          user_id: string
          weak_topics?: string[]
        }
        Update: {
          created_at?: string
          current_question_index?: number
          difficulty_level?: string
          feedback?: Json | null
          follow_up_count?: number
          id?: string
          mode?: string
          role?: string
          score?: number
          topics_covered?: string[]
          user_id?: string
          weak_topics?: string[]
        }
        Relationships: []
      }
      learning_roadmaps: {
        Row: {
          career_title: string
          completed_steps: number
          created_at: string
          id: string
          progress: number
          total_steps: number
          user_id: string
        }
        Insert: {
          career_title: string
          completed_steps?: number
          created_at?: string
          id?: string
          progress?: number
          total_steps?: number
          user_id: string
        }
        Update: {
          career_title?: string
          completed_steps?: number
          created_at?: string
          id?: string
          progress?: number
          total_steps?: number
          user_id?: string
        }
        Relationships: []
      }
      linkedin_analysis: {
        Row: {
          about_score: number
          created_at: string
          experience_score: number
          headline_score: number
          id: string
          input_hash: string | null
          keyword_gaps: Json
          overall_score: number
          parsed_text: string | null
          skills_score: number
          strengths: Json
          suggestions: Json
          target_career: string | null
          updated_at: string
          user_id: string
          weaknesses: Json
        }
        Insert: {
          about_score?: number
          created_at?: string
          experience_score?: number
          headline_score?: number
          id?: string
          input_hash?: string | null
          keyword_gaps?: Json
          overall_score?: number
          parsed_text?: string | null
          skills_score?: number
          strengths?: Json
          suggestions?: Json
          target_career?: string | null
          updated_at?: string
          user_id: string
          weaknesses?: Json
        }
        Update: {
          about_score?: number
          created_at?: string
          experience_score?: number
          headline_score?: number
          id?: string
          input_hash?: string | null
          keyword_gaps?: Json
          overall_score?: number
          parsed_text?: string | null
          skills_score?: number
          strengths?: Json
          suggestions?: Json
          target_career?: string | null
          updated_at?: string
          user_id?: string
          weaknesses?: Json
        }
        Relationships: []
      }
      market_data: {
        Row: {
          competition_level: string | null
          created_at: string
          declining_skills: string[] | null
          demand_level: string | null
          high_impact_skills: string[] | null
          id: string
          input_hash: string | null
          insights: string | null
          last_updated: string | null
          market_position_score: number | null
          role: string
          role_growth_rate: number | null
          salary_range: string | null
          skill_demand_scores: Json | null
          strategy_plan: string[] | null
          trending_skills: string[] | null
          user_id: string
        }
        Insert: {
          competition_level?: string | null
          created_at?: string
          declining_skills?: string[] | null
          demand_level?: string | null
          high_impact_skills?: string[] | null
          id?: string
          input_hash?: string | null
          insights?: string | null
          last_updated?: string | null
          market_position_score?: number | null
          role?: string
          role_growth_rate?: number | null
          salary_range?: string | null
          skill_demand_scores?: Json | null
          strategy_plan?: string[] | null
          trending_skills?: string[] | null
          user_id: string
        }
        Update: {
          competition_level?: string | null
          created_at?: string
          declining_skills?: string[] | null
          demand_level?: string | null
          high_impact_skills?: string[] | null
          id?: string
          input_hash?: string | null
          insights?: string | null
          last_updated?: string | null
          market_position_score?: number | null
          role?: string
          role_growth_rate?: number | null
          salary_range?: string | null
          skill_demand_scores?: Json | null
          strategy_plan?: string[] | null
          trending_skills?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      payment_events: {
        Row: {
          event_id: string | null
          event_type: string
          id: string
          payload: Json
          processed_at: string
          provider: string
          user_id: string | null
        }
        Insert: {
          event_id?: string | null
          event_type: string
          id?: string
          payload: Json
          processed_at?: string
          provider: string
          user_id?: string | null
        }
        Update: {
          event_id?: string | null
          event_type?: string
          id?: string
          payload?: Json
          processed_at?: string
          provider?: string
          user_id?: string | null
        }
        Relationships: []
      }
      pending_generations: {
        Row: {
          attempts: number
          created_at: string
          error_message: string | null
          feature: string
          id: string
          payload: Json
          result: Json | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          error_message?: string | null
          feature: string
          id?: string
          payload?: Json
          result?: Json | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attempts?: number
          created_at?: string
          error_message?: string | null
          feature?: string
          id?: string
          payload?: Json
          result?: Json | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          career_goal: string | null
          college: string | null
          created_at: string
          degree: string | null
          education: string | null
          full_name: string | null
          github_url: string | null
          graduation_year: number | null
          id: string
          interests: string[] | null
          is_admin: boolean
          resume_url: string | null
          skills: string[] | null
        }
        Insert: {
          career_goal?: string | null
          college?: string | null
          created_at?: string
          degree?: string | null
          education?: string | null
          full_name?: string | null
          github_url?: string | null
          graduation_year?: number | null
          id?: string
          interests?: string[] | null
          is_admin?: boolean
          resume_url?: string | null
          skills?: string[] | null
        }
        Update: {
          career_goal?: string | null
          college?: string | null
          created_at?: string
          degree?: string | null
          education?: string | null
          full_name?: string | null
          github_url?: string | null
          graduation_year?: number | null
          id?: string
          interests?: string[] | null
          is_admin?: boolean
          resume_url?: string | null
          skills?: string[] | null
        }
        Relationships: []
      }
      project_suggestions: {
        Row: {
          created_at: string
          description: string
          difficulty: string
          estimated_time: string
          id: string
          project_link: string | null
          skills_covered: string[] | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          difficulty?: string
          estimated_time?: string
          id?: string
          project_link?: string | null
          skills_covered?: string[] | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          difficulty?: string
          estimated_time?: string
          id?: string
          project_link?: string | null
          skills_covered?: string[] | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          active: boolean
          applies_to: string
          code: string
          created_at: string
          created_by: string | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          max_redemptions: number | null
          redemption_count: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          applies_to?: string
          code: string
          created_at?: string
          created_by?: string | null
          discount_type: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          max_redemptions?: number | null
          redemption_count?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          applies_to?: string
          code?: string
          created_at?: string
          created_by?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          max_redemptions?: number | null
          redemption_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      promo_redemptions: {
        Row: {
          discount_applied_paise: number
          id: string
          order_id: string | null
          promo_code_id: string
          redeemed_at: string
          user_id: string
        }
        Insert: {
          discount_applied_paise?: number
          id?: string
          order_id?: string | null
          promo_code_id: string
          redeemed_at?: string
          user_id: string
        }
        Update: {
          discount_applied_paise?: number
          id?: string
          order_id?: string | null
          promo_code_id?: string
          redeemed_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_redemptions_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          code: string
          created_at: string
          id: string
          referred_user_id: string
          referrer_user_id: string
          reward_days: number
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          referred_user_id: string
          referrer_user_id: string
          reward_days?: number
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          referred_user_id?: string
          referrer_user_id?: string
          reward_days?: number
        }
        Relationships: []
      }
      repo_analysis: {
        Row: {
          analysis_id: string
          commit_count: number
          complexity_score: number
          created_at: string
          description: string | null
          forks: number
          id: string
          primary_language: string | null
          repo_name: string
          stars: number
          strengths: string[] | null
          weaknesses: string[] | null
        }
        Insert: {
          analysis_id: string
          commit_count?: number
          complexity_score?: number
          created_at?: string
          description?: string | null
          forks?: number
          id?: string
          primary_language?: string | null
          repo_name: string
          stars?: number
          strengths?: string[] | null
          weaknesses?: string[] | null
        }
        Update: {
          analysis_id?: string
          commit_count?: number
          complexity_score?: number
          created_at?: string
          description?: string | null
          forks?: number
          id?: string
          primary_language?: string | null
          repo_name?: string
          stars?: number
          strengths?: string[] | null
          weaknesses?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "repo_analysis_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "github_analysis"
            referencedColumns: ["id"]
          },
        ]
      }
      resume_analysis: {
        Row: {
          ats_score: number
          created_at: string
          extracted_experience: Json | null
          extracted_projects: Json | null
          extracted_skills: string[] | null
          id: string
          input_hash: string | null
          strengths: string[] | null
          suggestions: string[] | null
          tech_stack: string[] | null
          user_id: string
          weaknesses: string[] | null
        }
        Insert: {
          ats_score?: number
          created_at?: string
          extracted_experience?: Json | null
          extracted_projects?: Json | null
          extracted_skills?: string[] | null
          id?: string
          input_hash?: string | null
          strengths?: string[] | null
          suggestions?: string[] | null
          tech_stack?: string[] | null
          user_id: string
          weaknesses?: string[] | null
        }
        Update: {
          ats_score?: number
          created_at?: string
          extracted_experience?: Json | null
          extracted_projects?: Json | null
          extracted_skills?: string[] | null
          id?: string
          input_hash?: string | null
          strengths?: string[] | null
          suggestions?: string[] | null
          tech_stack?: string[] | null
          user_id?: string
          weaknesses?: string[] | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          approved_at: string | null
          avatar_initials: string
          created_at: string
          id: string
          name: string
          quote: string
          rating: number
          role: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          avatar_initials: string
          created_at?: string
          id?: string
          name: string
          quote: string
          rating: number
          role?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          avatar_initials?: string
          created_at?: string
          id?: string
          name?: string
          quote?: string
          rating?: number
          role?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      roadmap_steps: {
        Row: {
          created_at: string
          description: string
          estimated_time: string
          id: string
          resources: string[] | null
          roadmap_id: string
          status: string
          step_order: number
          title: string
        }
        Insert: {
          created_at?: string
          description: string
          estimated_time: string
          id?: string
          resources?: string[] | null
          roadmap_id: string
          status?: string
          step_order: number
          title: string
        }
        Update: {
          created_at?: string
          description?: string
          estimated_time?: string
          id?: string
          resources?: string[] | null
          roadmap_id?: string
          status?: string
          step_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "roadmap_steps_roadmap_id_fkey"
            columns: ["roadmap_id"]
            isOneToOne: false
            referencedRelation: "learning_roadmaps"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_analysis: {
        Row: {
          created_at: string
          id: string
          input_hash: string | null
          matched_skills: number
          missing_skills: number
          readiness_score: number
          skill_distribution: Json | null
          total_skills: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          input_hash?: string | null
          matched_skills?: number
          missing_skills?: number
          readiness_score?: number
          skill_distribution?: Json | null
          total_skills?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          input_hash?: string | null
          matched_skills?: number
          missing_skills?: number
          readiness_score?: number
          skill_distribution?: Json | null
          total_skills?: number
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          billing_interval: string | null
          cancel_at_period_end: boolean
          created_at: string
          currency: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan: string
          provider: string
          provider_customer_id: string | null
          provider_subscription_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_interval?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          currency?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: string
          provider?: string
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_interval?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          currency?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: string
          provider?: string
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          category: string
          created_at: string
          email: string
          id: string
          message: string
          status: string
          subject: string
          user_id: string | null
        }
        Insert: {
          category: string
          created_at?: string
          email: string
          id?: string
          message: string
          status?: string
          subject: string
          user_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          email?: string
          id?: string
          message?: string
          status?: string
          subject?: string
          user_id?: string | null
        }
        Relationships: []
      }
      usage_counters: {
        Row: {
          count: number
          created_at: string
          feature: string
          id: string
          period_start: string
          updated_at: string
          user_id: string
        }
        Insert: {
          count?: number
          created_at?: string
          feature: string
          id?: string
          period_start?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          count?: number
          created_at?: string
          feature?: string
          id?: string
          period_start?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_referral_codes: {
        Row: {
          code: string
          created_at: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      redeem_promo: {
        Args: {
          _code_id: string
          _discount_paise: number
          _order_id: string
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
