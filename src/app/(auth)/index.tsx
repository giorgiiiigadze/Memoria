import { supabase } from '@/api/client'
import { useAuthStore } from '@/store/auth.store'
import { colors, fontSize, fontWeight, radii, spacing } from '@/theme'
import { AntDesign } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useState } from 'react'
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

const { width: SW, height: SH } = Dimensions.get('window')
const BLOB_SIZE = SW * 1.25

export default function LandingScreen() {
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ─── REAL Apple Sign-In (re-enable when testing on device) ───────────────
  // async function handleAppleSignIn() {
  //   if (!agreed) { setError('Please agree to the terms to continue.'); return }
  //   try {
  //     setLoading(true); setError(null)
  //     const credential = await AppleAuthentication.signInAsync({
  //       requestedScopes: [
  //         AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
  //         AppleAuthentication.AppleAuthenticationScope.EMAIL,
  //       ],
  //     })
  //     const { data, error: authError } = await supabase.auth.signInWithIdToken({
  //       provider: 'apple',
  //       token: credential.identityToken!,
  //     })
  //     if (authError || !data.session) { setError('Sign-in failed. Please try again.'); return }
  //     const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.session.user.id).maybeSingle()
  //     useAuthStore.getState().setSession(data.session)
  //     useAuthStore.getState().setProfile(profile ?? null)
  //     router.replace(profile?.display_name ? '/(app)/(tabs)/(home)' : '/(auth)/success')
  //   } catch (e: any) {
  //     if (e?.code !== 'ERR_REQUEST_CANCELED') setError('Sign-in failed. Please try again.')
  //   } finally {
  //     setLoading(false)
  //   }
  // }
  // ─────────────────────────────────────────────────────────────────────────

  async function handleDevSignIn() {
    if (!agreed) { setError('Please agree to the terms to continue.'); return }
    try {
      setLoading(true)
      setError(null)
      const { data, error: e } = await supabase.auth.signInWithPassword({
        email: 'salo@gmail.com',
        password: 'salosalo',
      })
      if (e || !data.session) { setError('Dev sign-in failed'); return }
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.session.user.id)
        .maybeSingle()
      useAuthStore.getState().setSession(data.session)
      useAuthStore.getState().setProfile(profile ?? null)
      router.replace(profile?.display_name ? '/(app)/(tabs)/(home)' : '/(auth)/success')
    } catch {
      setError('Dev sign-in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={s.root}>

      <View style={s.content}>
        <View style={s.dots}>
          <View style={[s.dot, s.dotActive]} />
          <View style={s.dot} />
          <View style={s.dot} />
        </View>

        <Text style={s.headline}>
          <Text style={s.headlineEmber}>capture</Text>
          <Text style={s.headlineBase}> and{'\n'}relive </Text>
          <Text style={s.headlinePrimary}>together</Text>
        </Text>

        <TouchableOpacity
          style={s.tosRow}
          onPress={() => { setAgreed(v => !v); setError(null) }}
          activeOpacity={0.7}
        >
          <View style={[s.checkbox, agreed && s.checkboxOn]}>
            {agreed && <Text style={s.checkmark}>✓</Text>}
          </View>
          <Text style={s.tosText}>
            I agree to the <Text style={s.tosLink}>Terms of Service</Text>
            {' '}and <Text style={s.tosLink}>Privacy Policy</Text>
          </Text>
        </TouchableOpacity>

        {error ? <Text style={s.error}>{error}</Text> : null}

        {/* ─── REAL button — uncomment when on device ─────────────────────
        <TouchableOpacity
          style={[s.appleBtn, (!agreed || loading) && s.btnDimmed]}
          onPress={handleAppleSignIn}
          disabled={!agreed || loading}
          activeOpacity={0.88}
        >
          <AntDesign name="apple" size={18} color={colors.ink} />
          <Text style={s.appleBtnLabel}>
            {loading ? 'Signing in…' : 'Continue with Apple'}
          </Text>
        </TouchableOpacity>
        ──────────────────────────────────────────────────────────────────── */}

        {/* DEV sign-in — only in development builds */}
        {__DEV__ && (
          <TouchableOpacity
            style={[s.appleBtn, (!agreed || loading) && s.btnDimmed]}
            onPress={handleDevSignIn}
            disabled={!agreed || loading}
            activeOpacity={0.88}
          >
            <AntDesign name="lock" size={18} color={colors.ink} />
            <Text style={s.appleBtnLabel}>
              {loading ? 'Signing in…' : 'Dev Sign In'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing[2.5],
    paddingBottom: spacing[12],
    paddingTop: spacing[4],
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: spacing[5],
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.borderDefault,
  },
  dotActive: {
    width: 22,
    borderRadius: 3,
    backgroundColor: colors.textPrimary,
  },
  headline: {
    fontSize: 38,
    lineHeight: 46,
    letterSpacing: -1,
    marginBottom: spacing[6],
  },
  headlineBase: {
    color: colors.textPrimary,
    fontWeight: fontWeight.semiBold,
  },
  headlineEmber: {
    color: colors.ember,
    fontWeight: fontWeight.semiBold,
  },
  headlinePrimary: {
    color: colors.primary,
    fontWeight: fontWeight.semiBold,
  },
  tosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.borderDefault,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    fontSize: 11,
    color: colors.white,
    fontWeight: fontWeight.bold,
  },
  tosText: {
    flex: 1,
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    lineHeight: 18,
  },
  tosLink: {
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
  error: {
    fontSize: fontSize.xs,
    color: colors.error,
    marginBottom: spacing[3],
  },
  appleBtn: {
    backgroundColor: colors.white,
    borderRadius: radii.full,
    paddingVertical: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
  },
  btnDimmed: {
    opacity: 0.4,
  },
  appleBtnLabel: {
    fontSize: 15,
    fontWeight: fontWeight.semiBold,
    color: colors.ink,
  },
})