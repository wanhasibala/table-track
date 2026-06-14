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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          changed_at: string
          changed_by: string | null
          changed_by_user: Json | null
          changed_fields: string[] | null
          id: number
          operation: string
          previous_data: Json | null
          row_data: Json | null
          schema_name: string
          table_name: string
          tenant_id: string | null
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          changed_by_user?: Json | null
          changed_fields?: string[] | null
          id?: number
          operation: string
          previous_data?: Json | null
          row_data?: Json | null
          schema_name?: string
          table_name: string
          tenant_id?: string | null
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          changed_by_user?: Json | null
          changed_fields?: string[] | null
          id?: number
          operation?: string
          previous_data?: Json | null
          row_data?: Json | null
          schema_name?: string
          table_name?: string
          tenant_id?: string | null
        }
        Relationships: []
      }
      category: {
        Row: {
          id: string
          is_active: boolean
          name: string
          sort_order: number
          tenant_id: string
        }
        Insert: {
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          tenant_id?: string
        }
        Update: {
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_item: {
        Row: {
          category_id: string | null
          id: string
          image_url: string[] | null
          is_available: boolean
          name: string
          price: number
          stock: number
          tenant_id: string
        }
        Insert: {
          category_id?: string | null
          id?: string
          image_url?: string[] | null
          is_available?: boolean
          name: string
          price?: number
          stock?: number
          tenant_id?: string
        }
        Update: {
          category_id?: string | null
          id?: string
          image_url?: string[] | null
          is_available?: boolean
          name?: string
          price?: number
          stock?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_item_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "category"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_item_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_variant: {
        Row: {
          id: string
          is_required: boolean
          menu_item_id: string
          name: string
          tenant_id: string
        }
        Insert: {
          id?: string
          is_required?: boolean
          menu_item_id: string
          name: string
          tenant_id?: string
        }
        Update: {
          id?: string
          is_required?: boolean
          menu_item_id?: string
          name?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_variant_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_item"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_variant_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_variant_option: {
        Row: {
          id: string
          label: string
          price_add: number
          tenant_id: string
          variant_id: string
        }
        Insert: {
          id?: string
          label: string
          price_add?: number
          tenant_id?: string
          variant_id: string
        }
        Update: {
          id?: string
          label?: string
          price_add?: number
          tenant_id?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_variant_option_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_variant_option_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "menu_variant"
            referencedColumns: ["id"]
          },
        ]
      }
      order_item: {
        Row: {
          id: string
          menu_item_id: string | null
          notes: string | null
          option_id: string | null
          order_id: string
          qty: number
          tenant_id: string
          unit_price: number
        }
        Insert: {
          id?: string
          menu_item_id?: string | null
          notes?: string | null
          option_id?: string | null
          order_id: string
          qty?: number
          tenant_id?: string
          unit_price?: number
        }
        Update: {
          id?: string
          menu_item_id?: string | null
          notes?: string | null
          option_id?: string | null
          order_id?: string
          qty?: number
          tenant_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_item_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_item"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_item_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "menu_variant_option"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_item_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_table"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_item_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      order_table: {
        Row: {
          created_at: string
          customer_name: string | null
          customer_phone: string | null
          delivery_address: string | null
          delivery_fee: number
          delivery_latitude: number | null
          delivery_longitude: number | null
          handled_by: string | null
          id: string
          notes: string | null
          status: Database["public"]["Enums"]["order_status"]
          table_id: string | null
          tenant_id: string
          total_amount: number
          type: Database["public"]["Enums"]["order_type"]
        }
        Insert: {
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          delivery_address?: string | null
          delivery_fee?: number
          delivery_latitude?: number | null
          delivery_longitude?: number | null
          handled_by?: string | null
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          table_id?: string | null
          tenant_id?: string
          total_amount?: number
          type?: Database["public"]["Enums"]["order_type"]
        }
        Update: {
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          delivery_address?: string | null
          delivery_fee?: number
          delivery_latitude?: number | null
          delivery_longitude?: number | null
          handled_by?: string | null
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          table_id?: string | null
          tenant_id?: string
          total_amount?: number
          type?: Database["public"]["Enums"]["order_type"]
        }
        Relationships: [
          {
            foreignKeyName: "order_table_handled_by_fkey"
            columns: ["handled_by"]
            isOneToOne: false
            referencedRelation: "user_account"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_table_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "table_spot"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_table_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      payment: {
        Row: {
          amount: number
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          midtrans_id: string | null
          order_id: string
          paid_at: string | null
          status: Database["public"]["Enums"]["payment_status"]
          tenant_id: string
        }
        Insert: {
          amount?: number
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          midtrans_id?: string | null
          order_id: string
          paid_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          tenant_id?: string
        }
        Update: {
          amount?: number
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          midtrans_id?: string | null
          order_id?: string
          paid_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_table"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      table_spot: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          qr_code_url: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          qr_code_url?: string | null
          tenant_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          qr_code_url?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "table_spot_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant: {
        Row: {
          address: string | null
          created_at: string
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          slug: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          slug: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          slug?: string
        }
        Relationships: []
      }
      user_account: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string | null
          role: Database["public"]["Enums"]["user_role"]
          tenant_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          tenant_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_account_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      fn_auth_email: { Args: never; Returns: string }
      fn_is_owner: { Args: never; Returns: boolean }
      fn_is_superadmin: { Args: never; Returns: boolean }
      fn_my_role: { Args: never; Returns: string }
      fn_my_tenant_id: { Args: never; Returns: string }
      get_session_tenant_id: { Args: never; Returns: string }
      get_user_tenant_id: { Args: never; Returns: string }
      initialize_new_organization: {
        Args: {
          p_address: string
          p_logo_url: string
          p_org_name: string
          p_user_id: string
        }
        Returns: string
      }
      is_superadmin: { Args: never; Returns: boolean }
    }
    Enums: {
      order_status:
        | "pending"
        | "confirmed"
        | "preparing"
        | "served"
        | "cancelled"
        | "completed"
      order_type: "dine_in" | "takeaway" | "delivery"
      payment_method: "card" | "cash" | "online" | "other" | "qris"
      payment_status: "pending" | "paid" | "failed" | "refunded"
      user_role: "superadmin" | "admin" | "manager" | "staff" | "customer"
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
      order_status: [
        "pending",
        "confirmed",
        "preparing",
        "served",
        "cancelled",
        "completed",
      ],
      order_type: ["dine_in", "takeaway", "delivery"],
      payment_method: ["card", "cash", "online", "other", "qris"],
      payment_status: ["pending", "paid", "failed", "refunded"],
      user_role: ["superadmin", "admin", "manager", "staff", "customer"],
    },
  },
} as const
