import { supabase } from '@/api/client'
import { getMyDrops } from '@/api/drops.api'
import { getFriends, getIncomingRequests, getOutgoingRequests } from '@/api/friends.api'
import { useAuthStore } from '@/store/auth.store'
import { useDropsStore } from '@/store/drops.store'
import { useFriendsStore } from '@/store/friends.store'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Slot, router } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect } from 'react'
import { StyleSheet, Text, View } from 'react-native'

const ONBOARDING_KEY = '@memoria/onboarding_complete'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const { setSession, setProfile, setHydrated, setHasSeenOnboarding, isHydrated } = useAuthStore()

  useEffect(() => {
    if (isHydrated) SplashScreen.hideAsync()
  }, [isHydrated])

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

      const [{ data: profile }, seenOnboarding] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle(),
        AsyncStorage.getItem(ONBOARDING_KEY),
      ])

      const hasSeenOnboarding = seenOnboarding === 'true'
      setProfile(profile ?? null)
      setHasSeenOnboarding(hasSeenOnboarding)
      await prefetchInitialData(session.user.id)
      setHydrated()

      if (!profile?.username) {
        router.replace('/(auth)/setup-profile')
      } else if (!hasSeenOnboarding) {
        router.replace('/(onboarding)')
      } else {
        router.replace('/(app)/(home)')
      }

    } catch (e) {
      console.error('[_layout] Boot hydration failed:', e)
      setHydrated()
      router.replace('/(auth)/sign-in')
    }
  }

  // ─── Boot prefetch ──────────────────────────────────────────────────────────
  // Fires in parallel with setHydrated so data is ready before screens render.
  // Errors are swallowed — stores mark isLoaded=true regardless.

  async function prefetchInitialData(userId: string) {
    try {
      const [drops, friends, incoming, outgoing] = await Promise.all([
        getMyDrops(),
        getFriends(userId),
        getIncomingRequests(userId),
        getOutgoingRequests(userId),
      ])
      useDropsStore.getState().setDrops(drops)
      useFriendsStore.getState().setFriends(friends)
      useFriendsStore.getState().setIncoming(incoming)
      useFriendsStore.getState().setOutgoing(outgoing)
    } catch (e) {
      console.error('[prefetch]', e)
    } finally {
      useDropsStore.getState().setIsLoaded(true)
      useFriendsStore.getState().setIsLoaded(true)
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

  if (!isHydrated) {
    return (
      <View style={styles.splash}>
        <Text style={styles.splashText}>Memoria</Text>
      </View>
    )
  }

  return <Slot />
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '600',
    letterSpacing: 2,
  },
})