import { supabase } from '@/api/client'
import { getMyDrops } from '@/api/drops.api'
import { getFriends, getIncomingRequests, getOutgoingRequests } from '@/api/friends.api'
import { subscribeToNotifications, subscribeToUserDrops } from '@/api/realtime'
import { SplashView } from '@/components/ui/SplashView'
import { ONBOARDING_KEY } from '@/lib/onboarding'
import { useAuthStore } from '@/store/auth.store'
import { useDropsStore } from '@/store/drops.store'
import { useFriendsStore } from '@/store/friends.store'
import { colors } from '@/theme'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Slot, router } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect, useRef } from 'react'
import { LogBox, StyleSheet } from 'react-native'

LogBox.ignoreLogs(['Sending `websocketMessage` with no listeners registered.'])
import { GestureHandlerRootView } from 'react-native-gesture-handler'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const { setSession, setProfile, setHydrated, isHydrated } = useAuthStore()
  const realtimeCleanup = useRef<Array<() => void>>([])

  useEffect(() => {
    if (isHydrated) SplashScreen.hideAsync()
  }, [isHydrated])

  useEffect(() => {
    bootHydrate()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange)
    return () => {
      subscription.unsubscribe()
      realtimeCleanup.current.forEach(fn => fn())
      realtimeCleanup.current = []
    }
  }, [])

  // ─── Boot hydration ─────────────────────────────────────────────────────────
  // Runs once on app start. Reads session from SecureStore, restores it into
  // Supabase and Zustand, fetches profile, then marks the app as hydrated.
  // Nothing renders until this completes — no flash of the wrong screen.

  async function bootHydrate() {
    try {
      const [{ data: { session } }, tutorialDone] = await Promise.all([
        supabase.auth.getSession(),
        AsyncStorage.getItem(ONBOARDING_KEY),
      ])

      // First launch — show the app tutorial before anything else
      if (!tutorialDone) {
        setHydrated()
        router.replace('/(onboarding)')
        return
      }

      if (!session) {
        setHydrated()
        router.replace('/(auth)')
        return
      }

      setSession(session)

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle()

      setProfile(profile ?? null)
      await prefetchInitialData(session.user.id)
      setHydrated()

      realtimeCleanup.current = [
        subscribeToUserDrops(session.user.id),
        subscribeToNotifications(session.user.id),
      ]

      if (!profile?.display_name) {
        router.replace('/(auth)/onboarding')
      } else {
        router.replace('/(app)/(tabs)/(home)')
      }

    } catch (e) {
      console.error('[_layout] Boot hydration failed:', e)
      setHydrated()
      router.replace('/(auth)')
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
      realtimeCleanup.current.forEach(fn => fn())
      realtimeCleanup.current = []
      setSession(null)
      setProfile(null)
      router.replace('/(auth)')
      return
    }

    if (event === 'TOKEN_REFRESHED' && session) {
      setSession(session)
    }
  }

  if (!isHydrated) return <SplashView />

  return (
    <GestureHandlerRootView style={styles.root}>
      <Slot />
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
})