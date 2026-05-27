// src/lib/auth/session.ts

import * as SecureStore from 'expo-secure-store'

/**
 * A storage adapter that Supabase's client uses internally.
 * Plug this into createClient() so Supabase handles its own
 * token refreshes using SecureStore instead of localStorage.
 *
 * Usage: createClient(url, key, { auth: { storage: supabaseStorageAdapter } })
 */
export const supabaseStorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(key)
    } catch {
      return null
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(key, value)
    } catch (error) {
      console.error('[session] Storage adapter setItem failed:', error)
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(key)
    } catch (error) {
      console.error('[session] Storage adapter removeItem failed:', error)
    }
  },
}