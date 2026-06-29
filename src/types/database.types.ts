// Auto-generated from Supabase schema — do not edit manually.
// Regenerate with: npx supabase gen types typescript --project-id qdhspcdpksihgrtdmmiy --schema public

export type DropState = 'active' | 'ready' | 'open' | 'expired'
export type ParticipantStatus = 'invited' | 'accepted' | 'declined' | 'pending' | 'removed'
export type FriendStatus = 'pending' | 'accepted' | 'blocked'
export type NotificationType =
  | 'drop_invited'
  | 'drop_ready'
  | 'drop_opened'
  | 'drop_opening_soon'
  | 'drop_expired'
  | 'participant_uploaded'
  | 'friend_request'
  | 'friend_accepted'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          display_name: string | null
          avatar_url: string | null
          phone: string | null
          bio: string | null
          age: number | null
          push_token: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          display_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          bio?: string | null
          age?: number | null
          push_token?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          display_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          bio?: string | null
          age?: number | null
          push_token?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      drops: {
        Row: {
          id: string
          creator_id: string
          title: string
          thumbnail_url: string | null
          state: DropState
          open_date: string | null
          opened_at: string | null
          is_private: boolean
          is_pinned: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          creator_id: string
          title: string
          thumbnail_url?: string | null
          state?: DropState
          open_date?: string | null
          opened_at?: string | null
          is_private?: boolean
          is_pinned?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          thumbnail_url?: string | null
          state?: DropState
          open_date?: string | null
          opened_at?: string | null
          is_private?: boolean
          is_pinned?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      drop_participants: {
        Row: {
          id: string
          drop_id: string
          user_id: string
          status: ParticipantStatus
          invited_by: string | null
          has_uploaded: boolean
          upload_count: number
          joined_at: string
          uploaded_at: string | null
        }
        Insert: {
          id?: string
          drop_id: string
          user_id: string
          status?: ParticipantStatus
          invited_by?: string | null
          has_uploaded?: boolean
          upload_count?: number
          joined_at?: string
          uploaded_at?: string | null
        }
        Update: {
          status?: ParticipantStatus
          has_uploaded?: boolean
          upload_count?: number
          uploaded_at?: string | null
        }
        Relationships: []
      }
      photos: {
        Row: {
          id: string
          drop_id: string
          uploader_id: string
          storage_path: string
          cdn_url: string
          width: number | null
          height: number | null
          taken_at: string | null
          uploaded_at: string
          sort_order: number
          is_pinned: boolean
        }
        Insert: {
          id?: string
          drop_id: string
          uploader_id: string
          storage_path: string
          cdn_url: string
          width?: number | null
          height?: number | null
          taken_at?: string | null
          uploaded_at?: string
          sort_order?: number
          is_pinned?: boolean
        }
        Update: {
          sort_order?: number
          is_pinned?: boolean
        }
        Relationships: []
      }
      friendships: {
        Row: {
          id: string
          requester_id: string
          addressee_id: string
          status: FriendStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          requester_id: string
          addressee_id: string
          status?: FriendStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: FriendStatus
          updated_at?: string
        }
        Relationships: []
      }
      reactions: {
        Row: {
          id: string
          photo_id: string
          user_id: string
          emoji: string
          created_at: string
        }
        Insert: {
          id?: string
          photo_id: string
          user_id: string
          emoji: string
          created_at?: string
        }
        Update: {
          emoji?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: NotificationType
          drop_id: string | null
          actor_id: string | null
          read: boolean
          sent_push: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: NotificationType
          drop_id?: string | null
          actor_id?: string | null
          read?: boolean
          sent_push?: boolean
          created_at?: string
        }
        Update: {
          read?: boolean
          sent_push?: boolean
        }
        Relationships: []
      }
    }
    Views: {
      my_friends: {
        Row: {
          friend_id: string | null
          status: FriendStatus | null
          created_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {}
    Enums: {
      drop_state: DropState
      participant_status: ParticipantStatus
      friend_status: FriendStatus
      notification_type: NotificationType
    }
  }
}

// Convenience re-exports — use these in your app code
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Drop = Database['public']['Tables']['drops']['Row']
export type DropParticipant = Database['public']['Tables']['drop_participants']['Row']
export type Photo = Database['public']['Tables']['photos']['Row']
export type Friendship = Database['public']['Tables']['friendships']['Row']
export type Reaction = Database['public']['Tables']['reactions']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']