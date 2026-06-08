import { supabase } from '@/api/client'
import { useAuthStore } from '@/store/auth.store'
import { colors, fontWeight, radii, spacing } from '@/theme'
import { router } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

type StarPos = { top: string; left?: string; right?: string; size: number }

const STARS: StarPos[] = [
  { top: '10%', left: '6%', size: 16 },
  { top: '6%', right: '12%', size: 11 },
  { top: '22%', right: '6%', size: 20 },
  { top: '16%', left: '20%', size: 9 },
  { top: '38%', left: '4%', size: 13 },
  { top: '32%', right: '20%', size: 8 },
  { top: '48%', right: '10%', size: 15 },
  { top: '55%', left: '14%', size: 10 },
]

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
  const onboardingName = useAuthStore(s => s.onboardingName)
  const setProfile = useAuthStore(s => s.setProfile)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLetsGo() {
    if (!user) return
    setLoading(true)
    setError(null)

    try {
      const displayName = onboardingName.trim() || 'You'
      const username = await generateUsername(displayName, user.id)

      const { data: profile, error: upsertErr } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username,
          display_name: displayName,
        })
        .select()
        .single()

      if (upsertErr) {
        if (upsertErr.code === '23505') {
          const fallback = `${username}_${Math.floor(Math.random() * 9000 + 1000)}`
          const { data: profile2, error: err2 } = await supabase
            .from('profiles')
            .upsert({ id: user.id, username: fallback, display_name: displayName })
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
    <View style={s.root}>
      {/* Scattered stars */}
      {STARS.map(({ size, ...pos }, i) => (
        <Text key={i} style={[s.star, { fontSize: size, ...pos }]}>✦</Text>
      ))}

      <View style={s.body}>
        {/* Check blob */}
        <View style={s.checkCircle}>
          <Text style={s.checkMark}>✓</Text>
        </View>

        <Text style={s.welcomeLabel}>welcome to</Text>
        <Text style={s.appName}>memoria</Text>

        {error ? <Text style={s.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[s.btn, loading && s.btnLoading]}
          onPress={handleLetsGo}
          disabled={loading}
          activeOpacity={0.88}
        >
          {loading
            ? <ActivityIndicator color={colors.white} size="small" />
            : <Text style={s.btnLabel}>let's go →</Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  star: {
    position: 'absolute',
    color: colors.ember,
    fontWeight: fontWeight.bold,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
  },
  checkCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[8],
  },
  checkMark: {
    fontSize: 44,
    color: colors.white,
    fontWeight: fontWeight.bold,
    lineHeight: 52,
  },
  welcomeLabel: {
    fontSize: 18,
    color: colors.textMuted,
    fontWeight: fontWeight.regular,
    marginBottom: 4,
  },
  appName: {
    fontSize: 52,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    letterSpacing: -2,
    marginBottom: spacing[10],
  },
  error: {
    fontSize: 13,
    color: colors.error,
    marginBottom: spacing[4],
    textAlign: 'center',
  },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: radii.full,
    paddingVertical: 17,
    paddingHorizontal: spacing[10],
    alignItems: 'center',
    minWidth: 180,
  },
  btnLoading: {
    opacity: 0.7,
  },
  btnLabel: {
    fontSize: 16,
    fontWeight: fontWeight.semiBold,
    color: colors.white,
  },
})
