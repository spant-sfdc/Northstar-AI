// Hand-maintained until: npx supabase gen types typescript --project-id bxyctkscticmktyboeco

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          onboarding_complete: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          onboarding_complete?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          onboarding_complete?: boolean
          updated_at?: string
        }
      }
      onboarding_submissions: {
        Row: {
          id: string
          user_id: string
          current_role: string
          experience_level: "junior" | "mid" | "senior" | "staff" | "principal"
          years_of_experience: number
          current_skills: string[]
          resume_storage_path: string | null
          resume_file_name: string | null
          target_role: string
          target_company_size: "startup" | "growth" | "enterprise" | "any"
          target_timeline_months: number
          available_hours_per_week: number
          career_struggles: string[]
          preferred_work_type: "remote" | "hybrid" | "onsite" | "flexible"
          confidence_score: number
          status: "pending" | "processing" | "complete"
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          current_role: string
          experience_level: "junior" | "mid" | "senior" | "staff" | "principal"
          years_of_experience: number
          current_skills: string[]
          resume_storage_path?: string | null
          resume_file_name?: string | null
          target_role: string
          target_company_size: "startup" | "growth" | "enterprise" | "any"
          target_timeline_months: number
          available_hours_per_week: number
          career_struggles: string[]
          preferred_work_type: "remote" | "hybrid" | "onsite" | "flexible"
          confidence_score: number
          status?: "pending" | "processing" | "complete"
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Database["public"]["Tables"]["onboarding_submissions"]["Insert"], "id" | "user_id">>
      }
      roadmaps: {
        Row: {
          id: string
          user_id: string
          title: string
          readiness_score: number | null
          gap_analysis: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          readiness_score?: number | null
          gap_analysis?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Database["public"]["Tables"]["roadmaps"]["Insert"], "id" | "user_id">>
      }
      milestones: {
        Row: {
          id: string
          user_id: string
          roadmap_id: string
          week_number: number
          order_index: number
          title: string
          description: string | null
          category: string
          estimated_hours: number
          success_criteria: string | null
          status: "not_started" | "in_progress" | "complete"
          is_premium: boolean
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          roadmap_id: string
          week_number: number
          order_index?: number
          title: string
          description?: string | null
          category?: string
          estimated_hours?: number
          success_criteria?: string | null
          status?: "not_started" | "in_progress" | "complete"
          is_premium?: boolean
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          title?: string
          description?: string | null
          category?: string
          estimated_hours?: number
          success_criteria?: string | null
          status?: "not_started" | "in_progress" | "complete"
          is_premium?: boolean
          completed_at?: string | null
        }
      }
      weekly_check_ins: {
        Row: {
          id: string
          user_id: string
          week_number: number
          confidence_score: number
          completed_milestone_ids: string[]
          wins: string | null
          blockers: string | null
          ai_feedback: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          week_number: number
          confidence_score: number
          completed_milestone_ids?: string[]
          wins?: string | null
          blockers?: string | null
          ai_feedback?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          confidence_score?: number
          completed_milestone_ids?: string[]
          wins?: string | null
          blockers?: string | null
          ai_feedback?: Json | null
          updated_at?: string
        }
      }
      readiness_snapshots: {
        Row: {
          id: string
          user_id: string
          week_number: number
          readiness_score: number
          confidence_score: number
          milestones_completed: number
          milestones_total: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          week_number: number
          readiness_score: number
          confidence_score: number
          milestones_completed?: number
          milestones_total?: number
          created_at?: string
        }
        Update: {
          readiness_score?: number
          confidence_score?: number
          milestones_completed?: number
          milestones_total?: number
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          razorpay_customer_id: string | null
          razorpay_subscription_id: string | null
          plan: "free" | "pro" | "premium" | "advanced"
          status: "active" | "canceled" | "past_due"
          trial_ends_at: string | null
          current_period_end: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          razorpay_customer_id?: string | null
          razorpay_subscription_id?: string | null
          plan?: "free" | "pro" | "premium" | "advanced"
          status?: "active" | "canceled" | "past_due"
          trial_ends_at?: string | null
          current_period_end?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Database["public"]["Tables"]["subscriptions"]["Insert"], "id" | "user_id">>
      }
    }
  }
}

// ─── Convenience row types ────────────────────────────────────────────────────

export type Profile           = Database["public"]["Tables"]["profiles"]["Row"]
export type OnboardingRow     = Database["public"]["Tables"]["onboarding_submissions"]["Row"]
export type Roadmap           = Database["public"]["Tables"]["roadmaps"]["Row"]
export type DbMilestone       = Database["public"]["Tables"]["milestones"]["Row"]
export type WeeklyCheckIn     = Database["public"]["Tables"]["weekly_check_ins"]["Row"]
export type ReadinessSnapshot = Database["public"]["Tables"]["readiness_snapshots"]["Row"]
export type Subscription      = Database["public"]["Tables"]["subscriptions"]["Row"]
