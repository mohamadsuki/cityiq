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
      budget_authorizations: {
        Row: {
          amount: number | null
          approved_at: string | null
          authorization_number: string | null
          created_at: string
          department_slug: Database["public"]["Enums"]["department_slug"] | null
          id: string
          ministry: string | null
          notes: string | null
          program: string | null
          purpose: string | null
          status: string | null
          submitted_at: string | null
          updated_at: string
          user_id: string
          valid_until: string | null
        }
        Insert: {
          amount?: number | null
          approved_at?: string | null
          authorization_number?: string | null
          created_at?: string
          department_slug?:
            | Database["public"]["Enums"]["department_slug"]
            | null
          id?: string
          ministry?: string | null
          notes?: string | null
          program?: string | null
          purpose?: string | null
          status?: string | null
          submitted_at?: string | null
          updated_at?: string
          user_id: string
          valid_until?: string | null
        }
        Update: {
          amount?: number | null
          approved_at?: string | null
          authorization_number?: string | null
          created_at?: string
          department_slug?:
            | Database["public"]["Enums"]["department_slug"]
            | null
          id?: string
          ministry?: string | null
          notes?: string | null
          program?: string | null
          purpose?: string | null
          status?: string | null
          submitted_at?: string | null
          updated_at?: string
          user_id?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      budgets: {
        Row: {
          amount_approved: number | null
          amount_spent: number | null
          created_at: string
          department_slug: Database["public"]["Enums"]["department_slug"] | null
          id: string
          item_name: string | null
          notes: string | null
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          amount_approved?: number | null
          amount_spent?: number | null
          created_at?: string
          department_slug?:
            | Database["public"]["Enums"]["department_slug"]
            | null
          id?: string
          item_name?: string | null
          notes?: string | null
          updated_at?: string
          user_id: string
          year?: number
        }
        Update: {
          amount_approved?: number | null
          amount_spent?: number | null
          created_at?: string
          department_slug?:
            | Database["public"]["Enums"]["department_slug"]
            | null
          id?: string
          item_name?: string | null
          notes?: string | null
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      city_settings: {
        Row: {
          city_name: string | null
          created_at: string
          id: string
          logo_url: string | null
          population: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          city_name?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          population?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          city_name?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          population?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      collection_data: {
        Row: {
          actual_collection: number | null
          annual_budget: number | null
          created_at: string
          excel_cell_ref: string | null
          id: string
          property_type: string
          relative_budget: number | null
          surplus_deficit: number | null
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          actual_collection?: number | null
          annual_budget?: number | null
          created_at?: string
          excel_cell_ref?: string | null
          id?: string
          property_type: string
          relative_budget?: number | null
          surplus_deficit?: number | null
          updated_at?: string
          user_id: string
          year?: number
        }
        Update: {
          actual_collection?: number | null
          annual_budget?: number | null
          created_at?: string
          excel_cell_ref?: string | null
          id?: string
          property_type?: string
          relative_budget?: number | null
          surplus_deficit?: number | null
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      grants: {
        Row: {
          amount: number | null
          approved_amount: number | null
          created_at: string
          decision_at: string | null
          department_slug: Database["public"]["Enums"]["department_slug"] | null
          id: string
          ministry: string | null
          municipality_participation: number | null
          name: string | null
          notes: string | null
          project_description: string | null
          rejection_reason: string | null
          responsible_person: string | null
          status: string | null
          submission_amount: number | null
          submitted_at: string | null
          support_amount: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number | null
          approved_amount?: number | null
          created_at?: string
          decision_at?: string | null
          department_slug?:
            | Database["public"]["Enums"]["department_slug"]
            | null
          id?: string
          ministry?: string | null
          municipality_participation?: number | null
          name?: string | null
          notes?: string | null
          project_description?: string | null
          rejection_reason?: string | null
          responsible_person?: string | null
          status?: string | null
          submission_amount?: number | null
          submitted_at?: string | null
          support_amount?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number | null
          approved_amount?: number | null
          created_at?: string
          decision_at?: string | null
          department_slug?:
            | Database["public"]["Enums"]["department_slug"]
            | null
          id?: string
          ministry?: string | null
          municipality_participation?: number | null
          name?: string | null
          notes?: string | null
          project_description?: string | null
          rejection_reason?: string | null
          responsible_person?: string | null
          status?: string | null
          submission_amount?: number | null
          submitted_at?: string | null
          support_amount?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ingestion_logs: {
        Row: {
          context: string | null
          created_at: string
          detected_table: string | null
          error: string | null
          error_rows: number | null
          file_name: string | null
          file_path: string | null
          id: string
          inserted_rows: number | null
          rows: number | null
          source_file: string | null
          status: string | null
          table_name: string | null
          user_id: string | null
        }
        Insert: {
          context?: string | null
          created_at?: string
          detected_table?: string | null
          error?: string | null
          error_rows?: number | null
          file_name?: string | null
          file_path?: string | null
          id?: string
          inserted_rows?: number | null
          rows?: number | null
          source_file?: string | null
          status?: string | null
          table_name?: string | null
          user_id?: string | null
        }
        Update: {
          context?: string | null
          created_at?: string
          detected_table?: string | null
          error?: string | null
          error_rows?: number | null
          file_name?: string | null
          file_path?: string | null
          id?: string
          inserted_rows?: number | null
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
          principal: string | null
          students: number | null
          teachers: number | null
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
          principal?: string | null
          students?: number | null
          teachers?: number | null
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
          principal?: string | null
          students?: number | null
          teachers?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      licenses: {
        Row: {
          address: string | null
          area: string | null
          block_parcel_sub: string | null
          business_name: string | null
          business_nature: string | null
          closure_date: string | null
          created_at: string
          days_from_request: string | null
          days_temporary_permit: string | null
          delivery_date: string | null
          department_slug: Database["public"]["Enums"]["department_slug"] | null
          dock_fee: string | null
          email: string | null
          expires_at: string | null
          expiry_date: string | null
          file_holder: string | null
          fire_department_number: string | null
          follow_up_date: string | null
          group_category: string | null
          id: string
          image_urls: string[] | null
          inspection_date: string | null
          inspector: string | null
          judgment_date: string | null
          judgment_execution: string | null
          lat: number | null
          license_number: string | null
          lng: number | null
          location_description: string | null
          mobile: string | null
          old_file: string | null
          owner: string | null
          phone: string | null
          property: string | null
          reason_no_license: string | null
          reported_area: number | null
          request_date: string | null
          request_type: string | null
          risk_level: string | null
          status: string | null
          type: string | null
          updated_at: string
          user_id: string
          validity: string | null
        }
        Insert: {
          address?: string | null
          area?: string | null
          block_parcel_sub?: string | null
          business_name?: string | null
          business_nature?: string | null
          closure_date?: string | null
          created_at?: string
          days_from_request?: string | null
          days_temporary_permit?: string | null
          delivery_date?: string | null
          department_slug?:
            | Database["public"]["Enums"]["department_slug"]
            | null
          dock_fee?: string | null
          email?: string | null
          expires_at?: string | null
          expiry_date?: string | null
          file_holder?: string | null
          fire_department_number?: string | null
          follow_up_date?: string | null
          group_category?: string | null
          id?: string
          image_urls?: string[] | null
          inspection_date?: string | null
          inspector?: string | null
          judgment_date?: string | null
          judgment_execution?: string | null
          lat?: number | null
          license_number?: string | null
          lng?: number | null
          location_description?: string | null
          mobile?: string | null
          old_file?: string | null
          owner?: string | null
          phone?: string | null
          property?: string | null
          reason_no_license?: string | null
          reported_area?: number | null
          request_date?: string | null
          request_type?: string | null
          risk_level?: string | null
          status?: string | null
          type?: string | null
          updated_at?: string
          user_id: string
          validity?: string | null
        }
        Update: {
          address?: string | null
          area?: string | null
          block_parcel_sub?: string | null
          business_name?: string | null
          business_nature?: string | null
          closure_date?: string | null
          created_at?: string
          days_from_request?: string | null
          days_temporary_permit?: string | null
          delivery_date?: string | null
          department_slug?:
            | Database["public"]["Enums"]["department_slug"]
            | null
          dock_fee?: string | null
          email?: string | null
          expires_at?: string | null
          expiry_date?: string | null
          file_holder?: string | null
          fire_department_number?: string | null
          follow_up_date?: string | null
          group_category?: string | null
          id?: string
          image_urls?: string[] | null
          inspection_date?: string | null
          inspector?: string | null
          judgment_date?: string | null
          judgment_execution?: string | null
          lat?: number | null
          license_number?: string | null
          lng?: number | null
          location_description?: string | null
          mobile?: string | null
          old_file?: string | null
          owner?: string | null
          phone?: string | null
          property?: string | null
          reason_no_license?: string | null
          reported_area?: number | null
          request_date?: string | null
          request_type?: string | null
          risk_level?: string | null
          status?: string | null
          type?: string | null
          updated_at?: string
          user_id?: string
          validity?: string | null
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
          end_at: string | null
          file_urls: string[] | null
          id: string
          image_urls: string[] | null
          land_use: string | null
          lat: number | null
          lng: number | null
          name: string | null
          parcel: string | null
          plan_number: string | null
          start_at: string | null
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
          end_at?: string | null
          file_urls?: string[] | null
          id?: string
          image_urls?: string[] | null
          land_use?: string | null
          lat?: number | null
          lng?: number | null
          name?: string | null
          parcel?: string | null
          plan_number?: string | null
          start_at?: string | null
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
          end_at?: string | null
          file_urls?: string[] | null
          id?: string
          image_urls?: string[] | null
          land_use?: string | null
          lat?: number | null
          lng?: number | null
          name?: string | null
          parcel?: string | null
          plan_number?: string | null
          start_at?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
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
          end_at: string | null
          file_urls: string[] | null
          funding_source: string | null
          id: string
          image_urls: string[] | null
          logo_url: string | null
          name: string | null
          notes: string | null
          progress: number | null
          start_at: string | null
          status: string | null
          tabar_assignment: string | null
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
          end_at?: string | null
          file_urls?: string[] | null
          funding_source?: string | null
          id?: string
          image_urls?: string[] | null
          logo_url?: string | null
          name?: string | null
          notes?: string | null
          progress?: number | null
          start_at?: string | null
          status?: string | null
          tabar_assignment?: string | null
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
          end_at?: string | null
          file_urls?: string[] | null
          funding_source?: string | null
          id?: string
          image_urls?: string[] | null
          logo_url?: string | null
          name?: string | null
          notes?: string | null
          progress?: number | null
          start_at?: string | null
          status?: string | null
          tabar_assignment?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      property_tax_collection: {
        Row: {
          actual_collection: number | null
          annual_budget: number | null
          created_at: string
          id: string
          property_type: string
          relative_budget: number | null
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          actual_collection?: number | null
          annual_budget?: number | null
          created_at?: string
          id?: string
          property_type: string
          relative_budget?: number | null
          updated_at?: string
          user_id: string
          year?: number
        }
        Update: {
          actual_collection?: number | null
          annual_budget?: number | null
          created_at?: string
          id?: string
          property_type?: string
          relative_budget?: number | null
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      public_inquiries: {
        Row: {
          address: string | null
          assigned_at: string | null
          assigned_handler: string | null
          assigned_to: string | null
          created_at: string
          department_slug: Database["public"]["Enums"]["department_slug"] | null
          description: string | null
          domain: string | null
          email: string | null
          id: string
          inquiry_number: string
          inquiry_type: string
          internal_notes: string | null
          name: string
          phone: string | null
          priority: string
          resolved_at: string | null
          response: string | null
          source: string
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          assigned_at?: string | null
          assigned_handler?: string | null
          assigned_to?: string | null
          created_at?: string
          department_slug?:
            | Database["public"]["Enums"]["department_slug"]
            | null
          description?: string | null
          domain?: string | null
          email?: string | null
          id?: string
          inquiry_number?: string
          inquiry_type: string
          internal_notes?: string | null
          name: string
          phone?: string | null
          priority?: string
          resolved_at?: string | null
          response?: string | null
          source: string
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          assigned_at?: string | null
          assigned_handler?: string | null
          assigned_to?: string | null
          created_at?: string
          department_slug?:
            | Database["public"]["Enums"]["department_slug"]
            | null
          description?: string | null
          domain?: string | null
          email?: string | null
          id?: string
          inquiry_number?: string
          inquiry_type?: string
          internal_notes?: string | null
          name?: string
          phone?: string | null
          priority?: string
          resolved_at?: string | null
          response?: string | null
          source?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      regular_budget: {
        Row: {
          actual_amount: number | null
          budget_amount: number | null
          category_name: string
          category_type: Database["public"]["Enums"]["budget_category_type"]
          created_at: string
          excel_cell_ref: string | null
          id: string
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          actual_amount?: number | null
          budget_amount?: number | null
          category_name: string
          category_type: Database["public"]["Enums"]["budget_category_type"]
          created_at?: string
          excel_cell_ref?: string | null
          id?: string
          updated_at?: string
          user_id: string
          year?: number
        }
        Update: {
          actual_amount?: number | null
          budget_amount?: number | null
          category_name?: string
          category_type?: Database["public"]["Enums"]["budget_category_type"]
          created_at?: string
          excel_cell_ref?: string | null
          id?: string
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      salary_data: {
        Row: {
          created_at: string
          education_salary: number | null
          employee_count: number | null
          general_salary: number | null
          id: string
          quarter: number
          updated_at: string
          user_id: string
          welfare_salary: number | null
          year: number
        }
        Insert: {
          created_at?: string
          education_salary?: number | null
          employee_count?: number | null
          general_salary?: number | null
          id?: string
          quarter: number
          updated_at?: string
          user_id: string
          welfare_salary?: number | null
          year?: number
        }
        Update: {
          created_at?: string
          education_salary?: number | null
          employee_count?: number | null
          general_salary?: number | null
          id?: string
          quarter?: number
          updated_at?: string
          user_id?: string
          welfare_salary?: number | null
          year?: number
        }
        Relationships: []
      }
      tabarim: {
        Row: {
          approved_budget: number | null
          created_at: string
          domain: string | null
          expense_actual: number | null
          funding_source1: string | null
          funding_source2: string | null
          funding_source3: string | null
          id: string
          income_actual: number | null
          surplus_deficit: number | null
          tabar_name: string
          tabar_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_budget?: number | null
          created_at?: string
          domain?: string | null
          expense_actual?: number | null
          funding_source1?: string | null
          funding_source2?: string | null
          funding_source3?: string | null
          id?: string
          income_actual?: number | null
          surplus_deficit?: number | null
          tabar_name: string
          tabar_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_budget?: number | null
          created_at?: string
          domain?: string | null
          expense_actual?: number | null
          funding_source1?: string | null
          funding_source2?: string | null
          funding_source3?: string | null
          id?: string
          income_actual?: number | null
          surplus_deficit?: number | null
          tabar_name?: string
          tabar_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      task_acknowledgements: {
        Row: {
          created_at: string
          id: string
          manager_user_id: string
          task_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          manager_user_id: string
          task_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          manager_user_id?: string
          task_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_acknowledgements_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_by_role: Database["public"]["Enums"]["app_role"] | null
          created_at: string
          created_by: string
          department_slug: Database["public"]["Enums"]["department_slug"]
          description: string | null
          due_at: string | null
          id: string
          priority: Database["public"]["Enums"]["task_priority"]
          progress_notes: string | null
          progress_percent: number | null
          status: Database["public"]["Enums"]["task_status"]
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          assigned_by_role?: Database["public"]["Enums"]["app_role"] | null
          created_at?: string
          created_by: string
          department_slug: Database["public"]["Enums"]["department_slug"]
          description?: string | null
          due_at?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          progress_notes?: string | null
          progress_percent?: number | null
          status?: Database["public"]["Enums"]["task_status"]
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          assigned_by_role?: Database["public"]["Enums"]["app_role"] | null
          created_at?: string
          created_by?: string
          department_slug?: Database["public"]["Enums"]["department_slug"]
          description?: string | null
          due_at?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          progress_notes?: string | null
          progress_percent?: number | null
          status?: Database["public"]["Enums"]["task_status"]
          tags?: string[] | null
          title?: string
          updated_at?: string
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
          _department: Database["public"]["Enums"]["department_slug"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      user_owns_budget_record: {
        Args: { record_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "mayor" | "manager" | "ceo"
      budget_category_type: "income" | "expense"
      department_slug:
        | "finance"
        | "education"
        | "engineering"
        | "welfare"
        | "non-formal"
        | "business"
        | "ceo"
        | "city-improvement"
        | "enforcement"
        | "inquiries"
        | "government-budgets"
      funding_source:
        | "environmental_protection"
        | "lottery"
        | "education_ministry"
        | "construction_housing_ministry"
        | "loan"
        | "interior_ministry"
        | "economy_ministry"
        | "rmi"
        | "negev_galilee_resilience_ministry"
        | "national_digital_ministry"
        | "environmental_protection_ministry"
        | "culture_ministry"
        | "science_technology_ministry"
        | "planning_administration"
        | "transportation_ministry"
        | "health_ministry"
        | "municipality"
        | "energy_ministry"
        | "agriculture_ministry"
      tabar_domain:
        | "energy"
        | "organizational"
        | "digital"
        | "veterinary"
        | "education_buildings"
        | "public_buildings"
        | "environment"
        | "activities"
        | "welfare"
        | "public_spaces"
        | "planning"
        | "infrastructure_roads"
        | "other"
      tabar_status: "planning" | "active" | "closed" | "delayed"
      task_priority: "low" | "medium" | "high" | "urgent"
      task_status: "todo" | "in_progress" | "blocked" | "done" | "cancelled"
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
      app_role: ["mayor", "manager", "ceo"],
      budget_category_type: ["income", "expense"],
      department_slug: [
        "finance",
        "education",
        "engineering",
        "welfare",
        "non-formal",
        "business",
        "ceo",
        "city-improvement",
        "enforcement",
        "inquiries",
        "government-budgets",
      ],
      funding_source: [
        "environmental_protection",
        "lottery",
        "education_ministry",
        "construction_housing_ministry",
        "loan",
        "interior_ministry",
        "economy_ministry",
        "rmi",
        "negev_galilee_resilience_ministry",
        "national_digital_ministry",
        "environmental_protection_ministry",
        "culture_ministry",
        "science_technology_ministry",
        "planning_administration",
        "transportation_ministry",
        "health_ministry",
        "municipality",
        "energy_ministry",
        "agriculture_ministry",
      ],
      tabar_domain: [
        "energy",
        "organizational",
        "digital",
        "veterinary",
        "education_buildings",
        "public_buildings",
        "environment",
        "activities",
        "welfare",
        "public_spaces",
        "planning",
        "infrastructure_roads",
        "other",
      ],
      tabar_status: ["planning", "active", "closed", "delayed"],
      task_priority: ["low", "medium", "high", "urgent"],
      task_status: ["todo", "in_progress", "blocked", "done", "cancelled"],
    },
  },
} as const
