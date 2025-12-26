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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      app_logs: {
        Row: {
          created_at: string
          id: string
          log_type: string
          message: string
          metadata: Json | null
          organization_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          log_type: string
          message: string
          metadata?: Json | null
          organization_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          log_type?: string
          message?: string
          metadata?: Json | null
          organization_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "app_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          appointment_date: string
          consultation_fee: number | null
          created_at: string
          diagnosis: string | null
          doctor_id: string | null
          doctor_notes: string | null
          id: string
          organization_id: string
          patient_id: string
          reason_for_visit: string | null
          status: string | null
        }
        Insert: {
          appointment_date: string
          consultation_fee?: number | null
          created_at?: string
          diagnosis?: string | null
          doctor_id?: string | null
          doctor_notes?: string | null
          id?: string
          organization_id: string
          patient_id: string
          reason_for_visit?: string | null
          status?: string | null
        }
        Update: {
          appointment_date?: string
          consultation_fee?: number | null
          created_at?: string
          diagnosis?: string | null
          doctor_id?: string | null
          doctor_notes?: string | null
          id?: string
          organization_id?: string
          patient_id?: string
          reason_for_visit?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          category: string
          created_at: string
          email: string
          id: string
          message: string
          name: string
          rating: string | null
        }
        Insert: {
          category: string
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          rating?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          rating?: string | null
        }
        Relationships: []
      }
      inventory: {
        Row: {
          created_at: string
          expiry_date: string | null
          id: string
          item_name: string
          organization_id: string
          price_per_unit: number | null
          stock_quantity: number | null
        }
        Insert: {
          created_at?: string
          expiry_date?: string | null
          id?: string
          item_name: string
          organization_id: string
          price_per_unit?: number | null
          stock_quantity?: number | null
        }
        Update: {
          created_at?: string
          expiry_date?: string | null
          id?: string
          item_name?: string
          organization_id?: string
          price_per_unit?: number | null
          stock_quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          appointment_id: string | null
          created_at: string
          id: string
          organization_id: string
          status: string | null
          total_amount: number
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string
          id?: string
          organization_id: string
          status?: string | null
          total_amount: number
        }
        Update: {
          appointment_id?: string | null
          created_at?: string
          id?: string
          organization_id?: string
          status?: string | null
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_requests: {
        Row: {
          appointment_id: string | null
          category: string
          collected_by: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string
          findings: string | null
          id: string
          notes: string | null
          organization_id: string
          patient_id: string
          reference_range: string | null
          requesting_doctor_id: string | null
          sample_collected_at: string | null
          status: string
          test_name: string
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          category?: string
          collected_by?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          findings?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          patient_id: string
          reference_range?: string | null
          requesting_doctor_id?: string | null
          sample_collected_at?: string | null
          status?: string
          test_name: string
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          category?: string
          collected_by?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          findings?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          patient_id?: string
          reference_range?: string | null
          requesting_doctor_id?: string | null
          sample_collected_at?: string | null
          status?: string
          test_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lab_requests_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_requests_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          contact_phone: string | null
          created_at: string
          currency_symbol: string | null
          id: string
          logo_url: string | null
          name: string
          support_email: string | null
          timezone: string | null
        }
        Insert: {
          address?: string | null
          contact_phone?: string | null
          created_at?: string
          currency_symbol?: string | null
          id?: string
          logo_url?: string | null
          name: string
          support_email?: string | null
          timezone?: string | null
        }
        Update: {
          address?: string | null
          contact_phone?: string | null
          created_at?: string
          currency_symbol?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          support_email?: string | null
          timezone?: string | null
        }
        Relationships: []
      }
      patients: {
        Row: {
          allergies: string | null
          avatar_url: string | null
          chronic_conditions: string | null
          created_at: string
          dob: string | null
          emergency_contact: string | null
          first_name: string
          gender: string | null
          id: string
          last_name: string
          medical_record_number: string | null
          organization_id: string
          phone: string | null
        }
        Insert: {
          allergies?: string | null
          avatar_url?: string | null
          chronic_conditions?: string | null
          created_at?: string
          dob?: string | null
          emergency_contact?: string | null
          first_name: string
          gender?: string | null
          id?: string
          last_name: string
          medical_record_number?: string | null
          organization_id: string
          phone?: string | null
        }
        Update: {
          allergies?: string | null
          avatar_url?: string | null
          chronic_conditions?: string | null
          created_at?: string
          dob?: string | null
          emergency_contact?: string | null
          first_name?: string
          gender?: string | null
          id?: string
          last_name?: string
          medical_record_number?: string | null
          organization_id?: string
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      prescriptions: {
        Row: {
          appointment_id: string
          created_at: string
          dispense_status: string | null
          dosage: string | null
          duration: string | null
          frequency: string | null
          id: string
          medicine_name: string
          notes: string | null
          organization_id: string
          prescription_image_url: string | null
        }
        Insert: {
          appointment_id: string
          created_at?: string
          dispense_status?: string | null
          dosage?: string | null
          duration?: string | null
          frequency?: string | null
          id?: string
          medicine_name: string
          notes?: string | null
          organization_id: string
          prescription_image_url?: string | null
        }
        Update: {
          appointment_id?: string
          created_at?: string
          dispense_status?: string | null
          dosage?: string | null
          duration?: string | null
          frequency?: string | null
          id?: string
          medicine_name?: string
          notes?: string | null
          organization_id?: string
          prescription_image_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          organization_id: string | null
          role: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          organization_id?: string | null
          role?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          organization_id?: string | null
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          first_name: string
          id: string
          is_active: boolean | null
          last_name: string
          organization_id: string
          phone: string | null
          role: string
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          first_name: string
          id?: string
          is_active?: boolean | null
          last_name: string
          organization_id: string
          phone?: string | null
          role: string
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          is_active?: boolean | null
          last_name?: string
          organization_id?: string
          phone?: string | null
          role?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          organization_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          organization_id?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          organization_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      vitals: {
        Row: {
          appointment_id: string
          blood_pressure_diastolic: number | null
          blood_pressure_systolic: number | null
          created_at: string
          heart_rate: number | null
          height_cm: number | null
          id: string
          temperature: number | null
          weight_kg: number | null
        }
        Insert: {
          appointment_id: string
          blood_pressure_diastolic?: number | null
          blood_pressure_systolic?: number | null
          created_at?: string
          heart_rate?: number | null
          height_cm?: number | null
          id?: string
          temperature?: number | null
          weight_kg?: number | null
        }
        Update: {
          appointment_id?: string
          blood_pressure_diastolic?: number | null
          blood_pressure_systolic?: number | null
          created_at?: string
          heart_rate?: number | null
          height_cm?: number | null
          id?: string
          temperature?: number | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vitals_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_mrn: { Args: { org_id: string }; Returns: string }
      get_user_organization_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      register_hospital: {
        Args: {
          first_name: string
          hospital_name: string
          last_name: string
          user_id: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "doctor"
        | "nurse"
        | "receptionist"
        | "pharmacist"
        | "lab_scientist"
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
      app_role: [
        "admin",
        "doctor",
        "nurse",
        "receptionist",
        "pharmacist",
        "lab_scientist",
      ],
    },
  },
} as const
