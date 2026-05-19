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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_logs: {
        Row: {
          action_type: string
          admin_id: string | null
          created_at: string
          description: string | null
          id: string
          new_value: Json | null
          old_value: Json | null
          target_id: string | null
          target_table: string | null
        }
        Insert: {
          action_type: string
          admin_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          target_id?: string | null
          target_table?: string | null
        }
        Update: {
          action_type?: string
          admin_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          target_id?: string | null
          target_table?: string | null
        }
        Relationships: []
      }
      budgets: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string
          id: string
          month: number
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          amount?: number
          category_id?: string | null
          created_at?: string
          id?: string
          month: number
          updated_at?: string
          user_id: string
          year: number
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string
          id?: string
          month?: number
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          organization_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          organization_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          organization_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_payments: {
        Row: {
          amount: number
          created_at: string
          credit_id: string
          description: string | null
          id: string
          payment_date: string
        }
        Insert: {
          amount: number
          created_at?: string
          credit_id: string
          description?: string | null
          id?: string
          payment_date?: string
        }
        Update: {
          amount?: number
          created_at?: string
          credit_id?: string
          description?: string | null
          id?: string
          payment_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_payments_credit_id_fkey"
            columns: ["credit_id"]
            isOneToOne: false
            referencedRelation: "credits"
            referencedColumns: ["id"]
          },
        ]
      }
      credits: {
        Row: {
          created_at: string
          description: string | null
          email: string | null
          id: string
          name: string
          person: string
          phone: string | null
          remaining_amount: number
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          name: string
          person: string
          phone?: string | null
          remaining_amount?: number
          total_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          name?: string
          person?: string
          phone?: string | null
          remaining_amount?: number
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      dhukuti_cash_records: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          nepali_date: string
          person_id: string
          record_date: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          nepali_date: string
          person_id: string
          record_date?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          nepali_date?: string
          person_id?: string
          record_date?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dhukuti_cash_records_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "dhukuti_people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dhukuti_cash_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "dhukuti_users"
            referencedColumns: ["id"]
          },
        ]
      }
      dhukuti_cycles: {
        Row: {
          created_at: string | null
          cycle_number: number
          end_date: string | null
          id: string
          is_active: boolean | null
          start_date: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          cycle_number: number
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          start_date?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          cycle_number?: number
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          start_date?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dhukuti_cycles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "dhukuti_users"
            referencedColumns: ["id"]
          },
        ]
      }
      dhukuti_kosh_balance: {
        Row: {
          balance: number
          created_at: string | null
          id: string
          last_updated: string | null
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string | null
          id?: string
          last_updated?: string | null
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string | null
          id?: string
          last_updated?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dhukuti_kosh_balance_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "dhukuti_users"
            referencedColumns: ["id"]
          },
        ]
      }
      dhukuti_locations: {
        Row: {
          created_at: string | null
          id: string
          is_current: boolean | null
          latitude: number | null
          longitude: number | null
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_current?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_current?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dhukuti_locations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "dhukuti_users"
            referencedColumns: ["id"]
          },
        ]
      }
      dhukuti_people: {
        Row: {
          address: string | null
          available_amount: number
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          spent_amount: number
          total_cash: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          available_amount?: number
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          spent_amount?: number
          total_cash?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          available_amount?: number
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          spent_amount?: number
          total_cash?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dhukuti_people_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "dhukuti_users"
            referencedColumns: ["id"]
          },
        ]
      }
      dhukuti_spent_records: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          nepali_date: string
          person_id: string
          record_date: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          nepali_date: string
          person_id: string
          record_date?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          nepali_date?: string
          person_id?: string
          record_date?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dhukuti_spent_records_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "dhukuti_people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dhukuti_spent_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "dhukuti_users"
            referencedColumns: ["id"]
          },
        ]
      }
      dhukuti_trust_fund: {
        Row: {
          balance: number
          created_at: string | null
          id: string
          last_updated: string | null
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string | null
          id?: string
          last_updated?: string | null
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string | null
          id?: string
          last_updated?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dhukuti_trust_fund_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "dhukuti_users"
            referencedColumns: ["id"]
          },
        ]
      }
      dhukuti_users: {
        Row: {
          auth_user_id: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          location_name: string | null
          phone: string | null
          preferred_language:
            | Database["public"]["Enums"]["dhukuti_language"]
            | null
          updated_at: string | null
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          location_name?: string | null
          phone?: string | null
          preferred_language?:
            | Database["public"]["Enums"]["dhukuti_language"]
            | null
          updated_at?: string | null
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          location_name?: string | null
          phone?: string | null
          preferred_language?:
            | Database["public"]["Enums"]["dhukuti_language"]
            | null
          updated_at?: string | null
        }
        Relationships: []
      }
      dhukuti_winners: {
        Row: {
          amount: number
          created_at: string | null
          cycle_id: string
          cycle_number: number
          id: string
          month_english: string
          month_nepali: string
          nepali_date: string
          person_id: string
          person_name: string
          updated_at: string | null
          user_id: string
          win_date: string
          year: number
        }
        Insert: {
          amount: number
          created_at?: string | null
          cycle_id: string
          cycle_number: number
          id?: string
          month_english: string
          month_nepali: string
          nepali_date: string
          person_id: string
          person_name: string
          updated_at?: string | null
          user_id: string
          win_date?: string
          year: number
        }
        Update: {
          amount?: number
          created_at?: string | null
          cycle_id?: string
          cycle_number?: number
          id?: string
          month_english?: string
          month_nepali?: string
          nepali_date?: string
          person_id?: string
          person_name?: string
          updated_at?: string | null
          user_id?: string
          win_date?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "dhukuti_winners_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "dhukuti_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dhukuti_winners_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "dhukuti_people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dhukuti_winners_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "dhukuti_users"
            referencedColumns: ["id"]
          },
        ]
      }
      episodes: {
        Row: {
          air_date: string | null
          created_at: string
          episode_number: number
          id: string
          season_number: number
          show_id: string
          title: string
          updated_at: string
        }
        Insert: {
          air_date?: string | null
          created_at?: string
          episode_number: number
          id?: string
          season_number?: number
          show_id: string
          title: string
          updated_at?: string
        }
        Update: {
          air_date?: string | null
          created_at?: string
          episode_number?: number
          id?: string
          season_number?: number
          show_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "episodes_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
        ]
      }
      episodes_clone: {
        Row: {
          air_date: string | null
          created_at: string
          episode_number: number
          id: string
          season_number: number
          show_id: string
          title: string
          updated_at: string
        }
        Insert: {
          air_date?: string | null
          created_at?: string
          episode_number: number
          id?: string
          season_number?: number
          show_id: string
          title: string
          updated_at?: string
        }
        Update: {
          air_date?: string | null
          created_at?: string
          episode_number?: number
          id?: string
          season_number?: number
          show_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      family_dhukuti_contributions: {
        Row: {
          amount: number
          created_at: string | null
          date: string | null
          id: string
          member_id: string
          month: string
          nepali_date: string | null
          remarks: string | null
          updated_at: string | null
          year: number
        }
        Insert: {
          amount: number
          created_at?: string | null
          date?: string | null
          id?: string
          member_id: string
          month: string
          nepali_date?: string | null
          remarks?: string | null
          updated_at?: string | null
          year: number
        }
        Update: {
          amount?: number
          created_at?: string | null
          date?: string | null
          id?: string
          member_id?: string
          month?: string
          nepali_date?: string | null
          remarks?: string | null
          updated_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "family_dhukuti_contributions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "family_dhukuti_members"
            referencedColumns: ["id"]
          },
        ]
      }
      family_dhukuti_members: {
        Row: {
          created_at: string | null
          id: string
          joined_date: string | null
          name: string
          nepali_joined_date: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          joined_date?: string | null
          name: string
          nepali_joined_date?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          joined_date?: string | null
          name?: string
          nepali_joined_date?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      family_dhukuti_winners: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          member_id: string
          month: string
          nepali_win_date: string | null
          remarks: string | null
          updated_at: string | null
          win_date: string | null
          year: number
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          member_id: string
          month: string
          nepali_win_date?: string | null
          remarks?: string | null
          updated_at?: string | null
          win_date?: string | null
          year: number
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          member_id?: string
          month?: string
          nepali_win_date?: string | null
          remarks?: string | null
          updated_at?: string | null
          win_date?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "family_dhukuti_winners_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "family_dhukuti_members"
            referencedColumns: ["id"]
          },
        ]
      }
      football_matches: {
        Row: {
          city: string | null
          created_at: string
          group_name: string | null
          id: string
          kickoff_at: string
          pen_a: number | null
          pen_b: number | null
          score_a: number | null
          score_b: number | null
          stadium: string | null
          stage: Database["public"]["Enums"]["match_stage"]
          status: Database["public"]["Enums"]["match_status"]
          team_a: string
          team_a_flag: string | null
          team_b: string
          team_b_flag: string | null
          updated_at: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          group_name?: string | null
          id?: string
          kickoff_at: string
          pen_a?: number | null
          pen_b?: number | null
          score_a?: number | null
          score_b?: number | null
          stadium?: string | null
          stage?: Database["public"]["Enums"]["match_stage"]
          status?: Database["public"]["Enums"]["match_status"]
          team_a: string
          team_a_flag?: string | null
          team_b: string
          team_b_flag?: string | null
          updated_at?: string
        }
        Update: {
          city?: string | null
          created_at?: string
          group_name?: string | null
          id?: string
          kickoff_at?: string
          pen_a?: number | null
          pen_b?: number | null
          score_a?: number | null
          score_b?: number | null
          stadium?: string | null
          stage?: Database["public"]["Enums"]["match_stage"]
          status?: Database["public"]["Enums"]["match_status"]
          team_a?: string
          team_a_flag?: string | null
          team_b?: string
          team_b_flag?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      football_predictions: {
        Row: {
          created_at: string
          id: string
          match_id: string
          pen_winner: Database["public"]["Enums"]["prediction_pick"] | null
          pick: Database["public"]["Enums"]["prediction_pick"]
          points_awarded: number
          score_a: number | null
          score_b: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          match_id: string
          pen_winner?: Database["public"]["Enums"]["prediction_pick"] | null
          pick: Database["public"]["Enums"]["prediction_pick"]
          points_awarded?: number
          score_a?: number | null
          score_b?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          match_id?: string
          pen_winner?: Database["public"]["Enums"]["prediction_pick"] | null
          pick?: Database["public"]["Enums"]["prediction_pick"]
          points_awarded?: number
          score_a?: number | null
          score_b?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "football_predictions_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "football_matches"
            referencedColumns: ["id"]
          },
        ]
      }
      football_profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          is_active: boolean
          username: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          is_active?: boolean
          username: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          username?: string
        }
        Relationships: []
      }
      football_room_members: {
        Row: {
          joined_at: string
          room_id: string
          user_id: string
        }
        Insert: {
          joined_at?: string
          room_id: string
          user_id: string
        }
        Update: {
          joined_at?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "football_room_members_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "football_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      football_room_predictions: {
        Row: {
          created_at: string
          id: string
          match_id: string
          pen_winner: Database["public"]["Enums"]["prediction_pick"] | null
          pick: Database["public"]["Enums"]["prediction_pick"]
          points_awarded: number
          room_id: string
          score_a: number | null
          score_b: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          match_id: string
          pen_winner?: Database["public"]["Enums"]["prediction_pick"] | null
          pick: Database["public"]["Enums"]["prediction_pick"]
          points_awarded?: number
          room_id: string
          score_a?: number | null
          score_b?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          match_id?: string
          pen_winner?: Database["public"]["Enums"]["prediction_pick"] | null
          pick?: Database["public"]["Enums"]["prediction_pick"]
          points_awarded?: number
          room_id?: string
          score_a?: number | null
          score_b?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "football_room_predictions_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "football_matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "football_room_predictions_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "football_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      football_rooms: {
        Row: {
          created_at: string
          description: string | null
          id: string
          knockout_multiplier: number
          name: string
          owner_id: string
          points_exact_bonus: number
          points_goal_diff_bonus: number
          points_outcome: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          knockout_multiplier?: number
          name: string
          owner_id: string
          points_exact_bonus?: number
          points_goal_diff_bonus?: number
          points_outcome?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          knockout_multiplier?: number
          name?: string
          owner_id?: string
          points_exact_bonus?: number
          points_goal_diff_bonus?: number
          points_outcome?: number
          updated_at?: string
        }
        Relationships: []
      }
      football_user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      friends: {
        Row: {
          created_at: string
          friend_email: string
          friend_name: string
          id: string
          notes: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_email: string
          friend_name: string
          id?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          friend_email?: string
          friend_name?: string
          id?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      household_activity_log: {
        Row: {
          action_type: string
          actor_email: string | null
          actor_name: string
          created_at: string
          description: string
          id: string
          metadata: Json | null
          network_id: string
        }
        Insert: {
          action_type: string
          actor_email?: string | null
          actor_name: string
          created_at?: string
          description: string
          id?: string
          metadata?: Json | null
          network_id: string
        }
        Update: {
          action_type?: string
          actor_email?: string | null
          actor_name?: string
          created_at?: string
          description?: string
          id?: string
          metadata?: Json | null
          network_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "household_activity_log_network_id_fkey"
            columns: ["network_id"]
            isOneToOne: false
            referencedRelation: "settlegara_networks"
            referencedColumns: ["id"]
          },
        ]
      }
      household_categories: {
        Row: {
          color: string | null
          created_at: string
          icon: string | null
          id: string
          is_predefined: boolean | null
          name: string
          network_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_predefined?: boolean | null
          name: string
          network_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_predefined?: boolean | null
          name?: string
          network_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "household_categories_network_id_fkey"
            columns: ["network_id"]
            isOneToOne: false
            referencedRelation: "settlegara_networks"
            referencedColumns: ["id"]
          },
        ]
      }
      household_recurring_expenses: {
        Row: {
          amount: number
          auto_generate: boolean | null
          category_id: string | null
          created_at: string
          created_by: string
          currency: string | null
          frequency: string
          id: string
          is_active: boolean | null
          last_generated_at: string | null
          network_id: string
          next_due_date: string
          paid_by_member_id: string | null
          split_type: string | null
          title: string
          updated_at: string
        }
        Insert: {
          amount: number
          auto_generate?: boolean | null
          category_id?: string | null
          created_at?: string
          created_by: string
          currency?: string | null
          frequency?: string
          id?: string
          is_active?: boolean | null
          last_generated_at?: string | null
          network_id: string
          next_due_date: string
          paid_by_member_id?: string | null
          split_type?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          amount?: number
          auto_generate?: boolean | null
          category_id?: string | null
          created_at?: string
          created_by?: string
          currency?: string | null
          frequency?: string
          id?: string
          is_active?: boolean | null
          last_generated_at?: string | null
          network_id?: string
          next_due_date?: string
          paid_by_member_id?: string | null
          split_type?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "household_recurring_expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "household_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "household_recurring_expenses_network_id_fkey"
            columns: ["network_id"]
            isOneToOne: false
            referencedRelation: "settlegara_networks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "household_recurring_expenses_paid_by_member_id_fkey"
            columns: ["paid_by_member_id"]
            isOneToOne: false
            referencedRelation: "settlegara_network_members"
            referencedColumns: ["id"]
          },
        ]
      }
      image_albums: {
        Row: {
          cover_image_id: string | null
          created_at: string
          description: string | null
          id: string
          is_public: boolean | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cover_image_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cover_image_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "image_albums_cover_image_id_fkey"
            columns: ["cover_image_id"]
            isOneToOne: false
            referencedRelation: "user_images"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_categories: {
        Row: {
          color: string | null
          created_at: string
          icon: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      inventory_items: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          maximum_stock_level: number | null
          minimum_stock_level: number | null
          name: string
          organization_id: string
          quantity_in_stock: number
          sku: string | null
          unit_price: number
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          maximum_stock_level?: number | null
          minimum_stock_level?: number | null
          name: string
          organization_id: string
          quantity_in_stock?: number
          sku?: string | null
          unit_price?: number
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          maximum_stock_level?: number | null
          minimum_stock_level?: number | null
          name?: string
          organization_id?: string
          quantity_in_stock?: number
          sku?: string | null
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items_tracker: {
        Row: {
          available_for_delivery: boolean
          category_id: string | null
          created_at: string
          discount_price: number | null
          expiry_date: string | null
          household_id: string | null
          id: string
          is_archived: boolean
          is_sellable: boolean
          location: string | null
          max_order_quantity: number
          min_stock: number
          name: string
          notes: string | null
          organization_id: string | null
          product_description: string | null
          product_images: string[] | null
          product_tags: string[] | null
          purchase_price: number
          quantity: number
          selling_price: number
          store_id: string | null
          unit: string
          updated_at: string
          user_id: string
        }
        Insert: {
          available_for_delivery?: boolean
          category_id?: string | null
          created_at?: string
          discount_price?: number | null
          expiry_date?: string | null
          household_id?: string | null
          id?: string
          is_archived?: boolean
          is_sellable?: boolean
          location?: string | null
          max_order_quantity?: number
          min_stock?: number
          name: string
          notes?: string | null
          organization_id?: string | null
          product_description?: string | null
          product_images?: string[] | null
          product_tags?: string[] | null
          purchase_price?: number
          quantity?: number
          selling_price?: number
          store_id?: string | null
          unit?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          available_for_delivery?: boolean
          category_id?: string | null
          created_at?: string
          discount_price?: number | null
          expiry_date?: string | null
          household_id?: string | null
          id?: string
          is_archived?: boolean
          is_sellable?: boolean
          location?: string | null
          max_order_quantity?: number
          min_stock?: number
          name?: string
          notes?: string | null
          organization_id?: string | null
          product_description?: string | null
          product_images?: string[] | null
          product_tags?: string[] | null
          purchase_price?: number
          quantity?: number
          selling_price?: number
          store_id?: string | null
          unit?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_tracker_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "inventory_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_tracker_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "settlegara_networks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_tracker_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_tracker_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "inventory_stores"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_stores: {
        Row: {
          address: string | null
          color: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      inventory_transactions: {
        Row: {
          created_at: string
          id: string
          item_id: string
          notes: string | null
          quantity_change: number
          transaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          notes?: string | null
          quantity_change: number
          transaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          notes?: string | null
          quantity_change?: number
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transactions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items_tracker"
            referencedColumns: ["id"]
          },
        ]
      }
      movie_universe_items: {
        Row: {
          created_at: string
          id: string
          movie_id: string
          timeline_order: number
          universe_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          movie_id: string
          timeline_order?: number
          universe_id: string
        }
        Update: {
          created_at?: string
          id?: string
          movie_id?: string
          timeline_order?: number
          universe_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "movie_universe_items_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: false
            referencedRelation: "movies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movie_universe_items_universe_id_fkey"
            columns: ["universe_id"]
            isOneToOne: false
            referencedRelation: "movie_universes"
            referencedColumns: ["id"]
          },
        ]
      }
      movie_universes: {
        Row: {
          created_at: string
          creator_id: string
          description: string | null
          id: string
          is_public: boolean
          name: string
          slug: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          description?: string | null
          id?: string
          is_public?: boolean
          name: string
          slug?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          description?: string | null
          id?: string
          is_public?: boolean
          name?: string
          slug?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      movies: {
        Row: {
          created_at: string
          description: string | null
          director: string | null
          duration_minutes: number | null
          genre: string | null
          id: string
          is_favorite: boolean
          is_public: boolean
          overview: string | null
          poster_url: string | null
          rating: number | null
          release_year: number | null
          rewatch_count: number
          runtime_minutes: number | null
          slug: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
          user_notes: string | null
          user_rating: number | null
          watched_at: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          director?: string | null
          duration_minutes?: number | null
          genre?: string | null
          id?: string
          is_favorite?: boolean
          is_public?: boolean
          overview?: string | null
          poster_url?: string | null
          rating?: number | null
          release_year?: number | null
          rewatch_count?: number
          runtime_minutes?: number | null
          slug?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
          user_notes?: string | null
          user_rating?: number | null
          watched_at?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          director?: string | null
          duration_minutes?: number | null
          genre?: string | null
          id?: string
          is_favorite?: boolean
          is_public?: boolean
          overview?: string | null
          poster_url?: string | null
          rating?: number | null
          release_year?: number | null
          rewatch_count?: number
          runtime_minutes?: number | null
          slug?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          user_notes?: string | null
          user_rating?: number | null
          watched_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      organization_members: {
        Row: {
          id: string
          joined_at: string
          organization_id: string
          role: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          organization_id: string
          role?: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          organization_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          creator_id: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      page_metadata: {
        Row: {
          canonical_url: string | null
          created_at: string
          id: string
          meta_description: string | null
          meta_keywords: string | null
          og_description: string | null
          og_title: string | null
          route: string
          title: string | null
          updated_at: string
        }
        Insert: {
          canonical_url?: string | null
          created_at?: string
          id?: string
          meta_description?: string | null
          meta_keywords?: string | null
          og_description?: string | null
          og_title?: string | null
          route: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          canonical_url?: string | null
          created_at?: string
          id?: string
          meta_description?: string | null
          meta_keywords?: string | null
          og_description?: string | null
          og_title?: string | null
          route?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          first_name: string | null
          id: string
          last_name: string | null
          preferred_currency: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          preferred_currency?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          preferred_currency?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      qa_boards: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_archived: boolean
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_archived?: boolean
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_archived?: boolean
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "qa_boards_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "qa_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      qa_card_activity: {
        Row: {
          action: string
          card_id: string
          created_at: string
          details: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          card_id: string
          created_at?: string
          details?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          card_id?: string
          created_at?: string
          details?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qa_card_activity_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "qa_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      qa_card_attachments: {
        Row: {
          card_id: string
          created_at: string
          file_name: string
          file_url: string
          id: string
          uploaded_by: string | null
        }
        Insert: {
          card_id: string
          created_at?: string
          file_name: string
          file_url: string
          id?: string
          uploaded_by?: string | null
        }
        Update: {
          card_id?: string
          created_at?: string
          file_name?: string
          file_url?: string
          id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qa_card_attachments_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "qa_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      qa_card_comments: {
        Row: {
          card_id: string
          comment: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          card_id: string
          comment: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          card_id?: string
          comment?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "qa_card_comments_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "qa_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      qa_cards: {
        Row: {
          actual_result: string | null
          assigned_to: string | null
          board_id: string
          bug_type: string
          created_at: string
          description: string | null
          due_date: string | null
          environment: string | null
          expected_result: string | null
          id: string
          labels: string[] | null
          list_id: string
          module: string | null
          position: number
          priority: string
          reported_by: string | null
          severity: string
          status: string
          steps_to_reproduce: string | null
          title: string
          updated_at: string
        }
        Insert: {
          actual_result?: string | null
          assigned_to?: string | null
          board_id: string
          bug_type?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          environment?: string | null
          expected_result?: string | null
          id?: string
          labels?: string[] | null
          list_id: string
          module?: string | null
          position?: number
          priority?: string
          reported_by?: string | null
          severity?: string
          status?: string
          steps_to_reproduce?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          actual_result?: string | null
          assigned_to?: string | null
          board_id?: string
          bug_type?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          environment?: string | null
          expected_result?: string | null
          id?: string
          labels?: string[] | null
          list_id?: string
          module?: string | null
          position?: number
          priority?: string
          reported_by?: string | null
          severity?: string
          status?: string
          steps_to_reproduce?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "qa_cards_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "qa_boards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qa_cards_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "qa_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      qa_lists: {
        Row: {
          board_id: string
          created_at: string
          id: string
          position: number
          title: string
        }
        Insert: {
          board_id: string
          created_at?: string
          id?: string
          position?: number
          title: string
        }
        Update: {
          board_id?: string
          created_at?: string
          id?: string
          position?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "qa_lists_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "qa_boards"
            referencedColumns: ["id"]
          },
        ]
      }
      qa_test_cases: {
        Row: {
          actual_result: string | null
          assigned_to: string | null
          created_at: string
          created_by: string | null
          description: string | null
          expected_result: string | null
          id: string
          module: string
          notes: string | null
          preconditions: string | null
          priority: string | null
          status: string
          steps: string | null
          test_case_id: string
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          actual_result?: string | null
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          expected_result?: string | null
          id?: string
          module?: string
          notes?: string | null
          preconditions?: string | null
          priority?: string | null
          status?: string
          steps?: string | null
          test_case_id?: string
          title?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          actual_result?: string | null
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          expected_result?: string | null
          id?: string
          module?: string
          notes?: string | null
          preconditions?: string | null
          priority?: string | null
          status?: string
          steps?: string | null
          test_case_id?: string
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "qa_test_cases_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "qa_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      qa_workspace_members: {
        Row: {
          created_at: string
          id: string
          role: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "qa_workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "qa_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      qa_workspaces: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          updated_at: string
          visibility: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: []
      }
      qc_order_items: {
        Row: {
          created_at: string
          id: string
          inventory_item_id: string
          order_id: string
          price: number
          quantity: number
          subtotal: number
        }
        Insert: {
          created_at?: string
          id?: string
          inventory_item_id: string
          order_id: string
          price?: number
          quantity?: number
          subtotal?: number
        }
        Update: {
          created_at?: string
          id?: string
          inventory_item_id?: string
          order_id?: string
          price?: number
          quantity?: number
          subtotal?: number
        }
        Relationships: [
          {
            foreignKeyName: "qc_order_items_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items_tracker"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qc_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "qc_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      qc_orders: {
        Row: {
          assigned_rider_id: string | null
          created_at: string
          delivery_address: string | null
          delivery_lat: number | null
          delivery_lng: number | null
          id: string
          payment_method: string
          status: string
          store_location_id: string | null
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_rider_id?: string | null
          created_at?: string
          delivery_address?: string | null
          delivery_lat?: number | null
          delivery_lng?: number | null
          id?: string
          payment_method?: string
          status?: string
          store_location_id?: string | null
          total_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_rider_id?: string | null
          created_at?: string
          delivery_address?: string | null
          delivery_lat?: number | null
          delivery_lng?: number | null
          id?: string
          payment_method?: string
          status?: string
          store_location_id?: string | null
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "qc_orders_assigned_rider_id_fkey"
            columns: ["assigned_rider_id"]
            isOneToOne: false
            referencedRelation: "riders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qc_orders_store_location_id_fkey"
            columns: ["store_location_id"]
            isOneToOne: false
            referencedRelation: "store_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      requests: {
        Row: {
          created_at: string
          id: string
          message: string | null
          status: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          status?: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          status?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      rider_locations: {
        Row: {
          id: string
          lat: number
          lng: number
          rider_id: string
          updated_at: string
        }
        Insert: {
          id?: string
          lat?: number
          lng?: number
          rider_id: string
          updated_at?: string
        }
        Update: {
          id?: string
          lat?: number
          lng?: number
          rider_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rider_locations_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "riders"
            referencedColumns: ["id"]
          },
        ]
      }
      riders: {
        Row: {
          created_at: string
          id: string
          name: string
          phone: string | null
          status: string
          updated_at: string
          user_id: string
          vehicle_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          phone?: string | null
          status?: string
          updated_at?: string
          user_id: string
          vehicle_type?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          phone?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          vehicle_type?: string
        }
        Relationships: []
      }
      scheduled_payments: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string
          frequency: string
          id: string
          is_active: boolean
          last_executed_at: string | null
          name: string
          next_date: string
          notes: string | null
          reminder_enabled: boolean
          to_wallet_id: string | null
          type: string
          updated_at: string
          user_id: string
          wallet_id: string | null
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string
          frequency: string
          id?: string
          is_active?: boolean
          last_executed_at?: string | null
          name: string
          next_date: string
          notes?: string | null
          reminder_enabled?: boolean
          to_wallet_id?: string | null
          type: string
          updated_at?: string
          user_id: string
          wallet_id?: string | null
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string
          frequency?: string
          id?: string
          is_active?: boolean
          last_executed_at?: string | null
          name?: string
          next_date?: string
          notes?: string | null
          reminder_enabled?: boolean
          to_wallet_id?: string | null
          type?: string
          updated_at?: string
          user_id?: string
          wallet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_payments_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_payments_to_wallet_id_fkey"
            columns: ["to_wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_payments_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      settlegara_bill_items: {
        Row: {
          amount: number
          bill_id: string
          created_at: string
          id: string
          name: string
          quantity: number
          rate: number
        }
        Insert: {
          amount?: number
          bill_id: string
          created_at?: string
          id?: string
          name: string
          quantity?: number
          rate?: number
        }
        Update: {
          amount?: number
          bill_id?: string
          created_at?: string
          id?: string
          name?: string
          quantity?: number
          rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "settlegara_bill_items_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "settlegara_bills"
            referencedColumns: ["id"]
          },
        ]
      }
      settlegara_bill_splits: {
        Row: {
          amount: number
          bill_id: string
          created_at: string
          id: string
          member_id: string
          settled_at: string | null
          settled_by: string | null
          status: string
        }
        Insert: {
          amount: number
          bill_id: string
          created_at?: string
          id?: string
          member_id: string
          settled_at?: string | null
          settled_by?: string | null
          status?: string
        }
        Update: {
          amount?: number
          bill_id?: string
          created_at?: string
          id?: string
          member_id?: string
          settled_at?: string | null
          settled_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "settlegara_bill_splits_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "settlegara_bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlegara_bill_splits_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "settlegara_network_members"
            referencedColumns: ["id"]
          },
        ]
      }
      settlegara_bills: {
        Row: {
          bill_image_url: string | null
          created_at: string
          created_by: string
          currency: string
          description: string | null
          discount_amount: number | null
          discount_excluded_members: string[] | null
          id: string
          is_itemized: boolean | null
          network_id: string
          paid_at: string | null
          paid_by: string | null
          source_app: string
          status: string
          title: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          bill_image_url?: string | null
          created_at?: string
          created_by: string
          currency?: string
          description?: string | null
          discount_amount?: number | null
          discount_excluded_members?: string[] | null
          id?: string
          is_itemized?: boolean | null
          network_id: string
          paid_at?: string | null
          paid_by?: string | null
          source_app?: string
          status?: string
          title: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          bill_image_url?: string | null
          created_at?: string
          created_by?: string
          currency?: string
          description?: string | null
          discount_amount?: number | null
          discount_excluded_members?: string[] | null
          id?: string
          is_itemized?: boolean | null
          network_id?: string
          paid_at?: string | null
          paid_by?: string | null
          source_app?: string
          status?: string
          title?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "settlegara_bills_network_id_fkey"
            columns: ["network_id"]
            isOneToOne: false
            referencedRelation: "settlegara_networks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlegara_bills_paid_by_fkey"
            columns: ["paid_by"]
            isOneToOne: false
            referencedRelation: "settlegara_network_members"
            referencedColumns: ["id"]
          },
        ]
      }
      settlegara_final_calculation_shares: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          network_id: string
          payload: Json
          share_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          network_id: string
          payload: Json
          share_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          network_id?: string
          payload?: Json
          share_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "settlegara_final_calculation_shares_network_id_fkey"
            columns: ["network_id"]
            isOneToOne: false
            referencedRelation: "settlegara_networks"
            referencedColumns: ["id"]
          },
        ]
      }
      settlegara_item_assignments: {
        Row: {
          consumed_quantity: number
          created_at: string
          id: string
          item_id: string
          member_id: string
          share_amount: number
        }
        Insert: {
          consumed_quantity?: number
          created_at?: string
          id?: string
          item_id: string
          member_id: string
          share_amount?: number
        }
        Update: {
          consumed_quantity?: number
          created_at?: string
          id?: string
          item_id?: string
          member_id?: string
          share_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "settlegara_item_assignments_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "settlegara_bill_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlegara_item_assignments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "settlegara_network_members"
            referencedColumns: ["id"]
          },
        ]
      }
      settlegara_member_wallet_images: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          id: string
          member_id: string
          network_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          id?: string
          member_id: string
          network_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          id?: string
          member_id?: string
          network_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "settlegara_member_wallet_images_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "settlegara_network_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlegara_member_wallet_images_network_id_fkey"
            columns: ["network_id"]
            isOneToOne: false
            referencedRelation: "settlegara_networks"
            referencedColumns: ["id"]
          },
        ]
      }
      settlegara_network_members: {
        Row: {
          id: string
          joined_at: string
          network_id: string
          role: string
          status: string
          user_email: string
          user_name: string
        }
        Insert: {
          id?: string
          joined_at?: string
          network_id: string
          role?: string
          status?: string
          user_email: string
          user_name: string
        }
        Update: {
          id?: string
          joined_at?: string
          network_id?: string
          role?: string
          status?: string
          user_email?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "settlegara_network_members_network_id_fkey"
            columns: ["network_id"]
            isOneToOne: false
            referencedRelation: "settlegara_networks"
            referencedColumns: ["id"]
          },
        ]
      }
      settlegara_networks: {
        Row: {
          created_at: string
          creator_id: string
          description: string | null
          id: string
          name: string
          network_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          description?: string | null
          id?: string
          name: string
          network_type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          description?: string | null
          id?: string
          name?: string
          network_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      settlegara_settlements: {
        Row: {
          amount: number
          completed_at: string | null
          created_at: string
          created_by: string
          currency: string
          from_member_id: string
          id: string
          network_id: string
          status: string
          to_member_id: string
        }
        Insert: {
          amount: number
          completed_at?: string | null
          created_at?: string
          created_by: string
          currency?: string
          from_member_id: string
          id?: string
          network_id: string
          status?: string
          to_member_id: string
        }
        Update: {
          amount?: number
          completed_at?: string | null
          created_at?: string
          created_by?: string
          currency?: string
          from_member_id?: string
          id?: string
          network_id?: string
          status?: string
          to_member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "settlegara_settlements_from_member_id_fkey"
            columns: ["from_member_id"]
            isOneToOne: false
            referencedRelation: "settlegara_network_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlegara_settlements_network_id_fkey"
            columns: ["network_id"]
            isOneToOne: false
            referencedRelation: "settlegara_networks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlegara_settlements_to_member_id_fkey"
            columns: ["to_member_id"]
            isOneToOne: false
            referencedRelation: "settlegara_network_members"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_universe_media: {
        Row: {
          created_at: string
          id: string
          media_id: string
          media_type: string
          notes: string | null
          phase: string | null
          timeline_order: number
          universe_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          media_id: string
          media_type: string
          notes?: string | null
          phase?: string | null
          timeline_order?: number
          universe_id: string
        }
        Update: {
          created_at?: string
          id?: string
          media_id?: string
          media_type?: string
          notes?: string | null
          phase?: string | null
          timeline_order?: number
          universe_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_universe_media_universe_id_fkey"
            columns: ["universe_id"]
            isOneToOne: false
            referencedRelation: "shared_universes"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_universes: {
        Row: {
          cover_image: string | null
          created_at: string
          description: string | null
          id: string
          title: string
          updated_at: string
          user_id: string
          visibility: string
        }
        Insert: {
          cover_image?: string | null
          created_at?: string
          description?: string | null
          id?: string
          title: string
          updated_at?: string
          user_id: string
          visibility?: string
        }
        Update: {
          cover_image?: string | null
          created_at?: string
          description?: string | null
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
          visibility?: string
        }
        Relationships: []
      }
      show_universes: {
        Row: {
          created_at: string
          id: string
          show_id: string
          universe_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          show_id: string
          universe_id: string
        }
        Update: {
          created_at?: string
          id?: string
          show_id?: string
          universe_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "show_universes_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "show_universes_universe_id_fkey"
            columns: ["universe_id"]
            isOneToOne: false
            referencedRelation: "universes"
            referencedColumns: ["id"]
          },
        ]
      }
      show_universes_clone: {
        Row: {
          created_at: string
          id: string
          show_id: string
          universe_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          show_id: string
          universe_id: string
        }
        Update: {
          created_at?: string
          id?: string
          show_id?: string
          universe_id?: string
        }
        Relationships: []
      }
      shows: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          poster_url: string | null
          slug: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          poster_url?: string | null
          slug?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          poster_url?: string | null
          slug?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      shows_clone: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          poster_url: string | null
          slug: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          poster_url?: string | null
          slug?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          poster_url?: string | null
          slug?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      stock_movements: {
        Row: {
          created_at: string
          id: string
          inventory_item_id: string
          movement_type: string
          notes: string | null
          organization_id: string
          quantity: number
          reference: string | null
          unit_cost: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          inventory_item_id: string
          movement_type: string
          notes?: string | null
          organization_id: string
          quantity: number
          reference?: string | null
          unit_cost?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          inventory_item_id?: string
          movement_type?: string
          notes?: string | null
          organization_id?: string
          quantity?: number
          reference?: string | null
          unit_cost?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      store_locations: {
        Row: {
          created_at: string
          delivery_radius_km: number
          id: string
          lat: number
          lng: number
          name: string
          store_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          delivery_radius_km?: number
          id?: string
          lat?: number
          lng?: number
          name: string
          store_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          delivery_radius_km?: number
          id?: string
          lat?: number
          lng?: number
          name?: string
          store_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_locations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "inventory_stores"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          category_id: string | null
          created_at: string
          date: string
          expense: number | null
          id: string
          income: number | null
          nepali_date: string | null
          organization_id: string | null
          reason: string
          type: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          date: string
          expense?: number | null
          id?: string
          income?: number | null
          nepali_date?: string | null
          organization_id?: string | null
          reason: string
          type: string
          user_id: string
          wallet_id: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          date?: string
          expense?: number | null
          id?: string
          income?: number | null
          nepali_date?: string | null
          organization_id?: string | null
          reason?: string
          type?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      transfers: {
        Row: {
          amount: number
          created_at: string
          date: string
          description: string | null
          from_wallet_id: string
          id: string
          status: string
          to_wallet_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          date?: string
          description?: string | null
          from_wallet_id: string
          id?: string
          status?: string
          to_wallet_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          description?: string | null
          from_wallet_id?: string
          id?: string
          status?: string
          to_wallet_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transfers_from_wallet_id_fkey"
            columns: ["from_wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfers_to_wallet_id_fkey"
            columns: ["to_wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      universes: {
        Row: {
          created_at: string
          creator_id: string | null
          description: string | null
          id: string
          is_public: boolean
          name: string
          slug: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_id?: string | null
          description?: string | null
          id?: string
          is_public?: boolean
          name: string
          slug?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_id?: string | null
          description?: string | null
          id?: string
          is_public?: boolean
          name?: string
          slug?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      universes_clone: {
        Row: {
          created_at: string
          creator_id: string | null
          description: string | null
          id: string
          is_public: boolean
          name: string
          slug: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_id?: string | null
          description?: string | null
          id?: string
          is_public?: boolean
          name: string
          slug?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_id?: string | null
          description?: string | null
          id?: string
          is_public?: boolean
          name?: string
          slug?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_app_permissions: {
        Row: {
          app_module: Database["public"]["Enums"]["app_module"]
          created_at: string
          id: string
          permission: Database["public"]["Enums"]["permission_level"]
          updated_at: string
          user_id: string
        }
        Insert: {
          app_module: Database["public"]["Enums"]["app_module"]
          created_at?: string
          id?: string
          permission?: Database["public"]["Enums"]["permission_level"]
          updated_at?: string
          user_id: string
        }
        Update: {
          app_module?: Database["public"]["Enums"]["app_module"]
          created_at?: string
          id?: string
          permission?: Database["public"]["Enums"]["permission_level"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_app_preferences: {
        Row: {
          app_name: string
          created_at: string
          enabled: boolean
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          app_name: string
          created_at?: string
          enabled?: boolean
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          app_name?: string
          created_at?: string
          enabled?: boolean
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_email_preferences: {
        Row: {
          created_at: string
          finance_summary: boolean | null
          household_summary: boolean | null
          id: string
          inventory_summary: boolean | null
          monthly_digest: boolean | null
          movies_summary: boolean | null
          settlebill_summary: boolean | null
          tv_shows_summary: boolean | null
          updated_at: string
          user_id: string
          weekly_digest: boolean | null
          welcome_email: boolean | null
        }
        Insert: {
          created_at?: string
          finance_summary?: boolean | null
          household_summary?: boolean | null
          id?: string
          inventory_summary?: boolean | null
          monthly_digest?: boolean | null
          movies_summary?: boolean | null
          settlebill_summary?: boolean | null
          tv_shows_summary?: boolean | null
          updated_at?: string
          user_id: string
          weekly_digest?: boolean | null
          welcome_email?: boolean | null
        }
        Update: {
          created_at?: string
          finance_summary?: boolean | null
          household_summary?: boolean | null
          id?: string
          inventory_summary?: boolean | null
          monthly_digest?: boolean | null
          movies_summary?: boolean | null
          settlebill_summary?: boolean | null
          tv_shows_summary?: boolean | null
          updated_at?: string
          user_id?: string
          weekly_digest?: boolean | null
          welcome_email?: boolean | null
        }
        Relationships: []
      }
      user_episode_status: {
        Row: {
          created_at: string
          episode_id: string
          id: string
          status: Database["public"]["Enums"]["episode_status"]
          updated_at: string
          user_id: string
          watched_at: string | null
        }
        Insert: {
          created_at?: string
          episode_id: string
          id?: string
          status?: Database["public"]["Enums"]["episode_status"]
          updated_at?: string
          user_id: string
          watched_at?: string | null
        }
        Update: {
          created_at?: string
          episode_id?: string
          id?: string
          status?: Database["public"]["Enums"]["episode_status"]
          updated_at?: string
          user_id?: string
          watched_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_episode_status_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_images: {
        Row: {
          album_id: string | null
          created_at: string
          description: string | null
          file_path: string
          file_size: number | null
          height: number | null
          id: string
          is_favorite: boolean | null
          is_public: boolean | null
          mime_type: string | null
          tags: string[] | null
          title: string | null
          updated_at: string
          user_id: string
          width: number | null
        }
        Insert: {
          album_id?: string | null
          created_at?: string
          description?: string | null
          file_path: string
          file_size?: number | null
          height?: number | null
          id?: string
          is_favorite?: boolean | null
          is_public?: boolean | null
          mime_type?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string
          user_id: string
          width?: number | null
        }
        Update: {
          album_id?: string | null
          created_at?: string
          description?: string | null
          file_path?: string
          file_size?: number | null
          height?: number | null
          id?: string
          is_favorite?: boolean | null
          is_public?: boolean | null
          mime_type?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string
          user_id?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_images_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "image_albums"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_show_tracking: {
        Row: {
          created_at: string
          id: string
          last_updated: string | null
          show_id: string
          total_episodes: number | null
          user_id: string
          watched_episodes: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          last_updated?: string | null
          show_id: string
          total_episodes?: number | null
          user_id: string
          watched_episodes?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          last_updated?: string | null
          show_id?: string
          total_episodes?: number | null
          user_id?: string
          watched_episodes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_show_tracking_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number
          created_at: string
          currency: string
          id: string
          name: string
          organization_id: string | null
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          name: string
          organization_id?: string | null
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          name?: string
          organization_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      football_find_user_id_by_email: {
        Args: { _email: string }
        Returns: string
      }
      football_has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      football_is_active_user: { Args: { _user_id: string }; Returns: boolean }
      football_is_room_member: {
        Args: { _room_id: string; _user_id: string }
        Returns: boolean
      }
      football_is_room_owner: {
        Args: { _room_id: string; _user_id: string }
        Returns: boolean
      }
      football_list_users_with_email: {
        Args: never
        Returns: {
          email: string
          full_name: string
          id: string
          is_active: boolean
          is_admin: boolean
          username: string
        }[]
      }
      football_recalculate_match_points: {
        Args: { _match_id: string }
        Returns: undefined
      }
      football_recalculate_room_match_points: {
        Args: { _match_id: string; _room_id: string }
        Returns: undefined
      }
      generate_slug: { Args: { title: string }; Returns: string }
      get_network_settlements: {
        Args: { _network_id: string }
        Returns: {
          amount: number
          from_user_name: string
          to_user_name: string
        }[]
      }
      get_show_universe_data: {
        Args: never
        Returns: {
          air_date: string
          episode_id: string
          episode_number: number
          episode_title: string
          is_public: boolean
          poster_url: string
          season_number: number
          show_description: string
          show_id: string
          show_title: string
          slug: string
          universe_description: string
          universe_id: string
          universe_name: string
        }[]
      }
      get_universe_shows_episodes: {
        Args: { in_universe_slug: string }
        Returns: {
          air_date: string
          episode_number: number
          episode_title: string
          season_number: number
          show_title: string
          universe_name: string
        }[]
      }
      get_universedata: {
        Args: never
        Returns: {
          air_date: string
          episode_id: string
          episode_number: number
          episode_title: string
          is_public: boolean
          poster_url: string
          season_number: number
          show_description: string
          show_id: string
          show_title: string
          slug: string
          universe_id: string
        }[]
      }
      get_user_debts: {
        Args: { target_user: string }
        Returns: {
          owed_to: string
          total_amount: number
        }[]
      }
      get_user_organization_access: {
        Args: { org_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_active_member: {
        Args: { email: string; network: string }
        Returns: boolean
      }
      is_network_admin: {
        Args: { email: string; network: string }
        Returns: boolean
      }
      is_network_creator: {
        Args: { network: string; uid: string }
        Returns: boolean
      }
      is_qa_board_member: {
        Args: { _board_id: string; _user_id: string }
        Returns: boolean
      }
      is_qa_card_member: {
        Args: { _card_id: string; _user_id: string }
        Returns: boolean
      }
      is_qa_workspace_member: {
        Args: { _user_id: string; _workspace_id: string }
        Returns: boolean
      }
      settle_transitive_debts: { Args: never; Returns: undefined }
      simplify_network_settlements: {
        Args: { network_uuid: string }
        Returns: undefined
      }
      update_user_show_episode_counts: {
        Args: { p_show_id: string; p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_module:
        | "finance"
        | "settlebill"
        | "household"
        | "inventory"
        | "quickcommerce"
        | "movies"
        | "tv_tracker"
        | "universes"
        | "qa_tracker"
        | "images"
      app_role: "admin" | "user"
      dhukuti_language: "nepali" | "english"
      dhukuti_record_type: "income" | "expense"
      dhukuti_winner_status: "active" | "completed"
      episode_status: "watched" | "not_watched"
      football_app_role: "admin" | "user"
      match_stage:
        | "group"
        | "round_of_32"
        | "round_of_16"
        | "quarter_final"
        | "semi_final"
        | "third_place"
        | "final"
      match_status: "scheduled" | "live" | "finished" | "cancelled"
      permission_level:
        | "no_access"
        | "view_only"
        | "view_and_edit"
        | "full_access"
      prediction_pick: "team_a" | "team_b" | "draw"
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
      app_module: [
        "finance",
        "settlebill",
        "household",
        "inventory",
        "quickcommerce",
        "movies",
        "tv_tracker",
        "universes",
        "qa_tracker",
        "images",
      ],
      app_role: ["admin", "user"],
      dhukuti_language: ["nepali", "english"],
      dhukuti_record_type: ["income", "expense"],
      dhukuti_winner_status: ["active", "completed"],
      episode_status: ["watched", "not_watched"],
      football_app_role: ["admin", "user"],
      match_stage: [
        "group",
        "round_of_32",
        "round_of_16",
        "quarter_final",
        "semi_final",
        "third_place",
        "final",
      ],
      match_status: ["scheduled", "live", "finished", "cancelled"],
      permission_level: [
        "no_access",
        "view_only",
        "view_and_edit",
        "full_access",
      ],
      prediction_pick: ["team_a", "team_b", "draw"],
    },
  },
} as const
