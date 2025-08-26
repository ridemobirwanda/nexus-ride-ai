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
      admin_profiles: {
        Row: {
          created_at: string
          department: string | null
          email: string
          id: string
          is_active: boolean | null
          last_login_at: string | null
          name: string
          permissions: Json | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          name: string
          permissions?: Json | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          department?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          name?: string
          permissions?: Json | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      car_categories: {
        Row: {
          base_fare: number
          base_price_per_km: number
          created_at: string
          description: string | null
          features: Json | null
          id: string
          image_url: string | null
          is_active: boolean
          minimum_fare: number
          name: string
          surge_multiplier: number
          updated_at: string
        }
        Insert: {
          base_fare?: number
          base_price_per_km?: number
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          minimum_fare?: number
          name: string
          surge_multiplier?: number
          updated_at?: string
        }
        Update: {
          base_fare?: number
          base_price_per_km?: number
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          minimum_fare?: number
          name?: string
          surge_multiplier?: number
          updated_at?: string
        }
        Relationships: []
      }
      car_images: {
        Row: {
          created_at: string
          driver_id: string
          id: string
          image_url: string
          is_primary: boolean
        }
        Insert: {
          created_at?: string
          driver_id: string
          id?: string
          image_url: string
          is_primary?: boolean
        }
        Update: {
          created_at?: string
          driver_id?: string
          id?: string
          image_url?: string
          is_primary?: boolean
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          ride_id: string
          sender_id: string
          sender_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          ride_id: string
          sender_id: string
          sender_type: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          ride_id?: string
          sender_id?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_earnings: {
        Row: {
          amount: number
          created_at: string
          date: string
          driver_id: string
          id: string
          ride_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          date?: string
          driver_id: string
          id?: string
          ride_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          driver_id?: string
          id?: string
          ride_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      driver_locations: {
        Row: {
          accuracy: number | null
          driver_id: string
          heading: number | null
          id: string
          is_active: boolean
          location: unknown
          speed: number | null
          timestamp: string
        }
        Insert: {
          accuracy?: number | null
          driver_id: string
          heading?: number | null
          id?: string
          is_active?: boolean
          location: unknown
          speed?: number | null
          timestamp?: string
        }
        Update: {
          accuracy?: number | null
          driver_id?: string
          heading?: number | null
          id?: string
          is_active?: boolean
          location?: unknown
          speed?: number | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_locations_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_locations_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_reviews: {
        Row: {
          created_at: string
          driver_id: string
          id: string
          is_anonymous: boolean | null
          passenger_id: string
          rating: number
          review_categories: Json | null
          review_text: string | null
          ride_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          driver_id: string
          id?: string
          is_anonymous?: boolean | null
          passenger_id: string
          rating: number
          review_categories?: Json | null
          review_text?: string | null
          ride_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          driver_id?: string
          id?: string
          is_anonymous?: boolean | null
          passenger_id?: string
          rating?: number
          review_categories?: Json | null
          review_text?: string | null
          ride_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      driver_verification_requests: {
        Row: {
          created_at: string
          documents: Json
          driver_id: string
          id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_at: string
        }
        Insert: {
          created_at?: string
          documents?: Json
          driver_id: string
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
        }
        Update: {
          created_at?: string
          documents?: Json
          driver_id?: string
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_verification_requests_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_verification_requests_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          bio: string | null
          car_category_id: string | null
          car_color: string | null
          car_features: Json | null
          car_model: string | null
          car_plate: string | null
          car_year: number | null
          created_at: string
          current_location: unknown | null
          id: string
          is_available: boolean | null
          last_activity_at: string | null
          name: string
          phone: string | null
          photo_url: string | null
          rating: number | null
          status: Database["public"]["Enums"]["driver_status"]
          total_trips: number | null
          user_id: string
        }
        Insert: {
          bio?: string | null
          car_category_id?: string | null
          car_color?: string | null
          car_features?: Json | null
          car_model?: string | null
          car_plate?: string | null
          car_year?: number | null
          created_at?: string
          current_location?: unknown | null
          id?: string
          is_available?: boolean | null
          last_activity_at?: string | null
          name: string
          phone?: string | null
          photo_url?: string | null
          rating?: number | null
          status?: Database["public"]["Enums"]["driver_status"]
          total_trips?: number | null
          user_id: string
        }
        Update: {
          bio?: string | null
          car_category_id?: string | null
          car_color?: string | null
          car_features?: Json | null
          car_model?: string | null
          car_plate?: string | null
          car_year?: number | null
          created_at?: string
          current_location?: unknown | null
          id?: string
          is_available?: boolean | null
          last_activity_at?: string | null
          name?: string
          phone?: string | null
          photo_url?: string | null
          rating?: number | null
          status?: Database["public"]["Enums"]["driver_status"]
          total_trips?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "drivers_car_category_id_fkey"
            columns: ["car_category_id"]
            isOneToOne: false
            referencedRelation: "car_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      passengers: {
        Row: {
          created_at: string
          id: string
          name: string
          notification_preferences: Json | null
          phone: string | null
          profile_pic: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          notification_preferences?: Json | null
          phone?: string | null
          profile_pic?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          notification_preferences?: Json | null
          phone?: string | null
          profile_pic?: string | null
          user_id?: string
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean | null
          max_discount: number | null
          min_ride_amount: number | null
          updated_at: string
          usage_count: number | null
          usage_limit: number | null
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_type: string
          discount_value: number
          id?: string
          is_active?: boolean | null
          max_discount?: number | null
          min_ride_amount?: number | null
          updated_at?: string
          usage_count?: number | null
          usage_limit?: number | null
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean | null
          max_discount?: number | null
          min_ride_amount?: number | null
          updated_at?: string
          usage_count?: number | null
          usage_limit?: number | null
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      rides: {
        Row: {
          car_category_id: string | null
          created_at: string
          distance_km: number | null
          driver_id: string | null
          dropoff_address: string
          dropoff_location: unknown
          duration_minutes: number | null
          estimated_fare: number | null
          feedback: string | null
          final_fare: number | null
          id: string
          passenger_id: string
          payment_method: string | null
          pickup_address: string
          pickup_location: unknown
          rating: number | null
          status: string
          updated_at: string
        }
        Insert: {
          car_category_id?: string | null
          created_at?: string
          distance_km?: number | null
          driver_id?: string | null
          dropoff_address: string
          dropoff_location: unknown
          duration_minutes?: number | null
          estimated_fare?: number | null
          feedback?: string | null
          final_fare?: number | null
          id?: string
          passenger_id: string
          payment_method?: string | null
          pickup_address: string
          pickup_location: unknown
          rating?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          car_category_id?: string | null
          created_at?: string
          distance_km?: number | null
          driver_id?: string | null
          dropoff_address?: string
          dropoff_location?: unknown
          duration_minutes?: number | null
          estimated_fare?: number | null
          feedback?: string | null
          final_fare?: number | null
          id?: string
          passenger_id?: string
          payment_method?: string | null
          pickup_address?: string
          pickup_location?: unknown
          rating?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rides_car_category_id_fkey"
            columns: ["car_category_id"]
            isOneToOne: false
            referencedRelation: "car_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rides_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rides_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rides_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "passengers"
            referencedColumns: ["id"]
          },
        ]
      }
      support_ticket_messages: {
        Row: {
          attachments: Json | null
          created_at: string
          id: string
          is_internal: boolean | null
          message: string
          sender_id: string
          sender_type: string
          ticket_id: string
        }
        Insert: {
          attachments?: Json | null
          created_at?: string
          id?: string
          is_internal?: boolean | null
          message: string
          sender_id: string
          sender_type: string
          ticket_id: string
        }
        Update: {
          attachments?: Json | null
          created_at?: string
          id?: string
          is_internal?: boolean | null
          message?: string
          sender_id?: string
          sender_type?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          attachments: Json | null
          category: string
          created_at: string
          description: string
          id: string
          priority: string
          resolution_notes: string | null
          resolved_at: string | null
          ride_id: string | null
          status: string
          subject: string
          ticket_number: string
          updated_at: string
          user_id: string | null
          user_type: string | null
        }
        Insert: {
          assigned_to?: string | null
          attachments?: Json | null
          category: string
          created_at?: string
          description: string
          id?: string
          priority?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          ride_id?: string | null
          status?: string
          subject: string
          ticket_number: string
          updated_at?: string
          user_id?: string | null
          user_type?: string | null
        }
        Update: {
          assigned_to?: string | null
          attachments?: Json | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          priority?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          ride_id?: string | null
          status?: string
          subject?: string
          ticket_number?: string
          updated_at?: string
          user_id?: string | null
          user_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
      surge_pricing: {
        Row: {
          area_boundaries: Json
          area_name: string
          created_at: string
          created_by: string | null
          end_time: string | null
          id: string
          is_active: boolean | null
          multiplier: number
          reason: string | null
          start_time: string | null
          updated_at: string
        }
        Insert: {
          area_boundaries: Json
          area_name: string
          created_at?: string
          created_by?: string | null
          end_time?: string | null
          id?: string
          is_active?: boolean | null
          multiplier?: number
          reason?: string | null
          start_time?: string | null
          updated_at?: string
        }
        Update: {
          area_boundaries?: Json
          area_name?: string
          created_at?: string
          created_by?: string | null
          end_time?: string | null
          id?: string
          is_active?: boolean | null
          multiplier?: number
          reason?: string | null
          start_time?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      system_notifications: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean | null
          message: string
          show_from: string
          show_until: string | null
          target_audience: string
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          message: string
          show_from?: string
          show_until?: string | null
          target_audience: string
          title: string
          type: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          message?: string
          show_from?: string
          show_until?: string | null
          target_audience?: string
          title?: string
          type?: string
        }
        Relationships: []
      }
      user_activity_logs: {
        Row: {
          activity_details: Json | null
          activity_type: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          user_agent: string | null
          user_id: string
          user_type: string
        }
        Insert: {
          activity_details?: Json | null
          activity_type: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id: string
          user_type: string
        }
        Update: {
          activity_details?: Json | null
          activity_type?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string
          user_type?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      drivers_public: {
        Row: {
          car_model: string | null
          created_at: string | null
          current_location: unknown | null
          id: string | null
          is_available: boolean | null
          name: string | null
        }
        Insert: {
          car_model?: string | null
          created_at?: string | null
          current_location?: unknown | null
          id?: string | null
          is_available?: boolean | null
          name?: string | null
        }
        Update: {
          car_model?: string | null
          created_at?: string | null
          current_location?: unknown | null
          id?: string | null
          is_available?: boolean | null
          name?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      find_nearest_driver: {
        Args: {
          p_limit?: number
          p_max_distance_km?: number
          p_pickup_location: unknown
        }
        Returns: {
          car_model: string
          car_plate: string
          distance_km: number
          driver_id: string
          estimated_arrival_minutes: number
          name: string
          phone: string
          rating: number
          total_trips: number
        }[]
      }
      get_admin_dashboard_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          active_drivers: number
          completed_rides: number
          pending_rides: number
          today_revenue: number
          today_rides: number
          total_drivers: number
          total_passengers: number
          total_revenue: number
          total_rides: number
          total_users: number
        }[]
      }
      get_driver_earnings_summary: {
        Args: { p_days?: number; p_driver_user_id: string }
        Returns: {
          avg_fare: number
          daily_breakdown: Json
          last_week_earnings: number
          this_week_earnings: number
          today_earnings: number
          total_earnings: number
          total_rides: number
          yesterday_earnings: number
        }[]
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      log_user_activity: {
        Args: {
          p_activity_details?: Json
          p_activity_type: string
          p_ip_address?: unknown
          p_user_agent?: string
          p_user_id: string
          p_user_type: string
        }
        Returns: string
      }
      point_distance: {
        Args: { p1: unknown; p2: unknown }
        Returns: number
      }
      request_admin_password_reset: {
        Args: { admin_email: string }
        Returns: string
      }
      setup_admin_user: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_driver_location: {
        Args: {
          p_accuracy?: number
          p_heading?: number
          p_location: unknown
          p_speed?: number
        }
        Returns: string
      }
      update_driver_status: {
        Args: { p_status: Database["public"]["Enums"]["driver_status"] }
        Returns: boolean
      }
      update_inactive_drivers: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
    }
    Enums: {
      driver_status: "offline" | "available" | "on_trip" | "inactive"
      user_role: "super_admin" | "admin" | "support" | "driver" | "passenger"
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
      driver_status: ["offline", "available", "on_trip", "inactive"],
      user_role: ["super_admin", "admin", "support", "driver", "passenger"],
    },
  },
} as const
