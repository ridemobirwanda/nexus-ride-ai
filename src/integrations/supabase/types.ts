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
      point_distance: {
        Args: { p1: unknown; p2: unknown }
        Returns: number
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
    },
  },
} as const
