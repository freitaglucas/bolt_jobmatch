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
      jobs: {
        Row: {
          id: string
          title: string
          company: string
          location: string
          salary_range: string
          employment_type: 'CLT' | 'PJ' | 'Híbrido'
          description: string
          status: 'Rascunho' | 'Ativa' | 'Pausada' | 'Fechada'
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          company: string
          location: string
          salary_range: string
          employment_type: 'CLT' | 'PJ' | 'Híbrido'
          description: string
          status: 'Rascunho' | 'Ativa' | 'Pausada' | 'Fechada'
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          company?: string
          location?: string
          salary_range?: string
          employment_type?: 'CLT' | 'PJ' | 'Híbrido'
          description?: string
          status?: 'Rascunho' | 'Ativa' | 'Pausada' | 'Fechada'
          created_at?: string
        }
        Relationships: []
      }
      job_skills: {
        Row: {
          id: string
          job_id: string
          skill_name: string
          required_level: number
          weight: number
          mandatory: boolean
        }
        Insert: {
          id?: string
          job_id: string
          skill_name: string
          required_level: number
          weight: number
          mandatory: boolean
        }
        Update: {
          id?: string
          job_id?: string
          skill_name?: string
          required_level?: number
          weight?: number
          mandatory?: boolean
        }
        Relationships: []
      }
      event_log: {
        Row: {
          id: string
          user_id: string
          session_id: string
          event_type: 'score_seen' | 'swipe_decision' | 'application_submitted'
          target_type: string
          target_id: string
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          session_id: string
          event_type: 'score_seen' | 'swipe_decision' | 'application_submitted'
          target_type: string
          target_id: string
          metadata: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_id?: string
          event_type?: 'score_seen' | 'swipe_decision' | 'application_submitted'
          target_type?: string
          target_id?: string
          metadata?: Json
          created_at?: string
        }
        Relationships: []
      }
    },
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

// Para atualizar: npx supabase gen types typescript --project-id <SEU_PROJECT_ID> > src/shared/types/database.ts
