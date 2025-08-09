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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_2fa_secrets: {
        Row: {
          admin_email: string
          backup_codes: string[] | null
          created_at: string
          device_fingerprints: Json | null
          id: string
          is_enabled: boolean
          last_used_at: string | null
          secret_key: string
          updated_at: string
        }
        Insert: {
          admin_email: string
          backup_codes?: string[] | null
          created_at?: string
          device_fingerprints?: Json | null
          id?: string
          is_enabled?: boolean
          last_used_at?: string | null
          secret_key: string
          updated_at?: string
        }
        Update: {
          admin_email?: string
          backup_codes?: string[] | null
          created_at?: string
          device_fingerprints?: Json | null
          id?: string
          is_enabled?: boolean
          last_used_at?: string | null
          secret_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      admin_2fa_sessions: {
        Row: {
          admin_email: string
          created_at: string
          device_fingerprint: string | null
          expires_at: string
          id: string
          ip_address: string | null
          session_token: string
          user_agent: string | null
          verified_at: string | null
        }
        Insert: {
          admin_email: string
          created_at?: string
          device_fingerprint?: string | null
          expires_at: string
          id?: string
          ip_address?: string | null
          session_token: string
          user_agent?: string | null
          verified_at?: string | null
        }
        Update: {
          admin_email?: string
          created_at?: string
          device_fingerprint?: string | null
          expires_at?: string
          id?: string
          ip_address?: string | null
          session_token?: string
          user_agent?: string | null
          verified_at?: string | null
        }
        Relationships: []
      }
      admin_audit_log: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json | null
          resource: string
          resource_id: string | null
          user_agent: string | null
          user_email: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          resource: string
          resource_id?: string | null
          user_agent?: string | null
          user_email: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          resource?: string
          resource_id?: string | null
          user_agent?: string | null
          user_email?: string
        }
        Relationships: []
      }
      admin_device_auth: {
        Row: {
          admin_email: string
          browser_info: Json | null
          created_at: string
          device_fingerprint: string
          device_name: string | null
          device_type: string | null
          expires_at: string | null
          id: string
          is_trusted: boolean
          last_used_at: string | null
        }
        Insert: {
          admin_email: string
          browser_info?: Json | null
          created_at?: string
          device_fingerprint: string
          device_name?: string | null
          device_type?: string | null
          expires_at?: string | null
          id?: string
          is_trusted?: boolean
          last_used_at?: string | null
        }
        Update: {
          admin_email?: string
          browser_info?: Json | null
          created_at?: string
          device_fingerprint?: string
          device_name?: string | null
          device_type?: string | null
          expires_at?: string | null
          id?: string
          is_trusted?: boolean
          last_used_at?: string | null
        }
        Relationships: []
      }
      admin_feed_controls: {
        Row: {
          author_blacklist: string[] | null
          author_whitelist: string[] | null
          auto_refresh_seconds: number | null
          created_at: string | null
          display_rules: Json | null
          id: string
          is_active: boolean | null
          keyword_filters: string[] | null
          max_messages: number | null
          section_name: string
          updated_at: string | null
        }
        Insert: {
          author_blacklist?: string[] | null
          author_whitelist?: string[] | null
          auto_refresh_seconds?: number | null
          created_at?: string | null
          display_rules?: Json | null
          id?: string
          is_active?: boolean | null
          keyword_filters?: string[] | null
          max_messages?: number | null
          section_name: string
          updated_at?: string | null
        }
        Update: {
          author_blacklist?: string[] | null
          author_whitelist?: string[] | null
          auto_refresh_seconds?: number | null
          created_at?: string | null
          display_rules?: Json | null
          id?: string
          is_active?: boolean | null
          keyword_filters?: string[] | null
          max_messages?: number | null
          section_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      admin_ip_allowlist: {
        Row: {
          admin_email: string
          created_at: string
          created_by: string | null
          description: string | null
          expires_at: string | null
          id: string
          ip_address: unknown
          is_active: boolean
          subnet_mask: number | null
          updated_at: string
        }
        Insert: {
          admin_email: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          ip_address: unknown
          is_active?: boolean
          subnet_mask?: number | null
          updated_at?: string
        }
        Update: {
          admin_email?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: unknown
          is_active?: boolean
          subnet_mask?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      admin_secure_sessions: {
        Row: {
          admin_email: string
          created_at: string | null
          device_fingerprint: string | null
          expires_at: string
          id: string
          ip_address: unknown | null
          is_active: boolean | null
          last_activity_at: string | null
          location_data: Json | null
          revoked_at: string | null
          revoked_reason: string | null
          security_level: string | null
          session_token: string
          user_agent: string | null
        }
        Insert: {
          admin_email: string
          created_at?: string | null
          device_fingerprint?: string | null
          expires_at: string
          id?: string
          ip_address?: unknown | null
          is_active?: boolean | null
          last_activity_at?: string | null
          location_data?: Json | null
          revoked_at?: string | null
          revoked_reason?: string | null
          security_level?: string | null
          session_token: string
          user_agent?: string | null
        }
        Update: {
          admin_email?: string
          created_at?: string | null
          device_fingerprint?: string | null
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          is_active?: boolean | null
          last_activity_at?: string | null
          location_data?: Json | null
          revoked_at?: string | null
          revoked_reason?: string | null
          security_level?: string | null
          session_token?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      admin_security_events: {
        Row: {
          admin_email: string
          created_at: string
          device_fingerprint: string | null
          event_details: Json | null
          event_type: string
          id: string
          ip_address: string | null
          success: boolean
          user_agent: string | null
        }
        Insert: {
          admin_email: string
          created_at?: string
          device_fingerprint?: string | null
          event_details?: Json | null
          event_type: string
          id?: string
          ip_address?: string | null
          success?: boolean
          user_agent?: string | null
        }
        Update: {
          admin_email?: string
          created_at?: string
          device_fingerprint?: string | null
          event_details?: Json | null
          event_type?: string
          id?: string
          ip_address?: string | null
          success?: boolean
          user_agent?: string | null
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          analyst_id: string | null
          created_at: string | null
          email: string | null
          failed_2fa_attempts: number | null
          id: string
          is_active: boolean | null
          last_2fa_setup_at: string | null
          last_login_at: string | null
          locked_until: string | null
          password_reset_required_reason: string | null
          permissions: Json | null
          requires_2fa: boolean | null
          requires_password_reset: boolean | null
          role: string
          subscriber_id: string | null
          temp_password_set_at: string | null
          updated_at: string | null
          user_type: string | null
        }
        Insert: {
          analyst_id?: string | null
          created_at?: string | null
          email?: string | null
          failed_2fa_attempts?: number | null
          id?: string
          is_active?: boolean | null
          last_2fa_setup_at?: string | null
          last_login_at?: string | null
          locked_until?: string | null
          password_reset_required_reason?: string | null
          permissions?: Json | null
          requires_2fa?: boolean | null
          requires_password_reset?: boolean | null
          role?: string
          subscriber_id?: string | null
          temp_password_set_at?: string | null
          updated_at?: string | null
          user_type?: string | null
        }
        Update: {
          analyst_id?: string | null
          created_at?: string | null
          email?: string | null
          failed_2fa_attempts?: number | null
          id?: string
          is_active?: boolean | null
          last_2fa_setup_at?: string | null
          last_login_at?: string | null
          locked_until?: string | null
          password_reset_required_reason?: string | null
          permissions?: Json | null
          requires_2fa?: boolean | null
          requires_password_reset?: boolean | null
          role?: string
          subscriber_id?: string | null
          temp_password_set_at?: string | null
          updated_at?: string | null
          user_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_users_analyst_id_fkey"
            columns: ["analyst_id"]
            isOneToOne: false
            referencedRelation: "analysts"
            referencedColumns: ["id"]
          },
        ]
      }
      analyst_call_detections: {
        Row: {
          analyst_signal_id: string | null
          auto_processed: boolean
          confidence_score: number
          created_at: string
          extracted_data: Json
          id: string
          pattern_id: string | null
          requires_review: boolean
          reviewed_at: string | null
          reviewed_by: string | null
          telegram_message_id: string | null
          updated_at: string
        }
        Insert: {
          analyst_signal_id?: string | null
          auto_processed?: boolean
          confidence_score?: number
          created_at?: string
          extracted_data?: Json
          id?: string
          pattern_id?: string | null
          requires_review?: boolean
          reviewed_at?: string | null
          reviewed_by?: string | null
          telegram_message_id?: string | null
          updated_at?: string
        }
        Update: {
          analyst_signal_id?: string | null
          auto_processed?: boolean
          confidence_score?: number
          created_at?: string
          extracted_data?: Json
          id?: string
          pattern_id?: string | null
          requires_review?: boolean
          reviewed_at?: string | null
          reviewed_by?: string | null
          telegram_message_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "analyst_call_detections_analyst_signal_id_fkey"
            columns: ["analyst_signal_id"]
            isOneToOne: false
            referencedRelation: "analyst_signals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analyst_call_detections_pattern_id_fkey"
            columns: ["pattern_id"]
            isOneToOne: false
            referencedRelation: "analyst_call_patterns"
            referencedColumns: ["id"]
          },
        ]
      }
      analyst_call_patterns: {
        Row: {
          analyst_id: string | null
          created_at: string
          created_by: string | null
          extraction_config: Json
          id: string
          is_active: boolean
          pattern_name: string
          pattern_regex: string
          priority: number
          updated_at: string
        }
        Insert: {
          analyst_id?: string | null
          created_at?: string
          created_by?: string | null
          extraction_config?: Json
          id?: string
          is_active?: boolean
          pattern_name: string
          pattern_regex: string
          priority?: number
          updated_at?: string
        }
        Update: {
          analyst_id?: string | null
          created_at?: string
          created_by?: string | null
          extraction_config?: Json
          id?: string
          is_active?: boolean
          pattern_name?: string
          pattern_regex?: string
          priority?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "analyst_call_patterns_analyst_id_fkey"
            columns: ["analyst_id"]
            isOneToOne: false
            referencedRelation: "analysts"
            referencedColumns: ["id"]
          },
        ]
      }
      analyst_channel_config: {
        Row: {
          analyst_id: string | null
          auto_process_calls: boolean
          channel_name: string | null
          chat_id: number
          created_at: string
          id: string
          is_monitoring_enabled: boolean
          min_confidence_threshold: number
          updated_at: string
        }
        Insert: {
          analyst_id?: string | null
          auto_process_calls?: boolean
          channel_name?: string | null
          chat_id: number
          created_at?: string
          id?: string
          is_monitoring_enabled?: boolean
          min_confidence_threshold?: number
          updated_at?: string
        }
        Update: {
          analyst_id?: string | null
          auto_process_calls?: boolean
          channel_name?: string | null
          chat_id?: number
          created_at?: string
          id?: string
          is_monitoring_enabled?: boolean
          min_confidence_threshold?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "analyst_channel_config_analyst_id_fkey"
            columns: ["analyst_id"]
            isOneToOne: false
            referencedRelation: "analysts"
            referencedColumns: ["id"]
          },
        ]
      }
      analyst_degen_subscriptions: {
        Row: {
          analyst_name: string
          created_at: string
          id: string
          is_active: boolean
          subscription_tier: Database["public"]["Enums"]["subscription_tier"]
          telegram_user_id: number | null
          telegram_username: string | null
          updated_at: string
          user_email: string
        }
        Insert: {
          analyst_name: string
          created_at?: string
          id?: string
          is_active?: boolean
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          telegram_user_id?: number | null
          telegram_username?: string | null
          updated_at?: string
          user_email: string
        }
        Update: {
          analyst_name?: string
          created_at?: string
          id?: string
          is_active?: boolean
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          telegram_user_id?: number | null
          telegram_username?: string | null
          updated_at?: string
          user_email?: string
        }
        Relationships: []
      }
      analyst_signals: {
        Row: {
          analyst_name: string
          analyst_photo_url: string | null
          created_at: string | null
          created_by: string | null
          entry_conditions: string | null
          entry_price: number | null
          entry_type: Database["public"]["Enums"]["entry_type"]
          formatted_output: string | null
          full_description: string
          id: string
          market: Database["public"]["Enums"]["market_type"]
          posted_to_telegram: boolean | null
          risk_management: Database["public"]["Enums"]["risk_management_type"]
          risk_percentage: number
          status: string | null
          stop_loss_conditions: string | null
          stop_loss_price: number | null
          targets: Json | null
          telegram_message_id: number | null
          ticker: string
          trade_direction: Database["public"]["Enums"]["trade_direction"]
          trade_type: Database["public"]["Enums"]["trade_type"]
          updated_at: string | null
        }
        Insert: {
          analyst_name: string
          analyst_photo_url?: string | null
          created_at?: string | null
          created_by?: string | null
          entry_conditions?: string | null
          entry_price?: number | null
          entry_type: Database["public"]["Enums"]["entry_type"]
          formatted_output?: string | null
          full_description: string
          id?: string
          market: Database["public"]["Enums"]["market_type"]
          posted_to_telegram?: boolean | null
          risk_management: Database["public"]["Enums"]["risk_management_type"]
          risk_percentage: number
          status?: string | null
          stop_loss_conditions?: string | null
          stop_loss_price?: number | null
          targets?: Json | null
          telegram_message_id?: number | null
          ticker: string
          trade_direction: Database["public"]["Enums"]["trade_direction"]
          trade_type: Database["public"]["Enums"]["trade_type"]
          updated_at?: string | null
        }
        Update: {
          analyst_name?: string
          analyst_photo_url?: string | null
          created_at?: string | null
          created_by?: string | null
          entry_conditions?: string | null
          entry_price?: number | null
          entry_type?: Database["public"]["Enums"]["entry_type"]
          formatted_output?: string | null
          full_description?: string
          id?: string
          market?: Database["public"]["Enums"]["market_type"]
          posted_to_telegram?: boolean | null
          risk_management?: Database["public"]["Enums"]["risk_management_type"]
          risk_percentage?: number
          status?: string | null
          stop_loss_conditions?: string | null
          stop_loss_price?: number | null
          targets?: Json | null
          telegram_message_id?: number | null
          ticker?: string
          trade_direction?: Database["public"]["Enums"]["trade_direction"]
          trade_type?: Database["public"]["Enums"]["trade_type"]
          updated_at?: string | null
        }
        Relationships: []
      }
      analysts: {
        Row: {
          avatar_url: string | null
          created_at: string
          description: string | null
          display_name: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          description?: string | null
          display_name?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          description?: string | null
          display_name?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      articles: {
        Row: {
          author_name: string | null
          category: string | null
          content: string | null
          created_at: string | null
          excerpt: string | null
          featured_image_url: string | null
          id: string
          likes_count: number | null
          metadata: Json | null
          published_at: string | null
          read_time_minutes: number | null
          required_tier: Database["public"]["Enums"]["subscription_tier"] | null
          seo_description: string | null
          seo_title: string | null
          status: string
          tags: string[] | null
          title: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          author_name?: string | null
          category?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          likes_count?: number | null
          metadata?: Json | null
          published_at?: string | null
          read_time_minutes?: number | null
          required_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          seo_description?: string | null
          seo_title?: string | null
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          author_name?: string | null
          category?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          likes_count?: number | null
          metadata?: Json | null
          published_at?: string | null
          read_time_minutes?: number | null
          required_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          seo_description?: string | null
          seo_title?: string | null
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      auth_rate_limits: {
        Row: {
          attempt_count: number
          blocked_until: string | null
          created_at: string
          email: string | null
          id: string
          ip_address: unknown
          updated_at: string
          window_start: string
        }
        Insert: {
          attempt_count?: number
          blocked_until?: string | null
          created_at?: string
          email?: string | null
          id?: string
          ip_address: unknown
          updated_at?: string
          window_start?: string
        }
        Update: {
          attempt_count?: number
          blocked_until?: string | null
          created_at?: string
          email?: string | null
          id?: string
          ip_address?: unknown
          updated_at?: string
          window_start?: string
        }
        Relationships: []
      }
      authentication_audit_log: {
        Row: {
          action_type: string
          auth_method: string
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json | null
          user_agent: string | null
          user_email: string
        }
        Insert: {
          action_type: string
          auth_method: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_email: string
        }
        Update: {
          action_type?: string
          auth_method?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_email?: string
        }
        Relationships: []
      }
      auto_highlights: {
        Row: {
          assigned_at: string
          expires_at: string | null
          id: string
          priority_score: number
          rule_id: string | null
          telegram_message_id: string | null
        }
        Insert: {
          assigned_at?: string
          expires_at?: string | null
          id?: string
          priority_score?: number
          rule_id?: string | null
          telegram_message_id?: string | null
        }
        Update: {
          assigned_at?: string
          expires_at?: string | null
          id?: string
          priority_score?: number
          rule_id?: string | null
          telegram_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auto_highlights_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "chat_highlight_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      backup_history: {
        Row: {
          backup_type: string
          completed_at: string | null
          created_at: string
          error_message: string | null
          file_size_mb: number | null
          id: string
          status: string
        }
        Insert: {
          backup_type?: string
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          file_size_mb?: number | null
          id?: string
          status?: string
        }
        Update: {
          backup_type?: string
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          file_size_mb?: number | null
          id?: string
          status?: string
        }
        Relationships: []
      }
      beehiiv_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          locked_until: string | null
          login_attempts: number
          metadata: Json | null
          password_hash: string | null
          password_reset_expires_at: string | null
          password_reset_token: string | null
          requires_password_setup: boolean
          status: string
          subscription_tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          locked_until?: string | null
          login_attempts?: number
          metadata?: Json | null
          password_hash?: string | null
          password_reset_expires_at?: string | null
          password_reset_token?: string | null
          requires_password_setup?: boolean
          status?: string
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          locked_until?: string | null
          login_attempts?: number
          metadata?: Json | null
          password_hash?: string | null
          password_reset_expires_at?: string | null
          password_reset_token?: string | null
          requires_password_setup?: boolean
          status?: string
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
        }
        Relationships: []
      }
      chat_highlight_rules: {
        Row: {
          created_at: string
          created_by: string | null
          highlight_color: string | null
          highlight_style: string | null
          id: string
          is_active: boolean
          priority: number
          rule_config: Json
          rule_name: string
          rule_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          highlight_color?: string | null
          highlight_style?: string | null
          id?: string
          is_active?: boolean
          priority?: number
          rule_config?: Json
          rule_name: string
          rule_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          highlight_color?: string | null
          highlight_style?: string | null
          id?: string
          is_active?: boolean
          priority?: number
          rule_config?: Json
          rule_name?: string
          rule_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_highlights: {
        Row: {
          custom_description: string | null
          custom_title: string | null
          id: string
          priority_order: number | null
          promoted_at: string | null
          promoted_by: string | null
          telegram_message_id: string | null
        }
        Insert: {
          custom_description?: string | null
          custom_title?: string | null
          id?: string
          priority_order?: number | null
          promoted_at?: string | null
          promoted_by?: string | null
          telegram_message_id?: string | null
        }
        Update: {
          custom_description?: string | null
          custom_title?: string | null
          id?: string
          priority_order?: number | null
          promoted_at?: string | null
          promoted_by?: string | null
          telegram_message_id?: string | null
        }
        Relationships: []
      }
      comment_votes: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          user_email: string
          vote_type: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          user_email: string
          vote_type: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          user_email?: string
          vote_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_votes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "highlight_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      content_analytics: {
        Row: {
          action_type: string
          content_id: string
          content_type: string
          created_at: string | null
          id: string
          metadata: Json | null
          session_duration_seconds: number | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          content_id: string
          content_type: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          session_duration_seconds?: number | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          content_id?: string
          content_type?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          session_duration_seconds?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      course_modules: {
        Row: {
          content_text: string | null
          content_type: string | null
          content_url: string | null
          course_id: string | null
          created_at: string | null
          description: string | null
          estimated_duration_minutes: number | null
          id: string
          is_preview: boolean | null
          metadata: Json | null
          order_index: number
          title: string
          updated_at: string | null
        }
        Insert: {
          content_text?: string | null
          content_type?: string | null
          content_url?: string | null
          course_id?: string | null
          created_at?: string | null
          description?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          is_preview?: boolean | null
          metadata?: Json | null
          order_index: number
          title: string
          updated_at?: string | null
        }
        Update: {
          content_text?: string | null
          content_type?: string | null
          content_url?: string | null
          course_id?: string | null
          created_at?: string | null
          description?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          is_preview?: boolean | null
          metadata?: Json | null
          order_index?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string | null
          description: string | null
          difficulty_level: string | null
          estimated_duration_hours: number | null
          id: string
          instructor_name: string | null
          metadata: Json | null
          price_cents: number | null
          required_tier: Database["public"]["Enums"]["subscription_tier"] | null
          status: string
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          difficulty_level?: string | null
          estimated_duration_hours?: number | null
          id?: string
          instructor_name?: string | null
          metadata?: Json | null
          price_cents?: number | null
          required_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          status?: string
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          difficulty_level?: string | null
          estimated_duration_hours?: number | null
          id?: string
          instructor_name?: string | null
          metadata?: Json | null
          price_cents?: number | null
          required_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          status?: string
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      crypto_alerts: {
        Row: {
          created_at: string
          current_price: number | null
          entry_activated: boolean
          entry_price: number
          id: string
          invalidated: boolean
          is_active: boolean
          metadata: Json | null
          position_type: string
          profit_loss: number | null
          profit_percentage: number | null
          progress_percentage: number | null
          quantity: number | null
          status: string
          stop_loss_price: number | null
          stopped_out: boolean
          symbol: string
          take_profit_price: number | null
          target_price: number
          trade_status: string | null
          trader_name: string
          trading_type: string | null
          triggered_at: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          current_price?: number | null
          entry_activated?: boolean
          entry_price: number
          id?: string
          invalidated?: boolean
          is_active?: boolean
          metadata?: Json | null
          position_type?: string
          profit_loss?: number | null
          profit_percentage?: number | null
          progress_percentage?: number | null
          quantity?: number | null
          status?: string
          stop_loss_price?: number | null
          stopped_out?: boolean
          symbol: string
          take_profit_price?: number | null
          target_price: number
          trade_status?: string | null
          trader_name?: string
          trading_type?: string | null
          triggered_at?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          current_price?: number | null
          entry_activated?: boolean
          entry_price?: number
          id?: string
          invalidated?: boolean
          is_active?: boolean
          metadata?: Json | null
          position_type?: string
          profit_loss?: number | null
          profit_percentage?: number | null
          progress_percentage?: number | null
          quantity?: number | null
          status?: string
          stop_loss_price?: number | null
          stopped_out?: boolean
          symbol?: string
          take_profit_price?: number | null
          target_price?: number
          trade_status?: string | null
          trader_name?: string
          trading_type?: string | null
          triggered_at?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      csp_violation_reports: {
        Row: {
          blocked_uri: string | null
          column_number: number | null
          created_at: string | null
          document_uri: string | null
          id: string
          ip_address: unknown | null
          line_number: number | null
          source_file: string | null
          user_agent: string | null
          violated_directive: string | null
          violation_data: Json | null
        }
        Insert: {
          blocked_uri?: string | null
          column_number?: number | null
          created_at?: string | null
          document_uri?: string | null
          id?: string
          ip_address?: unknown | null
          line_number?: number | null
          source_file?: string | null
          user_agent?: string | null
          violated_directive?: string | null
          violation_data?: Json | null
        }
        Update: {
          blocked_uri?: string | null
          column_number?: number | null
          created_at?: string | null
          document_uri?: string | null
          id?: string
          ip_address?: unknown | null
          line_number?: number | null
          source_file?: string | null
          user_agent?: string | null
          violated_directive?: string | null
          violation_data?: Json | null
        }
        Relationships: []
      }
      data_access_logs: {
        Row: {
          access_granted: boolean
          action_type: string
          admin_email: string | null
          created_at: string
          denial_reason: string | null
          device_fingerprint: string | null
          geo_location: Json | null
          id: string
          ip_address: unknown | null
          resource_id: string | null
          resource_type: string
          risk_score: number | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          access_granted?: boolean
          action_type: string
          admin_email?: string | null
          created_at?: string
          denial_reason?: string | null
          device_fingerprint?: string | null
          geo_location?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type: string
          risk_score?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          access_granted?: boolean
          action_type?: string
          admin_email?: string | null
          created_at?: string
          denial_reason?: string | null
          device_fingerprint?: string | null
          geo_location?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type?: string
          risk_score?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      data_access_quotas: {
        Row: {
          admin_email: string
          created_at: string
          id: string
          period_end: string
          period_start: string
          quota_limit: number
          quota_period: string
          quota_used: number | null
          resource_type: string
          updated_at: string
        }
        Insert: {
          admin_email: string
          created_at?: string
          id?: string
          period_end: string
          period_start: string
          quota_limit: number
          quota_period?: string
          quota_used?: number | null
          resource_type: string
          updated_at?: string
        }
        Update: {
          admin_email?: string
          created_at?: string
          id?: string
          period_end?: string
          period_start?: string
          quota_limit?: number
          quota_period?: string
          quota_used?: number | null
          resource_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      degen_call_notifications: {
        Row: {
          analyst_signal_id: string
          created_at: string
          error_message: string | null
          id: string
          message_content: string
          recipient_count: number
          sent_at: string
          status: string
          telegram_message_id: number | null
        }
        Insert: {
          analyst_signal_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          message_content: string
          recipient_count?: number
          sent_at?: string
          status?: string
          telegram_message_id?: number | null
        }
        Update: {
          analyst_signal_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          message_content?: string
          recipient_count?: number
          sent_at?: string
          status?: string
          telegram_message_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "degen_call_notifications_analyst_signal_id_fkey"
            columns: ["analyst_signal_id"]
            isOneToOne: false
            referencedRelation: "analyst_signals"
            referencedColumns: ["id"]
          },
        ]
      }
      degen_call_subscriptions: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          subscription_tier: Database["public"]["Enums"]["subscription_tier"]
          telegram_user_id: number | null
          telegram_username: string | null
          updated_at: string
          user_email: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          telegram_user_id?: number | null
          telegram_username?: string | null
          updated_at?: string
          user_email: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          telegram_user_id?: number | null
          telegram_username?: string | null
          updated_at?: string
          user_email?: string
        }
        Relationships: []
      }
      encrypted_user_data: {
        Row: {
          access_count: number | null
          accessed_at: string | null
          classification: Database["public"]["Enums"]["data_classification"]
          created_at: string
          data_type: string
          encrypted_value: string
          encryption_key_id: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_count?: number | null
          accessed_at?: string | null
          classification?: Database["public"]["Enums"]["data_classification"]
          created_at?: string
          data_type: string
          encrypted_value: string
          encryption_key_id: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_count?: number | null
          accessed_at?: string | null
          classification?: Database["public"]["Enums"]["data_classification"]
          created_at?: string
          data_type?: string
          encrypted_value?: string
          encryption_key_id?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      feedback: {
        Row: {
          assigned_to: string | null
          attachments: string[] | null
          browser_info: Json | null
          category: Database["public"]["Enums"]["feedback_category"]
          created_at: string
          description: string
          id: string
          page_url: string | null
          priority: Database["public"]["Enums"]["feedback_priority"]
          status: Database["public"]["Enums"]["feedback_status"]
          title: string
          updated_at: string
          user_email: string
        }
        Insert: {
          assigned_to?: string | null
          attachments?: string[] | null
          browser_info?: Json | null
          category?: Database["public"]["Enums"]["feedback_category"]
          created_at?: string
          description: string
          id?: string
          page_url?: string | null
          priority?: Database["public"]["Enums"]["feedback_priority"]
          status?: Database["public"]["Enums"]["feedback_status"]
          title: string
          updated_at?: string
          user_email: string
        }
        Update: {
          assigned_to?: string | null
          attachments?: string[] | null
          browser_info?: Json | null
          category?: Database["public"]["Enums"]["feedback_category"]
          created_at?: string
          description?: string
          id?: string
          page_url?: string | null
          priority?: Database["public"]["Enums"]["feedback_priority"]
          status?: Database["public"]["Enums"]["feedback_status"]
          title?: string
          updated_at?: string
          user_email?: string
        }
        Relationships: []
      }
      feedback_replies: {
        Row: {
          admin_email: string
          created_at: string
          feedback_id: string
          id: string
          is_internal_note: boolean
          message: string
        }
        Insert: {
          admin_email: string
          created_at?: string
          feedback_id: string
          id?: string
          is_internal_note?: boolean
          message: string
        }
        Update: {
          admin_email?: string
          created_at?: string
          feedback_id?: string
          id?: string
          is_internal_note?: boolean
          message?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_replies_feedback_id_fkey"
            columns: ["feedback_id"]
            isOneToOne: false
            referencedRelation: "feedback"
            referencedColumns: ["id"]
          },
        ]
      }
      gatekeeper_logs: {
        Row: {
          action_type: string
          created_at: string
          error_message: string | null
          id: string
          metadata: Json | null
          success: boolean
          telegram_user_id: number | null
          user_email: string
          whop_purchase_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          success?: boolean
          telegram_user_id?: number | null
          user_email: string
          whop_purchase_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          success?: boolean
          telegram_user_id?: number | null
          user_email?: string
          whop_purchase_id?: string | null
        }
        Relationships: []
      }
      highlight_comments: {
        Row: {
          comment_text: string
          created_at: string
          downvotes: number
          id: string
          is_deleted: boolean
          is_highlighted: boolean
          metadata: Json | null
          parent_comment_id: string | null
          topic_id: string
          updated_at: string
          upvotes: number
          user_display_name: string | null
          user_email: string
        }
        Insert: {
          comment_text: string
          created_at?: string
          downvotes?: number
          id?: string
          is_deleted?: boolean
          is_highlighted?: boolean
          metadata?: Json | null
          parent_comment_id?: string | null
          topic_id: string
          updated_at?: string
          upvotes?: number
          user_display_name?: string | null
          user_email: string
        }
        Update: {
          comment_text?: string
          created_at?: string
          downvotes?: number
          id?: string
          is_deleted?: boolean
          is_highlighted?: boolean
          metadata?: Json | null
          parent_comment_id?: string | null
          topic_id?: string
          updated_at?: string
          upvotes?: number
          user_display_name?: string | null
          user_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "highlight_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "highlight_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "highlight_comments_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "highlight_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      highlight_topics: {
        Row: {
          created_at: string
          engagement_score: number
          first_mentioned_at: string
          id: string
          is_trending: boolean
          keyword_group: string[]
          last_activity_at: string
          message_count: number
          topic_description: string | null
          topic_slug: string
          topic_title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          engagement_score?: number
          first_mentioned_at?: string
          id?: string
          is_trending?: boolean
          keyword_group?: string[]
          last_activity_at?: string
          message_count?: number
          topic_description?: string | null
          topic_slug: string
          topic_title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          engagement_score?: number
          first_mentioned_at?: string
          id?: string
          is_trending?: boolean
          keyword_group?: string[]
          last_activity_at?: string
          message_count?: number
          topic_description?: string | null
          topic_slug?: string
          topic_title?: string
          updated_at?: string
        }
        Relationships: []
      }
      message_audit_log: {
        Row: {
          action_type: string
          chat_id: number | null
          created_at: string
          id: string
          message_content: string | null
          metadata: Json | null
          telegram_message_id: number | null
          topic_name: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          chat_id?: number | null
          created_at?: string
          id?: string
          message_content?: string | null
          metadata?: Json | null
          telegram_message_id?: number | null
          topic_name?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          chat_id?: number | null
          created_at?: string
          id?: string
          message_content?: string | null
          metadata?: Json | null
          telegram_message_id?: number | null
          topic_name?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      newsletter_blacklist: {
        Row: {
          beehiiv_post_id: string
          blacklisted_at: string | null
          blacklisted_by: string | null
          created_at: string | null
          id: string
          reason: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          beehiiv_post_id: string
          blacklisted_at?: string | null
          blacklisted_by?: string | null
          created_at?: string | null
          id?: string
          reason?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          beehiiv_post_id?: string
          blacklisted_at?: string | null
          blacklisted_by?: string | null
          created_at?: string | null
          id?: string
          reason?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      newsletters: {
        Row: {
          analytics_data: Json | null
          author_id: string | null
          beehiiv_created_at: string | null
          beehiiv_post_id: string | null
          beehiiv_updated_at: string | null
          content: string | null
          created_at: string | null
          excerpt: string | null
          featured_image_url: string | null
          html_content: string | null
          id: string
          metadata: Json | null
          plain_content: string | null
          published_at: string | null
          read_time_minutes: number | null
          required_tier: Database["public"]["Enums"]["subscription_tier"] | null
          scheduled_at: string | null
          status: string
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          view_count: number | null
          web_url: string | null
        }
        Insert: {
          analytics_data?: Json | null
          author_id?: string | null
          beehiiv_created_at?: string | null
          beehiiv_post_id?: string | null
          beehiiv_updated_at?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          html_content?: string | null
          id?: string
          metadata?: Json | null
          plain_content?: string | null
          published_at?: string | null
          read_time_minutes?: number | null
          required_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          scheduled_at?: string | null
          status?: string
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          view_count?: number | null
          web_url?: string | null
        }
        Update: {
          analytics_data?: Json | null
          author_id?: string | null
          beehiiv_created_at?: string | null
          beehiiv_post_id?: string | null
          beehiiv_updated_at?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          html_content?: string | null
          id?: string
          metadata?: Json | null
          plain_content?: string | null
          published_at?: string | null
          read_time_minutes?: number | null
          required_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          scheduled_at?: string | null
          status?: string
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          view_count?: number | null
          web_url?: string | null
        }
        Relationships: []
      }
      notification_queue: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          max_retries: number | null
          message_content: string
          notification_type: string
          priority: number
          processed_at: string | null
          recipient_info: Json
          retry_count: number | null
          scheduled_for: string | null
          status: string
          subscriber_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          max_retries?: number | null
          message_content: string
          notification_type: string
          priority?: number
          processed_at?: string | null
          recipient_info?: Json
          retry_count?: number | null
          scheduled_for?: string | null
          status?: string
          subscriber_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          max_retries?: number | null
          message_content?: string
          notification_type?: string
          priority?: number
          processed_at?: string | null
          recipient_info?: Json
          retry_count?: number | null
          scheduled_for?: string | null
          status?: string
          subscriber_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_queue_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "beehiiv_subscribers"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_templates: {
        Row: {
          channel: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          is_default: boolean
          name: string
          template_content: string
          template_type: string
          updated_at: string
          variables: Json | null
        }
        Insert: {
          channel: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          name: string
          template_content: string
          template_type: string
          updated_at?: string
          variables?: Json | null
        }
        Update: {
          channel?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          template_content?: string
          template_type?: string
          updated_at?: string
          variables?: Json | null
        }
        Relationships: []
      }
      rate_limit_tracking: {
        Row: {
          attempts: number | null
          blocked_until: string | null
          created_at: string | null
          endpoint: string
          first_attempt_at: string | null
          id: string
          identifier: string
          last_attempt_at: string | null
          reset_at: string
          updated_at: string | null
        }
        Insert: {
          attempts?: number | null
          blocked_until?: string | null
          created_at?: string | null
          endpoint: string
          first_attempt_at?: string | null
          id?: string
          identifier: string
          last_attempt_at?: string | null
          reset_at: string
          updated_at?: string | null
        }
        Update: {
          attempts?: number | null
          blocked_until?: string | null
          created_at?: string | null
          endpoint?: string
          first_attempt_at?: string | null
          id?: string
          identifier?: string
          last_attempt_at?: string | null
          reset_at?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          can_admin: boolean | null
          can_delete: boolean | null
          can_read: boolean | null
          can_write: boolean | null
          created_at: string | null
          id: string
          permission_category: string
          permission_name: string
          role: string
          updated_at: string | null
        }
        Insert: {
          can_admin?: boolean | null
          can_delete?: boolean | null
          can_read?: boolean | null
          can_write?: boolean | null
          created_at?: string | null
          id?: string
          permission_category?: string
          permission_name: string
          role: string
          updated_at?: string | null
        }
        Update: {
          can_admin?: boolean | null
          can_delete?: boolean | null
          can_read?: boolean | null
          can_write?: boolean | null
          created_at?: string | null
          id?: string
          permission_category?: string
          permission_name?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      security_audit_trail: {
        Row: {
          action_details: Json | null
          actor_email: string | null
          actor_type: string | null
          correlation_id: string | null
          created_at: string | null
          event_category: string
          event_type: string
          geolocation: Json | null
          id: string
          investigation_status: string | null
          ip_address: unknown | null
          is_suspicious: boolean | null
          processed_at: string | null
          risk_score: number | null
          security_context: Json | null
          session_id: string | null
          severity_level: string | null
          target_id: string | null
          target_resource: string | null
          user_agent: string | null
        }
        Insert: {
          action_details?: Json | null
          actor_email?: string | null
          actor_type?: string | null
          correlation_id?: string | null
          created_at?: string | null
          event_category: string
          event_type: string
          geolocation?: Json | null
          id?: string
          investigation_status?: string | null
          ip_address?: unknown | null
          is_suspicious?: boolean | null
          processed_at?: string | null
          risk_score?: number | null
          security_context?: Json | null
          session_id?: string | null
          severity_level?: string | null
          target_id?: string | null
          target_resource?: string | null
          user_agent?: string | null
        }
        Update: {
          action_details?: Json | null
          actor_email?: string | null
          actor_type?: string | null
          correlation_id?: string | null
          created_at?: string | null
          event_category?: string
          event_type?: string
          geolocation?: Json | null
          id?: string
          investigation_status?: string | null
          ip_address?: unknown | null
          is_suspicious?: boolean | null
          processed_at?: string | null
          risk_score?: number | null
          security_context?: Json | null
          session_id?: string | null
          severity_level?: string | null
          target_id?: string | null
          target_resource?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      security_events: {
        Row: {
          correlation_id: string | null
          created_at: string | null
          device_fingerprint: string | null
          event_data: Json | null
          event_type: string
          geo_location: Json | null
          id: string
          ip_address: unknown | null
          notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          session_id: string | null
          severity: string
          user_agent: string | null
          user_email: string | null
        }
        Insert: {
          correlation_id?: string | null
          created_at?: string | null
          device_fingerprint?: string | null
          event_data?: Json | null
          event_type: string
          geo_location?: Json | null
          id?: string
          ip_address?: unknown | null
          notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          session_id?: string | null
          severity: string
          user_agent?: string | null
          user_email?: string | null
        }
        Update: {
          correlation_id?: string | null
          created_at?: string | null
          device_fingerprint?: string | null
          event_data?: Json | null
          event_type?: string
          geo_location?: Json | null
          id?: string
          ip_address?: unknown | null
          notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          session_id?: string | null
          severity?: string
          user_agent?: string | null
          user_email?: string | null
        }
        Relationships: []
      }
      sent_messages: {
        Row: {
          chat_id: number
          created_at: string
          error_message: string | null
          id: string
          message_text: string
          message_thread_id: number | null
          metadata: Json | null
          sender_email: string
          sender_name: string | null
          sender_user_id: string
          sent_at: string | null
          status: string
          telegram_message_id: number | null
          topic_name: string | null
        }
        Insert: {
          chat_id: number
          created_at?: string
          error_message?: string | null
          id?: string
          message_text: string
          message_thread_id?: number | null
          metadata?: Json | null
          sender_email: string
          sender_name?: string | null
          sender_user_id: string
          sent_at?: string | null
          status?: string
          telegram_message_id?: number | null
          topic_name?: string | null
        }
        Update: {
          chat_id?: number
          created_at?: string
          error_message?: string | null
          id?: string
          message_text?: string
          message_thread_id?: number | null
          metadata?: Json | null
          sender_email?: string
          sender_name?: string | null
          sender_user_id?: string
          sent_at?: string | null
          status?: string
          telegram_message_id?: number | null
          topic_name?: string | null
        }
        Relationships: []
      }
      sentiment_alerts: {
        Row: {
          alert_data: Json | null
          alert_type: string
          avg_sentiment: number
          created_at: string
          id: string
          is_resolved: boolean
          message_count: number
          resolved_at: string | null
          sentiment_threshold: number
          severity: string
          triggered_at: string
        }
        Insert: {
          alert_data?: Json | null
          alert_type: string
          avg_sentiment: number
          created_at?: string
          id?: string
          is_resolved?: boolean
          message_count?: number
          resolved_at?: string | null
          sentiment_threshold: number
          severity: string
          triggered_at?: string
        }
        Update: {
          alert_data?: Json | null
          alert_type?: string
          avg_sentiment?: number
          created_at?: string
          id?: string
          is_resolved?: boolean
          message_count?: number
          resolved_at?: string | null
          sentiment_threshold?: number
          severity?: string
          triggered_at?: string
        }
        Relationships: []
      }
      sentiment_trends: {
        Row: {
          avg_sentiment_score: number
          created_at: string
          dominant_topics: string[] | null
          id: string
          message_count: number
          metadata: Json | null
          negative_count: number
          neutral_count: number
          period_type: string
          positive_count: number
          time_period: string
          trending_keywords: string[] | null
          updated_at: string
        }
        Insert: {
          avg_sentiment_score: number
          created_at?: string
          dominant_topics?: string[] | null
          id?: string
          message_count?: number
          metadata?: Json | null
          negative_count?: number
          neutral_count?: number
          period_type: string
          positive_count?: number
          time_period: string
          trending_keywords?: string[] | null
          updated_at?: string
        }
        Update: {
          avg_sentiment_score?: number
          created_at?: string
          dominant_topics?: string[] | null
          id?: string
          message_count?: number
          metadata?: Json | null
          negative_count?: number
          neutral_count?: number
          period_type?: string
          positive_count?: number
          time_period?: string
          trending_keywords?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      subscription_tiers: {
        Row: {
          created_at: string | null
          description: string | null
          features: Json | null
          id: string
          name: string
          tier: Database["public"]["Enums"]["subscription_tier"]
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          name: string
          tier: Database["public"]["Enums"]["subscription_tier"]
        }
        Update: {
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          name?: string
          tier?: Database["public"]["Enums"]["subscription_tier"]
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          admin_id: number
          subscribed_to_id: number
          subscribed_to_username: string
          subscriber_id: number
        }
        Insert: {
          admin_id: number
          subscribed_to_id: number
          subscribed_to_username: string
          subscriber_id: number
        }
        Update: {
          admin_id?: number
          subscribed_to_id?: number
          subscribed_to_username?: string
          subscriber_id?: number
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key: string
          setting_value?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
        }
        Relationships: []
      }
      telegram_community_access: {
        Row: {
          access_granted_at: string | null
          access_revoked_at: string | null
          access_status: string
          created_at: string
          id: string
          telegram_user_id: number | null
          telegram_username: string | null
          updated_at: string
          user_email: string
          whop_purchase_id: string | null
        }
        Insert: {
          access_granted_at?: string | null
          access_revoked_at?: string | null
          access_status?: string
          created_at?: string
          id?: string
          telegram_user_id?: number | null
          telegram_username?: string | null
          updated_at?: string
          user_email: string
          whop_purchase_id?: string | null
        }
        Update: {
          access_granted_at?: string | null
          access_revoked_at?: string | null
          access_status?: string
          created_at?: string
          id?: string
          telegram_user_id?: number | null
          telegram_username?: string | null
          updated_at?: string
          user_email?: string
          whop_purchase_id?: string | null
        }
        Relationships: []
      }
      telegram_messages: {
        Row: {
          chat_id: number
          created_at: string | null
          first_name: string | null
          forwarded_from: string | null
          id: string
          is_hidden: boolean | null
          is_highlighted: boolean | null
          last_name: string | null
          likes_count: number | null
          media_type: string | null
          media_url: string | null
          message_text: string | null
          message_thread_id: number | null
          message_time: string | null
          message_type: string | null
          reply_to_message_id: number | null
          telegram_message_id: number
          timestamp: string | null
          topic_name: string | null
          updated_at: string | null
          user_id: number | null
          username: string | null
        }
        Insert: {
          chat_id: number
          created_at?: string | null
          first_name?: string | null
          forwarded_from?: string | null
          id?: string
          is_hidden?: boolean | null
          is_highlighted?: boolean | null
          last_name?: string | null
          likes_count?: number | null
          media_type?: string | null
          media_url?: string | null
          message_text?: string | null
          message_thread_id?: number | null
          message_time?: string | null
          message_type?: string | null
          reply_to_message_id?: number | null
          telegram_message_id: number
          timestamp?: string | null
          topic_name?: string | null
          updated_at?: string | null
          user_id?: number | null
          username?: string | null
        }
        Update: {
          chat_id?: number
          created_at?: string | null
          first_name?: string | null
          forwarded_from?: string | null
          id?: string
          is_hidden?: boolean | null
          is_highlighted?: boolean | null
          last_name?: string | null
          likes_count?: number | null
          media_type?: string | null
          media_url?: string | null
          message_text?: string | null
          message_thread_id?: number | null
          message_time?: string | null
          message_type?: string | null
          reply_to_message_id?: number | null
          telegram_message_id?: number
          timestamp?: string | null
          topic_name?: string | null
          updated_at?: string | null
          user_id?: number | null
          username?: string | null
        }
        Relationships: []
      }
      telegram_messages_backup: {
        Row: {
          admin_id: number | null
          id: number | null
          message_id: number | null
          message_text: string | null
          message_time: string | null
          telegram_topic_id: number | null
        }
        Insert: {
          admin_id?: number | null
          id?: number | null
          message_id?: number | null
          message_text?: string | null
          message_time?: string | null
          telegram_topic_id?: number | null
        }
        Update: {
          admin_id?: number | null
          id?: number | null
          message_id?: number | null
          message_text?: string | null
          message_time?: string | null
          telegram_topic_id?: number | null
        }
        Relationships: []
      }
      telegram_sentiment_analysis: {
        Row: {
          analysis_metadata: Json | null
          confidence_score: number
          created_at: string
          emotional_tone: string | null
          id: string
          keywords_detected: string[] | null
          sentiment_label: string
          sentiment_score: number
          telegram_message_id: string | null
          topic_categories: string[] | null
          updated_at: string
        }
        Insert: {
          analysis_metadata?: Json | null
          confidence_score: number
          created_at?: string
          emotional_tone?: string | null
          id?: string
          keywords_detected?: string[] | null
          sentiment_label: string
          sentiment_score: number
          telegram_message_id?: string | null
          topic_categories?: string[] | null
          updated_at?: string
        }
        Update: {
          analysis_metadata?: Json | null
          confidence_score?: number
          created_at?: string
          emotional_tone?: string | null
          id?: string
          keywords_detected?: string[] | null
          sentiment_label?: string
          sentiment_score?: number
          telegram_message_id?: string | null
          topic_categories?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      telegram_sync_status: {
        Row: {
          cancellation_requested: boolean | null
          created_at: string
          errors_count: number | null
          id: string
          job_id: string | null
          last_sync_at: string
          messages_deleted: number | null
          messages_processed: number | null
          messages_synced: number | null
          metadata: Json | null
          process_id: string | null
          started_at: string | null
          status: string
          sync_type: string
          updated_at: string | null
        }
        Insert: {
          cancellation_requested?: boolean | null
          created_at?: string
          errors_count?: number | null
          id?: string
          job_id?: string | null
          last_sync_at?: string
          messages_deleted?: number | null
          messages_processed?: number | null
          messages_synced?: number | null
          metadata?: Json | null
          process_id?: string | null
          started_at?: string | null
          status?: string
          sync_type: string
          updated_at?: string | null
        }
        Update: {
          cancellation_requested?: boolean | null
          created_at?: string
          errors_count?: number | null
          id?: string
          job_id?: string | null
          last_sync_at?: string
          messages_deleted?: number | null
          messages_processed?: number | null
          messages_synced?: number | null
          metadata?: Json | null
          process_id?: string | null
          started_at?: string | null
          status?: string
          sync_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      telegram_topic_discovery: {
        Row: {
          confidence_score: number | null
          created_at: string
          discovered_name: string | null
          discovery_method: string
          id: string
          message_samples: Json | null
          telegram_topic_id: number
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          discovered_name?: string | null
          discovery_method: string
          id?: string
          message_samples?: Json | null
          telegram_topic_id: number
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          discovered_name?: string | null
          discovery_method?: string
          id?: string
          message_samples?: Json | null
          telegram_topic_id?: number
        }
        Relationships: []
      }
      telegram_topic_mappings: {
        Row: {
          created_at: string | null
          custom_name: string | null
          display_name: string | null
          id: number
          is_active: boolean | null
          last_active: string | null
          telegram_topic_id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          custom_name?: string | null
          display_name?: string | null
          id?: never
          is_active?: boolean | null
          last_active?: string | null
          telegram_topic_id: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          custom_name?: string | null
          display_name?: string | null
          id?: never
          is_active?: boolean | null
          last_active?: string | null
          telegram_topic_id?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      telegram_topics: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          last_activity_at: string | null
          message_count: number | null
          name: string
          telegram_topic_id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          last_activity_at?: string | null
          message_count?: number | null
          name: string
          telegram_topic_id: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          last_activity_at?: string | null
          message_count?: number | null
          name?: string
          telegram_topic_id?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      telegram_user_mapping: {
        Row: {
          created_at: string
          dashboard_email: string
          dashboard_user_id: string
          id: string
          telegram_first_name: string | null
          telegram_last_name: string | null
          telegram_user_id: number | null
          telegram_username: string | null
          updated_at: string
          verification_expires_at: string | null
          verification_token: string | null
          verified: boolean
        }
        Insert: {
          created_at?: string
          dashboard_email: string
          dashboard_user_id: string
          id?: string
          telegram_first_name?: string | null
          telegram_last_name?: string | null
          telegram_user_id?: number | null
          telegram_username?: string | null
          updated_at?: string
          verification_expires_at?: string | null
          verification_token?: string | null
          verified?: boolean
        }
        Update: {
          created_at?: string
          dashboard_email?: string
          dashboard_user_id?: string
          id?: string
          telegram_first_name?: string | null
          telegram_last_name?: string | null
          telegram_user_id?: number | null
          telegram_username?: string | null
          updated_at?: string
          verification_expires_at?: string | null
          verification_token?: string | null
          verified?: boolean
        }
        Relationships: []
      }
      telegram_user_settings: {
        Row: {
          created_at: string
          id: string
          is_verified: boolean | null
          notification_preferences: Json | null
          telegram_user_id: number | null
          telegram_username: string | null
          updated_at: string
          user_email: string
          verification_code: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_verified?: boolean | null
          notification_preferences?: Json | null
          telegram_user_id?: number | null
          telegram_username?: string | null
          updated_at?: string
          user_email: string
          verification_code?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_verified?: boolean | null
          notification_preferences?: Json | null
          telegram_user_id?: number | null
          telegram_username?: string | null
          updated_at?: string
          user_email?: string
          verification_code?: string | null
        }
        Relationships: []
      }
      topic_follows: {
        Row: {
          created_at: string
          id: string
          topic_id: string
          user_email: string
        }
        Insert: {
          created_at?: string
          id?: string
          topic_id: string
          user_email: string
        }
        Update: {
          created_at?: string
          id?: string
          topic_id?: string
          user_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "topic_follows_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "highlight_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      trading_alerts: {
        Row: {
          created_at: string
          current_price: number | null
          entry_price: number
          expiry_date: string
          id: string
          metadata: Json | null
          option_type: string
          profit_loss: number | null
          profit_percentage: number | null
          status: string
          strike_price: number
          symbol: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          current_price?: number | null
          entry_price: number
          expiry_date: string
          id?: string
          metadata?: Json | null
          option_type: string
          profit_loss?: number | null
          profit_percentage?: number | null
          status?: string
          strike_price: number
          symbol: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          current_price?: number | null
          entry_price?: number
          expiry_date?: string
          id?: string
          metadata?: Json | null
          option_type?: string
          profit_loss?: number | null
          profit_percentage?: number | null
          status?: string
          strike_price?: number
          symbol?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      unified_user_identities: {
        Row: {
          admin_role: string | null
          admin_user_id: string | null
          auth_user_id: string | null
          beehiiv_subscriber_id: string | null
          beehiiv_subscription_tier:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          created_at: string | null
          effective_role: string | null
          effective_tier:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          email: string
          id: string
          is_beehiiv_subscriber: boolean | null
          is_local_admin: boolean | null
          primary_source: string
          updated_at: string | null
        }
        Insert: {
          admin_role?: string | null
          admin_user_id?: string | null
          auth_user_id?: string | null
          beehiiv_subscriber_id?: string | null
          beehiiv_subscription_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          created_at?: string | null
          effective_role?: string | null
          effective_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          email: string
          id?: string
          is_beehiiv_subscriber?: boolean | null
          is_local_admin?: boolean | null
          primary_source?: string
          updated_at?: string | null
        }
        Update: {
          admin_role?: string | null
          admin_user_id?: string | null
          auth_user_id?: string | null
          beehiiv_subscriber_id?: string | null
          beehiiv_subscription_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          created_at?: string | null
          effective_role?: string | null
          effective_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          email?: string
          id?: string
          is_beehiiv_subscriber?: boolean | null
          is_local_admin?: boolean | null
          primary_source?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_beehiiv_links: {
        Row: {
          beehiiv_subscriber_id: string | null
          created_at: string | null
          email: string
          id: string
          linked_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          beehiiv_subscriber_id?: string | null
          created_at?: string | null
          email: string
          id?: string
          linked_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          beehiiv_subscriber_id?: string | null
          created_at?: string | null
          email?: string
          id?: string
          linked_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string
          id: string
          preference_data: Json
          preference_type: string
          updated_at: string
          user_email: string
        }
        Insert: {
          created_at?: string
          id?: string
          preference_data?: Json
          preference_type: string
          updated_at?: string
          user_email: string
        }
        Update: {
          created_at?: string
          id?: string
          preference_data?: Json
          preference_type?: string
          updated_at?: string
          user_email?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          linkedin_profile: string | null
          location: string | null
          tour_disabled: boolean
          twitter_handle: string | null
          updated_at: string
          user_email: string | null
          user_id: string | null
          website_url: string | null
          whop_email: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          linkedin_profile?: string | null
          location?: string | null
          tour_disabled?: boolean
          twitter_handle?: string | null
          updated_at?: string
          user_email?: string | null
          user_id?: string | null
          website_url?: string | null
          whop_email?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          linkedin_profile?: string | null
          location?: string | null
          tour_disabled?: boolean
          twitter_handle?: string | null
          updated_at?: string
          user_email?: string | null
          user_id?: string | null
          website_url?: string | null
          whop_email?: string | null
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          session_token: string
          source: string
          tier: string
          unified_identity_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          session_token: string
          source?: string
          tier?: string
          unified_identity_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          session_token?: string
          source?: string
          tier?: string
          unified_identity_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_unified_identity_id_fkey"
            columns: ["unified_identity_id"]
            isOneToOne: false
            referencedRelation: "unified_user_identities"
            referencedColumns: ["id"]
          },
        ]
      }
      user_trading_profiles: {
        Row: {
          biggest_hurdle: string | null
          created_at: string | null
          crypto_allocation: number | null
          id: string
          learning_motivation: string | null
          market_experience_category: string | null
          max_loss_per_trade: number | null
          max_position_size: number | null
          notifications: Json | null
          portfolio_size_range: string | null
          preferred_markets: string[] | null
          primary_trading_goal: string | null
          risk_management_style: string | null
          risk_tolerance: string | null
          time_learning_trading: string | null
          timezone: string | null
          trading_confidence: number | null
          trading_experience: string | null
          trading_frequency: string | null
          trading_style: string | null
          updated_at: string | null
          user_email: string
          work_status: string | null
        }
        Insert: {
          biggest_hurdle?: string | null
          created_at?: string | null
          crypto_allocation?: number | null
          id?: string
          learning_motivation?: string | null
          market_experience_category?: string | null
          max_loss_per_trade?: number | null
          max_position_size?: number | null
          notifications?: Json | null
          portfolio_size_range?: string | null
          preferred_markets?: string[] | null
          primary_trading_goal?: string | null
          risk_management_style?: string | null
          risk_tolerance?: string | null
          time_learning_trading?: string | null
          timezone?: string | null
          trading_confidence?: number | null
          trading_experience?: string | null
          trading_frequency?: string | null
          trading_style?: string | null
          updated_at?: string | null
          user_email: string
          work_status?: string | null
        }
        Update: {
          biggest_hurdle?: string | null
          created_at?: string | null
          crypto_allocation?: number | null
          id?: string
          learning_motivation?: string | null
          market_experience_category?: string | null
          max_loss_per_trade?: number | null
          max_position_size?: number | null
          notifications?: Json | null
          portfolio_size_range?: string | null
          preferred_markets?: string[] | null
          primary_trading_goal?: string | null
          risk_management_style?: string | null
          risk_tolerance?: string | null
          time_learning_trading?: string | null
          timezone?: string | null
          trading_confidence?: number | null
          trading_experience?: string | null
          trading_frequency?: string | null
          trading_style?: string | null
          updated_at?: string | null
          user_email?: string
          work_status?: string | null
        }
        Relationships: []
      }
      video_tutorials: {
        Row: {
          created_at: string | null
          description: string | null
          difficulty_level: string | null
          duration_seconds: number | null
          id: string
          likes_count: number | null
          metadata: Json | null
          required_tier: Database["public"]["Enums"]["subscription_tier"] | null
          status: string
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          video_url: string | null
          view_count: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          difficulty_level?: string | null
          duration_seconds?: number | null
          id?: string
          likes_count?: number | null
          metadata?: Json | null
          required_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          status?: string
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          video_url?: string | null
          view_count?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          difficulty_level?: string | null
          duration_seconds?: number | null
          id?: string
          likes_count?: number | null
          metadata?: Json | null
          required_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          status?: string
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          video_url?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      whop_authenticated_users: {
        Row: {
          access_expires_at: string | null
          access_granted_at: string
          created_at: string
          id: string
          last_verified_at: string
          metadata: Json | null
          subscription_tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string
          user_email: string
          whop_purchase_id: string
          whop_user_id: string
        }
        Insert: {
          access_expires_at?: string | null
          access_granted_at?: string
          created_at?: string
          id?: string
          last_verified_at?: string
          metadata?: Json | null
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_email: string
          whop_purchase_id: string
          whop_user_id: string
        }
        Update: {
          access_expires_at?: string | null
          access_granted_at?: string
          created_at?: string
          id?: string
          last_verified_at?: string
          metadata?: Json | null
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_email?: string
          whop_purchase_id?: string
          whop_user_id?: string
        }
        Relationships: []
      }
      whop_products: {
        Row: {
          created_at: string
          currency: string
          description: string | null
          id: string
          is_active: boolean
          metadata: Json | null
          price_cents: number
          title: string
          updated_at: string
          whop_product_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json | null
          price_cents?: number
          title: string
          updated_at?: string
          whop_product_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json | null
          price_cents?: number
          title?: string
          updated_at?: string
          whop_product_id?: string
        }
        Relationships: []
      }
      whop_purchases: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          customer_email: string
          customer_name: string | null
          id: string
          metadata: Json | null
          purchase_date: string
          status: string
          updated_at: string
          whop_product_id: string
          whop_purchase_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency?: string
          customer_email: string
          customer_name?: string | null
          id?: string
          metadata?: Json | null
          purchase_date: string
          status?: string
          updated_at?: string
          whop_product_id: string
          whop_purchase_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          customer_email?: string
          customer_name?: string | null
          id?: string
          metadata?: Json | null
          purchase_date?: string
          status?: string
          updated_at?: string
          whop_product_id?: string
          whop_purchase_id?: string
        }
        Relationships: []
      }
      x_account_monitoring: {
        Row: {
          account_handle: string
          account_url: string | null
          auto_categorize: boolean | null
          content_type: string
          created_at: string
          created_by: string | null
          engagement_alerts_enabled: boolean | null
          engagement_threshold: number | null
          error_count: number
          exclude_retweets: boolean | null
          hashtag_filters: string[] | null
          id: string
          include_media: boolean | null
          is_active: boolean
          keyword_filters: string[] | null
          language_filter: string | null
          last_error_message: string | null
          last_post_id: string | null
          last_sync_at: string | null
          max_posts_per_sync: number | null
          monitor_frequency_minutes: number
          priority_keywords: string[] | null
          sentiment_alerts_enabled: boolean | null
          sentiment_history_days: number | null
          sentiment_threshold: number | null
          updated_at: string
          user_mentions_filter: string[] | null
          verified_only: boolean | null
        }
        Insert: {
          account_handle: string
          account_url?: string | null
          auto_categorize?: boolean | null
          content_type?: string
          created_at?: string
          created_by?: string | null
          engagement_alerts_enabled?: boolean | null
          engagement_threshold?: number | null
          error_count?: number
          exclude_retweets?: boolean | null
          hashtag_filters?: string[] | null
          id?: string
          include_media?: boolean | null
          is_active?: boolean
          keyword_filters?: string[] | null
          language_filter?: string | null
          last_error_message?: string | null
          last_post_id?: string | null
          last_sync_at?: string | null
          max_posts_per_sync?: number | null
          monitor_frequency_minutes?: number
          priority_keywords?: string[] | null
          sentiment_alerts_enabled?: boolean | null
          sentiment_history_days?: number | null
          sentiment_threshold?: number | null
          updated_at?: string
          user_mentions_filter?: string[] | null
          verified_only?: boolean | null
        }
        Update: {
          account_handle?: string
          account_url?: string | null
          auto_categorize?: boolean | null
          content_type?: string
          created_at?: string
          created_by?: string | null
          engagement_alerts_enabled?: boolean | null
          engagement_threshold?: number | null
          error_count?: number
          exclude_retweets?: boolean | null
          hashtag_filters?: string[] | null
          id?: string
          include_media?: boolean | null
          is_active?: boolean
          keyword_filters?: string[] | null
          language_filter?: string | null
          last_error_message?: string | null
          last_post_id?: string | null
          last_sync_at?: string | null
          max_posts_per_sync?: number | null
          monitor_frequency_minutes?: number
          priority_keywords?: string[] | null
          sentiment_alerts_enabled?: boolean | null
          sentiment_history_days?: number | null
          sentiment_threshold?: number | null
          updated_at?: string
          user_mentions_filter?: string[] | null
          verified_only?: boolean | null
        }
        Relationships: []
      }
      x_posts: {
        Row: {
          account_handle: string
          account_id: string | null
          author_name: string | null
          author_username: string | null
          collected_at: string
          created_at: string
          id: string
          is_reply: boolean | null
          is_retweet: boolean | null
          like_count: number | null
          post_metadata: Json | null
          post_text: string | null
          post_url: string | null
          posted_at: string | null
          quote_count: number | null
          reply_count: number | null
          reply_to_post_id: string | null
          retweet_count: number | null
          x_post_id: string
        }
        Insert: {
          account_handle: string
          account_id?: string | null
          author_name?: string | null
          author_username?: string | null
          collected_at?: string
          created_at?: string
          id?: string
          is_reply?: boolean | null
          is_retweet?: boolean | null
          like_count?: number | null
          post_metadata?: Json | null
          post_text?: string | null
          post_url?: string | null
          posted_at?: string | null
          quote_count?: number | null
          reply_count?: number | null
          reply_to_post_id?: string | null
          retweet_count?: number | null
          x_post_id: string
        }
        Update: {
          account_handle?: string
          account_id?: string | null
          author_name?: string | null
          author_username?: string | null
          collected_at?: string
          created_at?: string
          id?: string
          is_reply?: boolean | null
          is_retweet?: boolean | null
          like_count?: number | null
          post_metadata?: Json | null
          post_text?: string | null
          post_url?: string | null
          posted_at?: string | null
          quote_count?: number | null
          reply_count?: number | null
          reply_to_post_id?: string | null
          retweet_count?: number | null
          x_post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "x_posts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "x_account_monitoring"
            referencedColumns: ["id"]
          },
        ]
      }
      x_sentiment_analysis: {
        Row: {
          analysis_metadata: Json | null
          confidence_score: number
          created_at: string
          emotional_tone: string | null
          id: string
          keywords_detected: string[] | null
          sentiment_label: string
          sentiment_score: number
          topic_categories: string[] | null
          updated_at: string
          x_post_id: string | null
        }
        Insert: {
          analysis_metadata?: Json | null
          confidence_score: number
          created_at?: string
          emotional_tone?: string | null
          id?: string
          keywords_detected?: string[] | null
          sentiment_label: string
          sentiment_score: number
          topic_categories?: string[] | null
          updated_at?: string
          x_post_id?: string | null
        }
        Update: {
          analysis_metadata?: Json | null
          confidence_score?: number
          created_at?: string
          emotional_tone?: string | null
          id?: string
          keywords_detected?: string[] | null
          sentiment_label?: string
          sentiment_score?: number
          topic_categories?: string[] | null
          updated_at?: string
          x_post_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "x_sentiment_analysis_x_post_id_fkey"
            columns: ["x_post_id"]
            isOneToOne: false
            referencedRelation: "x_posts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_has_2fa_enabled: {
        Args: { p_admin_email: string }
        Returns: boolean
      }
      aggregate_sentiment_trends: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      assign_progressive_newsletter_dates: {
        Args: Record<PropertyKey, never>
        Returns: {
          updated_count: number
          message: string
        }[]
      }
      blacklist_newsletter: {
        Args: { p_beehiiv_post_id: string; p_title?: string; p_reason?: string }
        Returns: undefined
      }
      calculate_detection_confidence: {
        Args: { message_text: string; extracted_data: Json }
        Returns: number
      }
      can_manage_admin_role: {
        Args: { target_role: string }
        Returns: boolean
      }
      check_admin_with_2fa_session: {
        Args: { p_session_token?: string }
        Returns: boolean
      }
      check_data_access_quota: {
        Args: { admin_email_param: string; resource_type_param: string }
        Returns: boolean
      }
      check_rate_limit: {
        Args: {
          p_identifier: string
          p_endpoint: string
          p_max_attempts?: number
          p_window_minutes?: number
        }
        Returns: Json
      }
      classify_newsletter_content_type: {
        Args: {
          p_title?: string
          p_excerpt?: string
          p_html_content?: string
          p_plain_content?: string
        }
        Returns: string
      }
      cleanup_all_expired_sessions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_auth_rate_limits: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_expired_admin_sessions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_expired_reset_tokens: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_expired_secure_sessions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_expired_sessions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_hanging_sync_jobs: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_old_security_events: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_user_sessions_for_email: {
        Args: { p_email: string }
        Returns: Json
      }
      clear_admin_tier_override: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      comprehensive_sanitize_input: {
        Args: { input_value: string; input_type?: string }
        Returns: string
      }
      conduct_access_review: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      create_2fa_session: {
        Args: {
          p_admin_email: string
          p_expires_minutes?: number
          p_ip_address?: string
          p_user_agent?: string
          p_device_fingerprint?: string
        }
        Returns: string
      }
      create_supabase_session_for_enhanced_user: {
        Args: { p_email: string; p_session_token: string }
        Returns: Json
      }
      create_topic_from_keywords: {
        Args: { keywords: string[]; first_message_time?: string }
        Returns: string
      }
      create_unified_session: {
        Args: {
          p_email: string
          p_session_token: string
          p_tier?: Database["public"]["Enums"]["subscription_tier"]
          p_source?: string
          p_expires_at?: string
        }
        Returns: Json
      }
      debug_current_auth_state: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      debug_current_user: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      debug_user_auth_status: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      decrypt_sensitive_data: {
        Args: { p_encrypted_data: string; p_key_id?: string }
        Returns: string
      }
      encrypt_sensitive_data: {
        Args:
          | { data_to_encrypt: string; key_id?: string }
          | {
              p_user_id: string
              p_data_type: string
              p_raw_value: string
              p_classification?: Database["public"]["Enums"]["data_classification"]
            }
        Returns: string
      }
      extract_analyst_call_data: {
        Args: { message_text: string; pattern_config: Json }
        Returns: Json
      }
      find_duplicate_messages: {
        Args: Record<PropertyKey, never>
        Returns: {
          duplicate_id: string
          telegram_message_id: number
          count: number
        }[]
      }
      force_refresh_user_tier: {
        Args: { user_email: string }
        Returns: Json
      }
      force_stop_all_sync_jobs: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      format_degen_call_message: {
        Args: {
          signal_row: Database["public"]["Tables"]["analyst_signals"]["Row"]
        }
        Returns: string
      }
      generate_signal_format: {
        Args: {
          signal_row: Database["public"]["Tables"]["analyst_signals"]["Row"]
        }
        Returns: string
      }
      generate_topic_slug: {
        Args: { title: string }
        Returns: string
      }
      get_admin_session_info: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_beehiiv_subscriber_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_email: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_email_optimized: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_tier: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["subscription_tier"]
      }
      get_current_user_tier_optimized: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["subscription_tier"]
      }
      get_effective_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_effective_user_tier: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["subscription_tier"]
      }
      get_jwt_email: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_or_create_unified_identity: {
        Args: { p_email: string; p_auth_user_id?: string }
        Returns: string
      }
      get_security_dashboard: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_admin_role: {
        Args: { required_role?: string }
        Returns: boolean
      }
      has_permission: {
        Args: { _user_id: string; _permission_name: string; _action: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      hash_password: {
        Args: { password: string }
        Returns: string
      }
      increment_newsletter_views: {
        Args: { newsletter_id: string }
        Returns: undefined
      }
      insert_telegram_message: {
        Args: {
          p_telegram_message_id: number
          p_chat_id: number
          p_user_id?: number
          p_username?: string
          p_first_name?: string
          p_last_name?: string
          p_message_text?: string
          p_message_type?: string
          p_message_thread_id?: number
          p_reply_to_message_id?: number
          p_forwarded_from?: string
          p_media_url?: string
          p_media_type?: string
          p_timestamp?: string
          p_topic_name?: string
        }
        Returns: string
      }
      is_account_locked: {
        Args: { p_email: string }
        Returns: boolean
      }
      is_business_hours: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_current_user_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_current_user_admin_fast: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_device_authorized: {
        Args: { device_fingerprint: string; admin_email: string }
        Returns: boolean
      }
      is_feedback_submission_allowed: {
        Args: { p_user_email: string }
        Returns: boolean
      }
      is_ip_allowed: {
        Args:
          | { ip_address: unknown; admin_email: string }
          | { p_admin_email: string; p_ip_address: unknown }
        Returns: boolean
      }
      log_admin_security_event: {
        Args:
          | { event_type: string; event_details?: Json; admin_email?: string }
          | {
              p_admin_email: string
              p_event_type: string
              p_event_details?: Json
              p_ip_address?: string
              p_user_agent?: string
              p_device_fingerprint?: string
              p_success?: boolean
            }
        Returns: undefined
      }
      log_auth_event: {
        Args: {
          p_user_email: string
          p_auth_method: string
          p_action_type: string
          p_ip_address?: string
          p_user_agent?: string
          p_metadata?: Json
        }
        Returns: undefined
      }
      log_comprehensive_security_event: {
        Args:
          | {
              p_category: string
              p_event_type: string
              p_severity: string
              p_actor_email: string
              p_target_resource: string
              p_target_id: string
              p_action_details: Json
              p_risk_score: number
            }
          | {
              p_event_category: string
              p_event_type: string
              p_actor_email?: string
              p_target_resource?: string
              p_action_details?: Json
              p_ip_address?: unknown
              p_user_agent?: string
              p_session_id?: string
              p_severity_level?: string
            }
          | {
              p_event_type: string
              p_actor_email?: string
              p_actor_type?: string
              p_target_resource?: string
              p_target_id?: string
              p_action_details?: Json
              p_ip_address?: unknown
              p_user_agent?: string
              p_geolocation?: Json
              p_session_id?: string
              p_severity_level?: string
              p_is_suspicious?: boolean
              p_risk_score?: number
            }
          | {
              p_event_type: string
              p_severity: string
              p_user_email?: string
              p_ip_address?: unknown
              p_user_agent?: string
              p_device_fingerprint?: string
              p_event_data?: Json
              p_geo_location?: Json
              p_session_id?: string
              p_correlation_id?: string
              p_risk_score?: number
            }
          | { p_event_type: string; p_severity?: string; p_details?: Json }
        Returns: undefined
      }
      log_data_access: {
        Args:
          | {
              admin_email: string
              action_type: string
              resource_type: string
              resource_id?: string
              access_granted?: boolean
            }
          | {
              p_user_id?: string
              p_admin_email?: string
              p_resource_type?: string
              p_resource_id?: string
              p_action_type?: string
              p_ip_address?: unknown
              p_user_agent?: string
              p_geo_location?: Json
              p_device_fingerprint?: string
              p_access_granted?: boolean
              p_denial_reason?: string
              p_risk_score?: number
            }
        Returns: string
      }
      log_security_event: {
        Args:
          | {
              p_event_type: string
              p_actor_email?: string
              p_target_resource?: string
              p_action_details?: Json
              p_ip_address?: unknown
              p_user_agent?: string
              p_risk_score?: number
            }
          | {
              p_event_type: string
              p_admin_email: string
              p_success: boolean
              p_details: Json
            }
          | {
              p_event_type: string
              p_admin_email: string
              p_success?: boolean
              p_device_fingerprint?: string
              p_ip_address?: string
              p_user_agent?: string
              p_event_details?: Json
            }
          | {
              p_event_type: string
              p_severity: string
              p_user_email?: string
              p_ip_address?: unknown
              p_user_agent?: string
              p_device_fingerprint?: string
              p_event_data?: Json
              p_geo_location?: Json
              p_session_id?: string
              p_correlation_id?: string
            }
          | {
              p_event_type: string
              p_user_email?: string
              p_ip_address?: string
              p_user_agent?: string
              p_success?: boolean
              p_metadata?: Json
            }
        Returns: undefined
      }
      monitor_security_anomalies: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      request_sync_cancellation: {
        Args: { p_job_id: string }
        Returns: Json
      }
      require_2fa_for_sensitive_operation: {
        Args: { p_operation_type: string; p_session_token?: string }
        Returns: boolean
      }
      require_admin_with_2fa: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      require_secure_data_access: {
        Args:
          | { p_operation_type: string; p_resource_id?: string }
          | {
              p_operation_type: string
              p_resource_type?: string
              p_ip_address?: unknown
              p_device_fingerprint?: string
            }
        Returns: boolean
      }
      revoke_suspicious_sessions: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      sanitize_user_input: {
        Args: { input_text: string }
        Returns: string
      }
      set_admin_tier_override: {
        Args: {
          override_tier: Database["public"]["Enums"]["subscription_tier"]
        }
        Returns: undefined
      }
      setup_beehiiv_twice_daily_sync: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      sync_subscribers_from_sources: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      sync_unified_identity: {
        Args: { p_email: string }
        Returns: undefined
      }
      sync_whop_admin_status: {
        Args: { p_email: string; p_role?: string }
        Returns: Json
      }
      update_topic_activity: {
        Args:
          | {
              p_topic_id: number
              p_topic_name: string
              p_last_activity?: string
            }
          | { topic_id: number }
        Returns: undefined
      }
      user_has_paid_tier: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      user_has_premium_tier: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      validate_admin_role_creation: {
        Args: { p_email: string; p_role: string }
        Returns: Json
      }
      validate_email_secure: {
        Args: { email_input: string }
        Returns: boolean
      }
      validate_password_strength: {
        Args: { password: string }
        Returns: boolean
      }
      validate_session_token: {
        Args: { token_input: string }
        Returns: Json
      }
      verify_2fa_session: {
        Args: { p_session_token: string }
        Returns: Json
      }
      verify_2fa_token: {
        Args: { p_admin_email: string; p_token: string }
        Returns: boolean
      }
      verify_password: {
        Args: { email: string; password: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "user" | "analyst" | "admin" | "super_admin"
      data_classification:
        | "public"
        | "internal"
        | "confidential"
        | "restricted"
        | "secret"
      entry_type: "limit" | "market" | "trigger" | "conditional"
      feedback_category: "bug" | "feature_request" | "feedback" | "support"
      feedback_priority: "low" | "medium" | "high" | "critical"
      feedback_status: "pending" | "in_progress" | "completed" | "closed"
      market_type: "crypto" | "stocks" | "commodities" | "forex"
      risk_management_type: "stop_loss" | "conditional"
      subscription_tier: "free" | "paid" | "premium"
      trade_direction:
        | "buy"
        | "long"
        | "short"
        | "call"
        | "put"
        | "bull"
        | "bear"
      trade_type: "spot" | "futures" | "options"
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
      app_role: ["user", "analyst", "admin", "super_admin"],
      data_classification: [
        "public",
        "internal",
        "confidential",
        "restricted",
        "secret",
      ],
      entry_type: ["limit", "market", "trigger", "conditional"],
      feedback_category: ["bug", "feature_request", "feedback", "support"],
      feedback_priority: ["low", "medium", "high", "critical"],
      feedback_status: ["pending", "in_progress", "completed", "closed"],
      market_type: ["crypto", "stocks", "commodities", "forex"],
      risk_management_type: ["stop_loss", "conditional"],
      subscription_tier: ["free", "paid", "premium"],
      trade_direction: ["buy", "long", "short", "call", "put", "bull", "bear"],
      trade_type: ["spot", "futures", "options"],
    },
  },
} as const
