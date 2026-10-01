
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {

  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "application_stages": {
                  Row: {
                    "application_id": string,"changed_by": string | null,"created_at": string,"id": string,"justification": string | null,"new_stage": Database["public"]['Enums']["application_status"],"previous_stage": Database["public"]['Enums']["application_status"] | null
                  }
                  Insert: {
                    "application_id": string,"changed_by"?: string | null,"created_at"?: string,"id"?: string,"justification"?: string | null,"new_stage": Database["public"]['Enums']["application_status"],"previous_stage"?: Database["public"]['Enums']["application_status"] | null
                  }
                  Update: {
                    "application_id"?: string,"changed_by"?: string | null,"created_at"?: string,"id"?: string,"justification"?: string | null,"new_stage"?: Database["public"]['Enums']["application_status"],"previous_stage"?: Database["public"]['Enums']["application_status"] | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "application_stages_application_id_fkey"
      columns: ["application_id"]
isOneToOne: false
      referencedRelation: "applications"
      referencedColumns: ["id"]
    }
                  ]
                },"applications": {
                  Row: {
                    "candidate_id": string,"created_at": string,"current_stage": Database["public"]['Enums']["application_status"],"feedback_sent_at": string | null,"id": string,"job_id": string,"last_stage_change_at": string,"match_score": number,"silver_medalist": boolean,"status": Database["public"]['Enums']["application_status"],"updated_at": string
                  }
                  Insert: {
                    "candidate_id": string,"created_at"?: string,"current_stage"?: Database["public"]['Enums']["application_status"],"feedback_sent_at"?: string | null,"id"?: string,"job_id": string,"last_stage_change_at"?: string,"match_score"?: number,"silver_medalist"?: boolean,"status"?: Database["public"]['Enums']["application_status"],"updated_at"?: string
                  }
                  Update: {
                    "candidate_id"?: string,"created_at"?: string,"current_stage"?: Database["public"]['Enums']["application_status"],"feedback_sent_at"?: string | null,"id"?: string,"job_id"?: string,"last_stage_change_at"?: string,"match_score"?: number,"silver_medalist"?: boolean,"status"?: Database["public"]['Enums']["application_status"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "applications_candidate_id_fkey"
      columns: ["candidate_id"]
isOneToOne: false
      referencedRelation: "candidate_profiles"
      referencedColumns: ["user_id"]
    },{
      foreignKeyName: "applications_job_id_fkey"
      columns: ["job_id"]
isOneToOne: false
      referencedRelation: "jobs"
      referencedColumns: ["id"]
    }
                  ]
                },"audit_logs": {
                  Row: {
                    "action": string,"actor_id": string | null,"actor_role": Database["public"]['Enums']["app_role"] | null,"created_at": string,"details": NonNullable<Json>,"id": string,"target_id": string,"target_type": string
                  }
                  Insert: {
                    "action": string,"actor_id"?: string | null,"actor_role"?: Database["public"]['Enums']["app_role"] | null,"created_at"?: string,"details"?: NonNullable<Json>,"id"?: string,"target_id": string,"target_type": string
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"actor_role"?: Database["public"]['Enums']["app_role"] | null,"created_at"?: string,"details"?: NonNullable<Json>,"id"?: string,"target_id"?: string,"target_type"?: string
                  }
                  Relationships: [

                  ]
                },"candidate_profiles": {
                  Row: {
                    "accepted_contract_types": Database["public"]['Enums']["employment_type"][],"accepted_work_models": string[],"bio": string | null,"created_at": string,"current_position": string | null,"deleted_at": string | null,"desired_positions": (string)[],"location": string | null,"phone": string | null,"seniority_general": string | null,"updated_at": string,"user_id": string,"willing_to_relocate": boolean,"years_of_experience": number | null
                  }
                  Insert: {
                    "accepted_contract_types"?: Database["public"]['Enums']["employment_type"][],"accepted_work_models"?: string[],"bio"?: string | null,"created_at"?: string,"current_position"?: string | null,"deleted_at"?: string | null,"desired_positions"?: (string)[],"location"?: string | null,"phone"?: string | null,"seniority_general"?: string | null,"updated_at"?: string,"user_id": string,"willing_to_relocate"?: boolean,"years_of_experience"?: number | null
                  }
                  Update: {
                    "accepted_contract_types"?: Database["public"]['Enums']["employment_type"][],"accepted_work_models"?: string[],"bio"?: string | null,"created_at"?: string,"current_position"?: string | null,"deleted_at"?: string | null,"desired_positions"?: (string)[],"location"?: string | null,"phone"?: string | null,"seniority_general"?: string | null,"updated_at"?: string,"user_id"?: string,"willing_to_relocate"?: boolean,"years_of_experience"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "candidate_profiles_user_id_fkey"
      columns: ["user_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"candidate_private_preferences": {
                  Row: {
                    "created_at": string,"salary_expectation": number | null,"updated_at": string,"user_id": string
                  }
                  Insert: {
                    "created_at"?: string,"salary_expectation"?: number | null,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"salary_expectation"?: number | null,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "candidate_private_preferences_user_id_fkey"
      columns: ["user_id"]
isOneToOne: true
      referencedRelation: "candidate_profiles"
      referencedColumns: ["user_id"]
    }
                  ]
                },"candidate_skills": {
                  Row: {
                    "candidate_id": string,"created_at": string,"declared_level": number,"evidenced_by_project": boolean,"skill_id": string,"updated_at": string
                  }
                  Insert: {
                    "candidate_id": string,"created_at"?: string,"declared_level": number,"evidenced_by_project"?: boolean,"skill_id": string,"updated_at"?: string
                  }
                  Update: {
                    "candidate_id"?: string,"created_at"?: string,"declared_level"?: number,"evidenced_by_project"?: boolean,"skill_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "candidate_skills_candidate_id_fkey"
      columns: ["candidate_id"]
isOneToOne: false
      referencedRelation: "candidate_profiles"
      referencedColumns: ["user_id"]
    },{
      foreignKeyName: "candidate_skills_skill_id_fkey"
      columns: ["skill_id"]
isOneToOne: false
      referencedRelation: "skills"
      referencedColumns: ["id"]
    }
                  ]
                },"companies": {
                  Row: {
                    "created_at": string,"created_by": string,"id": string,"logo_url": string | null,"name": string
                  }
                  Insert: {
                    "created_at"?: string,"created_by": string,"id"?: string,"logo_url"?: string | null,"name": string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string,"id"?: string,"logo_url"?: string | null,"name"?: string
                  }
                  Relationships: [

                  ]
                },"consents": {
                  Row: {
                    "accepted_at": string,"consent_type": string,"id": string,"policy_version": string,"user_id": string,"withdrawn_at": string | null
                  }
                  Insert: {
                    "accepted_at"?: string,"consent_type": string,"id"?: string,"policy_version": string,"user_id": string,"withdrawn_at"?: string | null
                  }
                  Update: {
                    "accepted_at"?: string,"consent_type"?: string,"id"?: string,"policy_version"?: string,"user_id"?: string,"withdrawn_at"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "consents_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"event_log": {
                  Row: {
                    "created_at": string,"event_type": string,"id": string,"metadata": NonNullable<Json>,"session_id": string,"target_id": string,"target_type": string,"user_id": string
                  }
                  Insert: {
                    "created_at"?: string,"event_type": string,"id"?: string,"metadata"?: NonNullable<Json>,"session_id": string,"target_id": string,"target_type": string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"event_type"?: string,"id"?: string,"metadata"?: NonNullable<Json>,"session_id"?: string,"target_id"?: string,"target_type"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "event_log_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"feedbacks": {
                  Row: {
                    "application_id": string,"author_id": string,"content": string,"created_at": string,"id": string,"sent_to_candidate_at": string | null
                  }
                  Insert: {
                    "application_id": string,"author_id": string,"content": string,"created_at"?: string,"id"?: string,"sent_to_candidate_at"?: string | null
                  }
                  Update: {
                    "application_id"?: string,"author_id"?: string,"content"?: string,"created_at"?: string,"id"?: string,"sent_to_candidate_at"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "feedbacks_application_id_fkey"
      columns: ["application_id"]
isOneToOne: false
      referencedRelation: "applications"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "feedbacks_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "recruiter_profiles"
      referencedColumns: ["user_id"]
    }
                  ]
                },"job_skills": {
                  Row: {
                    "created_at": string,"id": string,"job_id": string,"mandatory": boolean,"required_level": number,"skill_id": string,"weight": number
                  }
                  Insert: {
                    "created_at"?: string,"id"?: string,"job_id": string,"mandatory"?: boolean,"required_level": number,"skill_id": string,"weight": number
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"job_id"?: string,"mandatory"?: boolean,"required_level"?: number,"skill_id"?: string,"weight"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "job_skills_job_id_fkey"
      columns: ["job_id"]
isOneToOne: false
      referencedRelation: "jobs"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "job_skills_skill_id_fkey"
      columns: ["skill_id"]
isOneToOne: false
      referencedRelation: "skills"
      referencedColumns: ["id"]
    }
                  ]
                },"jobs": {
                  Row: {
                    "company_id": string | null,"created_at": string,"description": string,"employment_type": Database["public"]['Enums']["employment_type"],"id": string,"location": string,"pipeline_stages": (string)[],"recruiter_id": string,"salary_range": string | null,"status": Database["public"]['Enums']["job_status"],"title": string,"updated_at": string
                  }
                  Insert: {
                    "company_id"?: string | null,"created_at"?: string,"description"?: string,"employment_type": Database["public"]['Enums']["employment_type"],"id"?: string,"location"?: string,"pipeline_stages"?: (string)[],"recruiter_id": string,"salary_range"?: string | null,"status"?: Database["public"]['Enums']["job_status"],"title": string,"updated_at"?: string
                  }
                  Update: {
                    "company_id"?: string | null,"created_at"?: string,"description"?: string,"employment_type"?: Database["public"]['Enums']["employment_type"],"id"?: string,"location"?: string,"pipeline_stages"?: (string)[],"recruiter_id"?: string,"salary_range"?: string | null,"status"?: Database["public"]['Enums']["job_status"],"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "jobs_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "jobs_recruiter_id_fkey"
      columns: ["recruiter_id"]
isOneToOne: false
      referencedRelation: "recruiter_profiles"
      referencedColumns: ["user_id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "avatar_url": string | null,"created_at": string,"deleted_at": string | null,"full_name": string,"id": string,"updated_at": string
                  }
                  Insert: {
                    "avatar_url"?: string | null,"created_at"?: string,"deleted_at"?: string | null,"full_name": string,"id": string,"updated_at"?: string
                  }
                  Update: {
                    "avatar_url"?: string | null,"created_at"?: string,"deleted_at"?: string | null,"full_name"?: string,"id"?: string,"updated_at"?: string
                  }
                  Relationships: [

                  ]
                },"recruiter_profiles": {
                  Row: {
                    "approved_at": string | null,"company_id": string | null,"created_at": string,"phone": string | null,"position": string | null,"updated_at": string,"user_id": string
                  }
                  Insert: {
                    "approved_at"?: string | null,"company_id"?: string | null,"created_at"?: string,"phone"?: string | null,"position"?: string | null,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "approved_at"?: string | null,"company_id"?: string | null,"created_at"?: string,"phone"?: string | null,"position"?: string | null,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "recruiter_profiles_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "recruiter_profiles_user_id_fkey"
      columns: ["user_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"skills": {
                  Row: {
                    "category": Database["public"]['Enums']["skill_category"],"created_at": string,"description": string | null,"id": string,"name": string
                  }
                  Insert: {
                    "category": Database["public"]['Enums']["skill_category"],"created_at"?: string,"description"?: string | null,"id"?: string,"name": string
                  }
                  Update: {
                    "category"?: Database["public"]['Enums']["skill_category"],"created_at"?: string,"description"?: string | null,"id"?: string,"name"?: string
                  }
                  Relationships: [

                  ]
                },"user_roles": {
                  Row: {
                    "created_at": string,"role": Database["public"]['Enums']["app_role"],"user_id": string
                  }
                  Insert: {
                    "created_at"?: string,"role": Database["public"]['Enums']["app_role"],"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"role"?: Database["public"]['Enums']["app_role"],"user_id"?: string
                  }
                  Relationships: [

                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "calculate_application_match_score":
{ Args: { "_candidate_id": string,"_job_id": string }; Returns: number
                           },
"can_recruiter_view_candidate":
{ Args: { "_candidate_id": string }; Returns: boolean
                           },
"has_role":
{ Args: { "_role": Database["public"]['Enums']["app_role"],"_user_id": string }; Returns: boolean
                           },
"is_approved_recruiter":
{ Args: { "_user_id": string }; Returns: boolean
                           }
          }
          Enums: {
            "app_role": "candidate"|"recruiter","application_status": "new_application"|"screening"|"interview"|"final_interview"|"approved"|"rejected"|"withdrawn","employment_type": "CLT"|"PJ"|"Híbrido","job_status": "draft"|"active"|"paused"|"closed","skill_category": "hard"|"soft"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {

          }
        },"public": {
          Enums: {
            "app_role": ["candidate", "recruiter"],"application_status": ["new_application", "screening", "interview", "final_interview", "approved", "rejected", "withdrawn"],"employment_type": ["CLT", "PJ", "Híbrido"],"job_status": ["draft", "active", "paused", "closed"],"skill_category": ["hard", "soft"]
          }
        }
} as const
