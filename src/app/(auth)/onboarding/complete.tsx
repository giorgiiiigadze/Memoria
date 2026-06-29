import { supabase } from '@/api/client'
import { useAuthStore } from '@/store/auth.store'
import { colors, fontWeight, spacing } from '@/theme'
import { router } from 'expo-router'
import { SymbolView } from 'expo-symbols'
import { useEffect, useRef } from 'react'
import { Animated, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

async function generateUsername(displayName: string, userId: string): Promise<string> {
  const base = displayName.toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 25) || 'user'

  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', base)
    .neq('id', userId)
    .maybeSingle()

  if (!data) return base

  const suffix = Math.floor(Math.random() * 9000 + 1000).toString()
  return `${base.slice(0, 21)}_${suffix}`
}

export default function CompleteScreen() {
  const insets = useSafeAreaInsets()
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start()

    ensureProfile().then(() => {
      setTimeout(() => router.replace('/(app)/(tabs)/(home)'), 1400)
    })
  }, [])

  async function ensureProfile() {
    const store = useAuthStore.getState()
    const user = store.user
    if (!user) return
    if (store.profile?.display_name) return

    try {
      const displayName = store.onboardingName.trim() || store.profile?.display_name || 'You'
      const username = store.onboardingUsername.trim() || store.profile?.username || await generateUsername(displayName, user.id)

      const payload = {
        id: user.id,
        username,
        display_name: displayName,
        ...(store.onboardingPhone ? { phone: store.onboardingPhone } : user.phone ? { phone: user.phone } : {}),
        ...(store.onboardingAvatarUrl ? { avatar_url: store.onboardingAvatarUrl } : {}),
        ...(store.onboardingAge != null ? { age: store.onboardingAge } : {}),
      }

      const { data: profile, error: upsertErr } = await supabase
        .from('profiles')
        .upsert(payload)
        .select()
        .single()

      if (upsertErr) {
        if (upsertErr.code === '23505') {
          const fallback = `${username}_${Math.floor(Math.random() * 9000 + 1000)}`
          const { data: profile2, error: err2 } = await supabase
            .from('profiles')
            .upsert({ ...payload, username: fallback })
            .select()
            .single()
          if (!err2 && profile2) store.setProfile(profile2)
        }
      } else if (profile) {
        store.setProfile(profile)
      }
    } catch (e) {
      console.error('[onboarding/complete]', e)
    }
  }

  return (
    <View style={[s.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Animated.View style={[s.content, { opacity }]}>
        <View style={s.checkCircle}>
          <SymbolView name="checkmark" size={28} tintColor={colors.background} resizeMode="scaleAspectFit" />
        </View>
        <Text style={s.headline}>Profile created.</Text>
        <Text style={s.sub}>welcome to memoria</Text>
      </Animated.View>
    </View>
  )
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    gap: spacing[4],
  },
  checkCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  headline: {
    fontSize: 28,
    fontWeight: fontWeight.semiBold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  sub: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: fontWeight.regular,
  },
})
