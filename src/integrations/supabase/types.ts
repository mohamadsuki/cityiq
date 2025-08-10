export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          age_group: string | null
          category: string | null
          created_at: string
          department_slug: Database["public"]["Enums"]["department_slug"] | null
          id: string
          location: string | null
          name: string | null
          participants: number | null
          program: string | null
          scheduled_at: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          age_group?: string | null
          category?: string | null
          created_at?: string
          department_slug?:
            | Database["public"]["Enums"]["department_slug"]
            | null
          id?: string
          location?: string | null
          name?: string | null
          participants?: number | null
          program?: string | null
          scheduled_at?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          age_group?: string | null
          category?: string | null
          created_at?: string
          department_slug?:
            | Database["public"]["Enums"]["department_slug"]
            | null
          id?: string
          location?: string | null
          name?: string | null
          participants?: number | null
          program?: string | null
          scheduled_at?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      app_health: {
        Row: {
          created_at: string
          id: number
          message: string
        }
        Insert: {
          created_at?: string
          id?: number
          message?: string
        }
        Update: {
          created_at?: string
          id?: number
          message?: string
        }
        Relationships: []
      }
      grants: {
        Row: {
          amount: number | null
          created_at: string
          decision_at: string | null
          department_slug: Database["public"]["Enums"]["department_slug"] | null
          id: string
          ministry: string | null
          name: string | null
          status: string | null
          submitted_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          decision_at?: string | null
          department_slug?:
            | Database["public"]["Enums"]["department_slug"]
            | null
          id?: string
          ministry?: string | null
          name?: string | null
          status?: string | null
          submitted_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          decision_at?: string | null
          department_slug?:
            | Database["public"]["Enums"]["department_slug"]
            | null
          id?: string
          ministry?: string | null
          name?: string | null
          status?: string | null
          submitted_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ingestion_logs: {
        Row: {
          created_at: string
          error: string | null
          id: string
          rows: number | null
          source_file: string | null
          status: string | null
          table_name: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          rows?: number | null
          source_file?: string | null
          status?: string | null
          table_name?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          rows?: number | null
          source_file?: string | null
          status?: string | null
          table_name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      institutions: {
        Row: {
          address: string | null
          classes: number | null
          created_at: string
          department_slug: Database["public"]["Enums"]["department_slug"] | null
          id: string
          lat: number | null
          level: string | null
          lng: number | null
          name: string | null
          occupancy: number | null
          students: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          classes?: number | null
          created_at?: string
          department_slug?:
            | Database["public"]["Enums"]["department_slug"]
            | null
          id?: string
          lat?: number | null
          level?: string | null
          lng?: number | null
          name?: string | null
          occupancy?: number | null
          students?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          classes?: number | null
          created_at?: string
          department_slug?:
            | Database["public"]["Enums"]["department_slug"]
            | null
          id?: string
          lat?: number | null
          level?: string | null
          lng?: number | null
          name?: string | null
          occupancy?: number | null
          students?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      licenses: {
        Row: {
          address: string | null
          business_name: string | null
          created_at: string
          department_slug: Database["public"]["Enums"]["department_slug"] | null
          expires_at: string | null
          id: string
          lat: number | null
          license_number: string | null
          lng: number | null
          owner: string | null
          status: string | null
          type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          business_name?: string | null
          created_at?: string
          department_slug?:
            | Database["public"]["Enums"]["department_slug"]
            | null
          expires_at?: string | null
          id?: string
          lat?: number | null
          license_number?: string | null
          lng?: number | null
          owner?: string | null
          status?: string | null
          type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          business_name?: string | null
          created_at?: string
          department_slug?:
            | Database["public"]["Enums"]["department_slug"]
            | null
          expires_at?: string | null
          id?: string
          lat?: number | null
          license_number?: string | null
          lng?: number | null
          owner?: string | null
          status?: string | null
          type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          address: string | null
          area: number | null
          block: string | null
          created_at: string
          department_slug: Database["public"]["Enums"]["department_slug"] | null
          id: string
          land_use: string | null
          lat: number | null
          lng: number | null
          name: string | null
          parcel: string | null
          plan_number: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          area?: number | null
          block?: string | null
          created_at?: string
          department_slug?:
            | Database["public"]["Enums"]["department_slug"]
            | null
          id?: string
          land_use?: string | null
          lat?: number | null
          lng?: number | null
          name?: string | null
          parcel?: string | null
          plan_number?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          area?: number | null
          block?: string | null
          created_at?: string
          department_slug?:
            | Database["public"]["Enums"]["department_slug"]
            | null
          id?: string
          land_use?: string | null
          lat?: number | null
          lng?: number | null
          name?: string | null
          parcel?: string | null
          plan_number?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          budget_approved: number | null
          budget_executed: number | null
          code: string | null
          created_at: string
          department: string | null
          department_slug: Database["public"]["Enums"]["department_slug"] | null
          domain: string | null
          funding_source: string | null
          id: string
          name: string | null
          progress: number | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          budget_approved?: number | null
          budget_executed?: number | null
          code?: string | null
          created_at?: string
          department?: string | null
          department_slug?:
            | Database["public"]["Enums"]["department_slug"]
            | null
          domain?: string | null
          funding_source?: string | null
          id?: string
          name?: string | null
          progress?: number | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          budget_approved?: number | null
          budget_executed?: number | null
          code?: string | null
          created_at?: string
          department?: string | null
          department_slug?:
            | Database["public"]["Enums"]["department_slug"]
            | null
          domain?: string | null
          funding_source?: string | null
          id?: string
          name?: string | null
          progress?: number | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_departments: {
        Row: {
          created_at: string
          department: Database["public"]["Enums"]["department_slug"]
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          department: Database["public"]["Enums"]["department_slug"]
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          department?: Database["public"]["Enums"]["department_slug"]
          id?: string
          user_id?: string
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
      welfare_services: {
        Row: {
          budget_allocated: number | null
          created_at: string
          department_slug: Database["public"]["Enums"]["department_slug"] | null
          id: string
          period: string | null
          recipients: number | null
          service_type: string | null
          updated_at: string
          user_id: string
          utilization: number | null
          waitlist: number | null
        }
        Insert: {
          budget_allocated?: number | null
          created_at?: string
          department_slug?:
            | Database["public"]["Enums"]["department_slug"]
            | null
          id?: string
          period?: string | null
          recipients?: number | null
          service_type?: string | null
          updated_at?: string
          user_id: string
          utilization?: number | null
          waitlist?: number | null
        }
        Update: {
          budget_allocated?: number | null
          created_at?: string
          department_slug?:
            | Database["public"]["Enums"]["department_slug"]
            | null
          id?: string
          period?: string | null
          recipients?: number | null
          service_type?: string | null
          updated_at?: string
          user_id?: string
          utilization?: number | null
          waitlist?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_department: {
        Args: {
          _user_id: string
          _department: Database["public"]["Enums"]["department_slug"]
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "mayor" | "manager"
      department_slug:
        | "finance"
        | "education"
        | "engineering"
        | "welfare"
        | "non-formal"
        | "business"
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
      app_role: ["mayor", "manager"],
      department_slug: [
        "finance",
        "education",
        "engineering",
        "welfare",
        "non-formal",
        "business",
      ],
    },
  },
} as const
