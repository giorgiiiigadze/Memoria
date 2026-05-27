// src/api/client.ts

import { createClient } from '@supabase/supabase-js'
import { supabaseStorageAdapter } from "../lib/auth/sessions"

import { Database } from '@/types/database.types'

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing Supabase env vars. Check EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env'
  )
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // Use SecureStore instead of localStorage (which doesn't exist in React Native)
    storage: supabaseStorageAdapter,
    // Automatically refresh the token before it expires
    autoRefreshToken: true,
    // Persist the session across app restarts
    persistSession: true,
    // Don't try to detect session from URL (not relevant in RN)
    detectSessionInUrl: false,
  },
})