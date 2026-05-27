// src/store/auth.store.ts

import { supabase } from '@/api/client'
import type { Database } from '@/types/database.types'
import { Session, User } from '@supabase/supabase-js'
import { create } from 'zustand'

type Profile = Database['public']['Tables']['profiles']['Row']

interface AuthState {
  // Data
  session: Session | null
  user: User | null
  profile: Profile | null

  // Status flags
  isAuthenticated: boolean
  isOnboarded: boolean        // false = send to setup-profile after sign-in
  isHydrated: boolean         // false = app is still reading from SecureStore on boot

  // Actions
  setSession: (session: Session | null) => void
  setProfile: (profile: Profile | null) => void
  setHydrated: () => void
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state — nothing is known yet until boot hydration completes
  session: null,
  user: null,
  profile: null,
  isAuthenticated: false,
  isOnboarded: false,
  isHydrated: false,

  /**
   * Called after sign-in, token refresh, or boot hydration.
   * Pass null to clear auth state (on sign-out or expired session).
   */
  setSession: (session) => {
    set({
      session,
      user: session?.user ?? null,
      isAuthenticated: !!session,
    })
  },

  /**
   * Called after fetching the user's profile row from Supabase.
   * Sets isOnboarded based on whether a username exists.
   */
  setProfile: (profile) => {
    set({
      profile,
      isOnboarded: !!profile?.username,
    })
  },

  /**
   * Called once at app boot after the session has been read
   * from SecureStore (whether a session was found or not).
   * Until this is true, the root layout shows nothing —
   * this prevents a flash of the wrong screen.
   */
  setHydrated: () => {
    set({ isHydrated: true })
  },

  /**
   * Signs the user out fully:
   * 1. Calls Supabase to invalidate the server session
   * 2. Clears the token from SecureStore
   * 3. Resets all auth state in memory
   */
  signOut: async () => {
    await supabase.auth.signOut()
    set({
      session: null,
      user: null,
      profile: null,
      isAuthenticated: false,
      isOnboarded: false,
    })
  },
}))

// Selector helpers — import these in screens instead of
// destructuring the whole store. Keeps re-renders minimal.
export const selectUser = (s: AuthState) => s.user
export const selectProfile = (s: AuthState) => s.profile
export const selectIsAuthenticated = (s: AuthState) => s.isAuthenticated
export const selectIsOnboarded = (s: AuthState) => s.isOnboarded
export const selectIsHydrated = (s: AuthState) => s.isHydrated