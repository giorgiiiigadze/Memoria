import { supabase } from '@/api/client'
import { SocialButton } from '@/components/ui/SocialButton'
import { useAuthStore } from '@/store/auth.store'
import { colors, fontWeight, spacing } from '@/theme'
import { router } from 'expo-router'
import { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
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
  const user = useAuthStore(s => s.user)
  const existingProfile = useAuthStore(s => s.profile)
  const onboardingName = useAuthStore(s => s.onboardingName)
  const onboardingBirthday = useAuthStore(s => s.onboardingBirthday)
  const setProfile = useAuthStore(s => s.setProfile)
  const insets = useSafeAreaInsets()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLetsGo() {
    if (!user) return
    setLoading(true)
    setError(null)

    try {
      const displayName = onboardingName.trim() || existingProfile?.display_name || 'You'
      const username = existingProfile?.username ?? await generateUsername(displayName, user.id)

      const payload = {
        id: user.id,
        username,
        display_name: displayName,
        ...(onboardingBirthday ? { birthday: onboardingBirthday } : {}),
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
          if (err2) throw err2
          setProfile(profile2)
        } else {
          throw upsertErr
        }
      } else {
        setProfile(profile)
      }

      router.replace('/(app)/(tabs)/(home)')
    } catch (e) {
      console.error('[onboarding/complete]', e)
      setError('Something went wrong. Tap to try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={[s.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>

      <View style={s.illustrationArea}>
        {/* swap in your illustration here */}
      </View>

      <View style={s.textArea}>
        <Text style={s.headline}>
          {'welcome to memoria'}
        </Text>
        <Text style={s.subtitle}>
          time to capture moments that matter — together.
        </Text>
      </View>

      <View style={s.bottom}>
        {error ? <Text style={s.error}>{error}</Text> : null}
        <SocialButton
          label="let's go"
          onPress={handleLetsGo}
          loading={loading}
          style={s.fullWidth}
        />
      </View>

    </View>
  )
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing[2.5],
  },
  illustrationArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    marginTop: spacing[6],
    marginBottom: spacing[8],
  },
  textArea: {
    alignItems: 'center',
    gap: spacing[0],
    marginBottom: spacing[10],
  },
  headline: {
    fontSize: 34,
    fontWeight: fontWeight.semiBold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
    lineHeight: 38,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    fontWeight: fontWeight.regular,
    color: colors.white,
    textAlign: 'center',
    lineHeight: 22,
  },
  bottom: {
    gap: spacing[2],
    paddingBottom: spacing[2],
  },
  error: {
    fontSize: 13,
    color: colors.error,
    textAlign: 'center',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
})