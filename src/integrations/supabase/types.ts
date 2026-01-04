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
      agent_partnerships: {
        Row: {
          created_at: string
          id: string
          receiver_id: string
          requester_id: string
          status: Database["public"]["Enums"]["partnership_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          receiver_id: string
          requester_id: string
          status?: Database["public"]["Enums"]["partnership_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          receiver_id?: string
          requester_id?: string
          status?: Database["public"]["Enums"]["partnership_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_partnerships_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_partnerships_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          agency_name: string | null
          allow_partner_listings: boolean
          app_icon_url: string | null
          bio: string | null
          created_at: string
          email: string | null
          hero_cta_text: string | null
          id: string
          license_number: string | null
          meta_description: string | null
          notification_email_enabled: boolean | null
          notification_sound_enabled: boolean | null
          office_address: string | null
          phone: string | null
          profile_image: string | null
          social_facebook: string | null
          social_instagram: string | null
          social_linkedin: string | null
          social_twitter: string | null
          splash_screen_url: string | null
          tagline: string | null
          theme_accent_color: string | null
          theme_agency_name: string | null
          theme_base_font_size: string | null
          theme_body_font: string | null
          theme_favicon_url: string | null
          theme_heading_font: string | null
          theme_heading_scale: string | null
          theme_hero_image_url: string | null
          theme_logo_url: string | null
          theme_primary_color: string | null
          theme_secondary_color: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          agency_name?: string | null
          allow_partner_listings?: boolean
          app_icon_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          hero_cta_text?: string | null
          id?: string
          license_number?: string | null
          meta_description?: string | null
          notification_email_enabled?: boolean | null
          notification_sound_enabled?: boolean | null
          office_address?: string | null
          phone?: string | null
          profile_image?: string | null
          social_facebook?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          social_twitter?: string | null
          splash_screen_url?: string | null
          tagline?: string | null
          theme_accent_color?: string | null
          theme_agency_name?: string | null
          theme_base_font_size?: string | null
          theme_body_font?: string | null
          theme_favicon_url?: string | null
          theme_heading_font?: string | null
          theme_heading_scale?: string | null
          theme_hero_image_url?: string | null
          theme_logo_url?: string | null
          theme_primary_color?: string | null
          theme_secondary_color?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          agency_name?: string | null
          allow_partner_listings?: boolean
          app_icon_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          hero_cta_text?: string | null
          id?: string
          license_number?: string | null
          meta_description?: string | null
          notification_email_enabled?: boolean | null
          notification_sound_enabled?: boolean | null
          office_address?: string | null
          phone?: string | null
          profile_image?: string | null
          social_facebook?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          social_twitter?: string | null
          splash_screen_url?: string | null
          tagline?: string | null
          theme_accent_color?: string | null
          theme_agency_name?: string | null
          theme_base_font_size?: string | null
          theme_body_font?: string | null
          theme_favicon_url?: string | null
          theme_heading_font?: string | null
          theme_heading_scale?: string | null
          theme_hero_image_url?: string | null
          theme_logo_url?: string | null
          theme_primary_color?: string | null
          theme_secondary_color?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      appraisal_interests: {
        Row: {
          appraisal_id: string
          created_at: string
          customer_id: string
          id: string
          message: string | null
          offer_amount: number | null
          status: string
          updated_at: string
        }
        Insert: {
          appraisal_id: string
          created_at?: string
          customer_id: string
          id?: string
          message?: string | null
          offer_amount?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          appraisal_id?: string
          created_at?: string
          customer_id?: string
          id?: string
          message?: string | null
          offer_amount?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appraisal_interests_appraisal_id_fkey"
            columns: ["appraisal_id"]
            isOneToOne: false
            referencedRelation: "appraisals"
            referencedColumns: ["id"]
          },
        ]
      }
      appraisal_requests: {
        Row: {
          address: string
          bathrooms: number | null
          bedrooms: number | null
          created_at: string
          customer_id: string
          id: string
          land_size: number | null
          notes: string | null
          parking: number | null
          postcode: string
          property_type: string
          state: string
          status: string
          suburb: string
          updated_at: string
        }
        Insert: {
          address: string
          bathrooms?: number | null
          bedrooms?: number | null
          created_at?: string
          customer_id: string
          id?: string
          land_size?: number | null
          notes?: string | null
          parking?: number | null
          postcode: string
          property_type?: string
          state?: string
          status?: string
          suburb: string
          updated_at?: string
        }
        Update: {
          address?: string
          bathrooms?: number | null
          bedrooms?: number | null
          created_at?: string
          customer_id?: string
          id?: string
          land_size?: number | null
          notes?: string | null
          parking?: number | null
          postcode?: string
          property_type?: string
          state?: string
          status?: string
          suburb?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appraisal_requests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      appraisals: {
        Row: {
          address: string
          agent_id: string
          bathrooms: number | null
          bedrooms: number | null
          confidence: string
          created_at: string
          headline: string | null
          id: string
          images: string[] | null
          is_public: boolean
          land_size: number | null
          notes: string | null
          parking: number | null
          postcode: string
          price_from: number
          price_to: number
          property_id: string | null
          property_type: string | null
          state: string
          suburb: string
          updated_at: string
        }
        Insert: {
          address: string
          agent_id: string
          bathrooms?: number | null
          bedrooms?: number | null
          confidence?: string
          created_at?: string
          headline?: string | null
          id?: string
          images?: string[] | null
          is_public?: boolean
          land_size?: number | null
          notes?: string | null
          parking?: number | null
          postcode: string
          price_from: number
          price_to: number
          property_id?: string | null
          property_type?: string | null
          state?: string
          suburb: string
          updated_at?: string
        }
        Update: {
          address?: string
          agent_id?: string
          bathrooms?: number | null
          bedrooms?: number | null
          confidence?: string
          created_at?: string
          headline?: string | null
          id?: string
          images?: string[] | null
          is_public?: boolean
          land_size?: number | null
          notes?: string | null
          parking?: number | null
          postcode?: string
          price_from?: number
          price_to?: number
          property_id?: string | null
          property_type?: string | null
          state?: string
          suburb?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appraisals_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appraisals_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      auction_registrations: {
        Row: {
          auction_id: string
          created_at: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auction_id: string
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auction_id?: string
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auction_registrations_auction_id_fkey"
            columns: ["auction_id"]
            isOneToOne: false
            referencedRelation: "auctions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auction_registrations_auction_id_fkey"
            columns: ["auction_id"]
            isOneToOne: false
            referencedRelation: "public_auctions"
            referencedColumns: ["id"]
          },
        ]
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
          {
            foreignKeyName: "bids_auction_id_fkey"
            columns: ["auction_id"]
            isOneToOne: false
            referencedRelation: "public_auctions"
            referencedColumns: ["id"]
          },
        ]
      }
      buyer_messages: {
        Row: {
          agent_id: string | null
          appraisal_id: string | null
          auction_id: string | null
          buyer_id: string
          category: string
          content: string
          created_at: string
          id: string
          property_id: string | null
          read: boolean
          starred: boolean
          subject: string
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          appraisal_id?: string | null
          auction_id?: string | null
          buyer_id: string
          category: string
          content: string
          created_at?: string
          id?: string
          property_id?: string | null
          read?: boolean
          starred?: boolean
          subject: string
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          appraisal_id?: string | null
          auction_id?: string | null
          buyer_id?: string
          category?: string
          content?: string
          created_at?: string
          id?: string
          property_id?: string | null
          read?: boolean
          starred?: boolean
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "buyer_messages_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buyer_messages_appraisal_id_fkey"
            columns: ["appraisal_id"]
            isOneToOne: false
            referencedRelation: "appraisals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buyer_messages_auction_id_fkey"
            columns: ["auction_id"]
            isOneToOne: false
            referencedRelation: "auctions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buyer_messages_auction_id_fkey"
            columns: ["auction_id"]
            isOneToOne: false
            referencedRelation: "public_auctions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buyer_messages_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_notes: {
        Row: {
          agent_id: string
          content: string
          created_at: string
          customer_id: string
          id: string
          note_type: Database["public"]["Enums"]["crm_note_type"]
          updated_at: string
        }
        Insert: {
          agent_id: string
          content: string
          created_at?: string
          customer_id: string
          id?: string
          note_type?: Database["public"]["Enums"]["crm_note_type"]
          updated_at?: string
        }
        Update: {
          agent_id?: string
          content?: string
          created_at?: string
          customer_id?: string
          id?: string
          note_type?: Database["public"]["Enums"]["crm_note_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_notes_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_notes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_tags: {
        Row: {
          agent_id: string
          color: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          agent_id: string
          color?: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          agent_id?: string
          color?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_tags_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_tags: {
        Row: {
          agent_id: string
          created_at: string
          customer_id: string
          id: string
          tag_id: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          customer_id: string
          id?: string
          tag_id: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          customer_id?: string
          id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_tags_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_tags_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "crm_tags"
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
      inspection_invitations: {
        Row: {
          agent_id: string
          agent_message: string | null
          appraisal_id: string
          appraisal_interest_id: string
          buyer_message: string | null
          created_at: string
          customer_id: string
          id: string
          proposed_dates: Json
          selected_date: string | null
          selected_time: string | null
          status: string
          updated_at: string
        }
        Insert: {
          agent_id: string
          agent_message?: string | null
          appraisal_id: string
          appraisal_interest_id: string
          buyer_message?: string | null
          created_at?: string
          customer_id: string
          id?: string
          proposed_dates?: Json
          selected_date?: string | null
          selected_time?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          agent_id?: string
          agent_message?: string | null
          appraisal_id?: string
          appraisal_interest_id?: string
          buyer_message?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          proposed_dates?: Json
          selected_date?: string | null
          selected_time?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspection_invitations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_invitations_appraisal_id_fkey"
            columns: ["appraisal_id"]
            isOneToOne: false
            referencedRelation: "appraisals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_invitations_appraisal_interest_id_fkey"
            columns: ["appraisal_interest_id"]
            isOneToOne: false
            referencedRelation: "appraisal_interests"
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
      rate_limits: {
        Row: {
          created_at: string
          endpoint_type: string
          id: string
          identifier: string
          request_count: number
          window_start: string
        }
        Insert: {
          created_at?: string
          endpoint_type: string
          id?: string
          identifier: string
          request_count?: number
          window_start?: string
        }
        Update: {
          created_at?: string
          endpoint_type?: string
          id?: string
          identifier?: string
          request_count?: number
          window_start?: string
        }
        Relationships: []
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
      viewing_requests: {
        Row: {
          agent_id: string
          agent_notes: string | null
          created_at: string
          customer_id: string
          id: string
          message: string | null
          property_id: string
          proposed_date: string | null
          proposed_time: string | null
          requested_date: string
          requested_time: string
          status: Database["public"]["Enums"]["viewing_request_status"]
          updated_at: string
        }
        Insert: {
          agent_id: string
          agent_notes?: string | null
          created_at?: string
          customer_id: string
          id?: string
          message?: string | null
          property_id: string
          proposed_date?: string | null
          proposed_time?: string | null
          requested_date: string
          requested_time: string
          status?: Database["public"]["Enums"]["viewing_request_status"]
          updated_at?: string
        }
        Update: {
          agent_id?: string
          agent_notes?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          message?: string | null
          property_id?: string
          proposed_date?: string | null
          proposed_time?: string | null
          requested_date?: string
          requested_time?: string
          status?: Database["public"]["Enums"]["viewing_request_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "viewing_requests_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "viewing_requests_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_auctions: {
        Row: {
          created_at: string | null
          current_bid: number | null
          end_time: string | null
          id: string | null
          min_increment: number | null
          property_id: string | null
          start_time: string | null
          status: Database["public"]["Enums"]["auction_status"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_bid?: number | null
          end_time?: string | null
          id?: string | null
          min_increment?: number | null
          property_id?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["auction_status"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_bid?: number | null
          end_time?: string | null
          id?: string | null
          min_increment?: number | null
          property_id?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["auction_status"] | null
          updated_at?: string | null
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
    }
    Functions: {
      check_rate_limit: {
        Args: {
          p_endpoint_type: string
          p_identifier: string
          p_max_requests: number
          p_window_seconds?: number
        }
        Returns: Json
      }
      cleanup_rate_limits: { Args: never; Returns: undefined }
      get_agent_id: { Args: { _user_id: string }; Returns: string }
      get_customer_booked_inspection_ids: {
        Args: { _customer_id: string }
        Returns: string[]
      }
      get_customer_booked_property_ids: {
        Args: { _customer_id: string }
        Returns: string[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      send_inspection_reminders: { Args: never; Returns: undefined }
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
      crm_note_type: "call" | "email" | "meeting" | "follow_up" | "general"
      inspection_status: "scheduled" | "completed" | "cancelled"
      listing_type: "sale" | "rent"
      notification_type:
        | "viewing_request"
        | "inspection_reminder"
        | "new_listing"
        | "status_update"
        | "message"
        | "appraisal_interest"
      partnership_status: "pending" | "accepted" | "rejected"
      property_status: "active" | "sold" | "pending" | "off_market"
      property_type:
        | "house"
        | "apartment"
        | "townhouse"
        | "land"
        | "commercial"
        | "rural"
      viewing_request_status:
        | "pending"
        | "accepted"
        | "declined"
        | "counter_proposed"
        | "confirmed"
        | "cancelled"
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
      crm_note_type: ["call", "email", "meeting", "follow_up", "general"],
      inspection_status: ["scheduled", "completed", "cancelled"],
      listing_type: ["sale", "rent"],
      notification_type: [
        "viewing_request",
        "inspection_reminder",
        "new_listing",
        "status_update",
        "message",
        "appraisal_interest",
      ],
      partnership_status: ["pending", "accepted", "rejected"],
      property_status: ["active", "sold", "pending", "off_market"],
      property_type: [
        "house",
        "apartment",
        "townhouse",
        "land",
        "commercial",
        "rural",
      ],
      viewing_request_status: [
        "pending",
        "accepted",
        "declined",
        "counter_proposed",
        "confirmed",
        "cancelled",
      ],
    },
  },
} as const
