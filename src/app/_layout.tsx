// app/_layout.tsx

import { supabase } from '@/api/client'
import { useAuthStore } from '@/store/auth.store'
import { Slot, router } from 'expo-router'
import { useEffect } from 'react'

export default function RootLayout() {
  const { setSession, setProfile, setHydrated, isHydrated } = useAuthStore()

  useEffect(() => {
    bootHydrate()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange)
    return () => subscription.unsubscribe()
  }, [])

  // ─── Boot hydration ─────────────────────────────────────────────────────────
  // Runs once on app start. Reads session from SecureStore, restores it into
  // Supabase and Zustand, fetches profile, then marks the app as hydrated.
  // Nothing renders until this completes — no flash of the wrong screen.

  async function bootHydrate() {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        setHydrated()
        router.replace('/(auth)/sign-in')
        return
      }

      setSession(session)

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle()

      setProfile(profile ?? null)
      setHydrated()

      if (!profile?.username) {
        router.replace('/(auth)/setup-profile')
      } else {
        router.replace('/(app)/(home)')
      }

    } catch (e) {
      console.error('[_layout] Boot hydration failed:', e)
      setHydrated()
      router.replace('/(auth)/sign-in')
    }
  }

  // ─── Auth state listener ────────────────────────────────────────────────────
  // Supabase fires this whenever the session changes — sign in, sign out,
  // or a background token refresh. We keep SecureStore and Zustand in sync.

  async function handleAuthChange(
    event: string,
    session: import('@supabase/supabase-js').Session | null
  ) {
    if (event === 'SIGNED_OUT') {
      setSession(null)
      setProfile(null)
      router.replace('/(auth)/sign-in')
      return
    }

    if (event === 'TOKEN_REFRESHED' && session) {
      setSession(session)
    }
  }

  // Render nothing until boot hydration is done.
  // This is what prevents any loading flash.
  if (!isHydrated) return null

  return <Slot />
}