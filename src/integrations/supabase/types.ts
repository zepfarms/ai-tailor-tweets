export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      oauth_states: {
        Row: {
          callback_url: string | null
          code_verifier: string
          created_at: string | null
          expires_at: string | null
          id: string
          is_login: boolean | null
          provider: string
          state: string
          user_id: string
        }
        Insert: {
          callback_url?: string | null
          code_verifier: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_login?: boolean | null
          provider: string
          state: string
          user_id: string
        }
        Update: {
          callback_url?: string | null
          code_verifier?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_login?: boolean | null
          provider?: string
          state?: string
          user_id?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          content: string
          created_at: string | null
          has_media: boolean | null
          id: string
          published: boolean | null
          scheduled_for: string | null
          tweet_id: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          has_media?: boolean | null
          id?: string
          published?: boolean | null
          scheduled_for?: string | null
          tweet_id?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          has_media?: boolean | null
          id?: string
          published?: boolean | null
          scheduled_for?: string | null
          tweet_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_tokens: {
        Row: {
          access_token: string
          created_at: string | null
          expires_at: string | null
          id: string
          provider: string
          refresh_token: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          access_token: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          provider: string
          refresh_token?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          access_token?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          provider?: string
          refresh_token?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      x_accounts: {
        Row: {
          access_token: string
          access_token_secret: string
          created_at: string | null
          id: string
          profile_image_url: string | null
          user_id: string
          x_user_id: string
          x_username: string
        }
        Insert: {
          access_token: string
          access_token_secret: string
          created_at?: string | null
          id?: string
          profile_image_url?: string | null
          user_id: string
          x_user_id: string
          x_username: string
        }
        Update: {
          access_token?: string
          access_token_secret?: string
          created_at?: string | null
          id?: string
          profile_image_url?: string | null
          user_id?: string
          x_user_id?: string
          x_username?: string
        }
        Relationships: []
      }
      x_analyses: {
        Row: {
          average_engagement: number | null
          last_analyzed: string
          peak_times: string | null
          posting_frequency: number | null
          recommendations: string | null
          top_tweet_id: string | null
          top_tweet_text: string | null
          user_id: string
          x_user_id: string
        }
        Insert: {
          average_engagement?: number | null
          last_analyzed?: string
          peak_times?: string | null
          posting_frequency?: number | null
          recommendations?: string | null
          top_tweet_id?: string | null
          top_tweet_text?: string | null
          user_id: string
          x_user_id: string
        }
        Update: {
          average_engagement?: number | null
          last_analyzed?: string
          peak_times?: string | null
          posting_frequency?: number | null
          recommendations?: string | null
          top_tweet_id?: string | null
          top_tweet_text?: string | null
          user_id?: string
          x_user_id?: string
        }
        Relationships: []
      }
      x_posts: {
        Row: {
          content: string
          created_at: string
          engagement_rate: number | null
          has_media: boolean | null
          id: number
          imported_at: string
          impressions_count: number | null
          likes_count: number
          media_urls: string[] | null
          replies_count: number
          retweets_count: number
          user_id: string
          x_user_id: string
        }
        Insert: {
          content: string
          created_at: string
          engagement_rate?: number | null
          has_media?: boolean | null
          id: number
          imported_at?: string
          impressions_count?: number | null
          likes_count?: number
          media_urls?: string[] | null
          replies_count?: number
          retweets_count?: number
          user_id: string
          x_user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          engagement_rate?: number | null
          has_media?: boolean | null
          id?: number
          imported_at?: string
          impressions_count?: number | null
          likes_count?: number
          media_urls?: string[] | null
          replies_count?: number
          retweets_count?: number
          user_id?: string
          x_user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_engagement_rate: {
        Args: {
          likes: number
          retweets: number
          replies: number
          impressions: number
        }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
