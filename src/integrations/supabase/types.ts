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
      agents: {
        Row: {
          agency_name: string | null
          bio: string | null
          created_at: string
          id: string
          license_number: string | null
          profile_image: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          agency_name?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          license_number?: string | null
          profile_image?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          agency_name?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          license_number?: string | null
          profile_image?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      auctions: {
        Row: {
          created_at: string
          current_bid: number | null
          end_time: string
          id: string
          min_increment: number
          property_id: string
          reserve_price: number | null
          start_time: string
          status: Database["public"]["Enums"]["auction_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_bid?: number | null
          end_time: string
          id?: string
          min_increment?: number
          property_id: string
          reserve_price?: number | null
          start_time: string
          status?: Database["public"]["Enums"]["auction_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_bid?: number | null
          end_time?: string
          id?: string
          min_increment?: number
          property_id?: string
          reserve_price?: number | null
          start_time?: string
          status?: Database["public"]["Enums"]["auction_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "auctions_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: true
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      bids: {
        Row: {
          amount: number
          auction_id: string
          bidder_id: string
          created_at: string
          id: string
        }
        Insert: {
          amount: number
          auction_id: string
          bidder_id: string
          created_at?: string
          id?: string
        }
        Update: {
          amount?: number
          auction_id?: string
          bidder_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bids_auction_id_fkey"
            columns: ["auction_id"]
            isOneToOne: false
            referencedRelation: "auctions"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          property_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          property_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_bookings: {
        Row: {
          checked_in_at: string | null
          created_at: string
          customer_id: string
          id: string
          inspection_id: string
          notes: string | null
          status: Database["public"]["Enums"]["booking_status"]
        }
        Insert: {
          checked_in_at?: string | null
          created_at?: string
          customer_id: string
          id?: string
          inspection_id: string
          notes?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
        }
        Update: {
          checked_in_at?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          inspection_id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
        }
        Relationships: [
          {
            foreignKeyName: "inspection_bookings_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspections"
            referencedColumns: ["id"]
          },
        ]
      }
      inspections: {
        Row: {
          created_at: string
          current_attendees: number | null
          date_time: string
          duration: number
          id: string
          max_attendees: number | null
          notes: string | null
          property_id: string
          qr_code: string | null
          status: Database["public"]["Enums"]["inspection_status"]
        }
        Insert: {
          created_at?: string
          current_attendees?: number | null
          date_time: string
          duration?: number
          id?: string
          max_attendees?: number | null
          notes?: string | null
          property_id: string
          qr_code?: string | null
          status?: Database["public"]["Enums"]["inspection_status"]
        }
        Update: {
          created_at?: string
          current_attendees?: number | null
          date_time?: string
          duration?: number
          id?: string
          max_attendees?: number | null
          notes?: string | null
          property_id?: string
          qr_code?: string | null
          status?: Database["public"]["Enums"]["inspection_status"]
        }
        Relationships: [
          {
            foreignKeyName: "inspections_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          message: string
          read: boolean | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string
          agent_id: string
          bathrooms: number | null
          bedrooms: number | null
          building_size: number | null
          created_at: string
          description: string | null
          features: string[] | null
          id: string
          images: string[] | null
          land_size: number | null
          listing_type: Database["public"]["Enums"]["listing_type"]
          parking: number | null
          postcode: string
          price: number | null
          price_display: string | null
          price_from: number | null
          price_to: number | null
          property_type: Database["public"]["Enums"]["property_type"]
          state: string
          status: Database["public"]["Enums"]["property_status"]
          suburb: string
          title: string
          updated_at: string
        }
        Insert: {
          address: string
          agent_id: string
          bathrooms?: number | null
          bedrooms?: number | null
          building_size?: number | null
          created_at?: string
          description?: string | null
          features?: string[] | null
          id?: string
          images?: string[] | null
          land_size?: number | null
          listing_type?: Database["public"]["Enums"]["listing_type"]
          parking?: number | null
          postcode: string
          price?: number | null
          price_display?: string | null
          price_from?: number | null
          price_to?: number | null
          property_type: Database["public"]["Enums"]["property_type"]
          state: string
          status?: Database["public"]["Enums"]["property_status"]
          suburb: string
          title: string
          updated_at?: string
        }
        Update: {
          address?: string
          agent_id?: string
          bathrooms?: number | null
          bedrooms?: number | null
          building_size?: number | null
          created_at?: string
          description?: string | null
          features?: string[] | null
          id?: string
          images?: string[] | null
          land_size?: number | null
          listing_type?: Database["public"]["Enums"]["listing_type"]
          parking?: number | null
          postcode?: string
          price?: number | null
          price_display?: string | null
          price_from?: number | null
          price_to?: number | null
          property_type?: Database["public"]["Enums"]["property_type"]
          state?: string
          status?: Database["public"]["Enums"]["property_status"]
          suburb?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "properties_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_searches: {
        Row: {
          alerts_enabled: boolean | null
          created_at: string
          customer_id: string
          id: string
          name: string | null
          search_criteria: Json
          updated_at: string
        }
        Insert: {
          alerts_enabled?: boolean | null
          created_at?: string
          customer_id: string
          id?: string
          name?: string | null
          search_criteria?: Json
          updated_at?: string
        }
        Update: {
          alerts_enabled?: boolean | null
          created_at?: string
          customer_id?: string
          id?: string
          name?: string | null
          search_criteria?: Json
          updated_at?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_agent_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "agent" | "customer"
      auction_status: "pending" | "live" | "paused" | "sold" | "passed_in"
      booking_status:
        | "pending"
        | "confirmed"
        | "cancelled"
        | "attended"
        | "no_show"
      inspection_status: "scheduled" | "completed" | "cancelled"
      listing_type: "sale" | "rent"
      notification_type:
        | "viewing_request"
        | "inspection_reminder"
        | "new_listing"
        | "status_update"
        | "message"
      property_status: "active" | "sold" | "pending" | "off_market"
      property_type:
        | "house"
        | "apartment"
        | "townhouse"
        | "land"
        | "commercial"
        | "rural"
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
      app_role: ["agent", "customer"],
      auction_status: ["pending", "live", "paused", "sold", "passed_in"],
      booking_status: [
        "pending",
        "confirmed",
        "cancelled",
        "attended",
        "no_show",
      ],
      inspection_status: ["scheduled", "completed", "cancelled"],
      listing_type: ["sale", "rent"],
      notification_type: [
        "viewing_request",
        "inspection_reminder",
        "new_listing",
        "status_update",
        "message",
      ],
      property_status: ["active", "sold", "pending", "off_market"],
      property_type: [
        "house",
        "apartment",
        "townhouse",
        "land",
        "commercial",
        "rural",
      ],
    },
  },
} as const
