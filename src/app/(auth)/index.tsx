import { supabase } from '@/api/client'
import { AuthButton } from '@/components/ui/AuthButton'
import { useAuthStore } from '@/store/auth.store'
import { colors, fontWeight, radii, spacing } from '@/theme'
import { router } from 'expo-router'
import { SymbolView } from 'expo-symbols'
import { useState } from 'react'
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'

export default function LandingScreen() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function switchMode(next: 'signin' | 'signup') {
    setMode(next)
    setError(null)
  }

  async function handleSignIn() {
    if (!agreed) { setError('Please agree to the terms to continue.'); return }
    if (!email.trim() || !password) { setError('Enter your email and password.'); return }
    try {
      setLoading(true)
      setError(null)
      const { data, error: e } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (e || !data.session) { setError(e?.message ?? 'Sign-in failed'); return }
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.session.user.id)
        .maybeSingle()
      useAuthStore.getState().setSession(data.session)
      useAuthStore.getState().setProfile(profile ?? null)
      router.replace(profile?.display_name ? '/(app)/(tabs)/(home)' : '/(auth)/onboarding')
    } catch {
      setError('Sign-in failed. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSignUp() {
    if (!agreed) { setError('Please agree to the terms to continue.'); return }
    if (!email.trim() || !password) { setError('Enter your email and password.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    try {
      setLoading(true)
      setError(null)
      const { data, error: e } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      })
      if (e) { setError(e.message); return }
      if (data.session) {
        useAuthStore.getState().setSession(data.session)
        router.replace('/(auth)/onboarding')
      } else {
        setError('Check your email to confirm your account.')
      }
    } catch {
      setError('Sign-up failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const isSignIn = mode === 'signin'

  return (
    <>
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={s.content}>

        <View style={s.toggle}>
          <TouchableOpacity
            style={[s.toggleBtn, isSignIn && s.toggleBtnActive]}
            onPress={() => switchMode('signin')}
            activeOpacity={0.7}
          >
            <Text style={[s.toggleLabel, isSignIn && s.toggleLabelActive]}>Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.toggleBtn, !isSignIn && s.toggleBtnActive]}
            onPress={() => switchMode('signup')}
            activeOpacity={0.7}
          >
            <Text style={[s.toggleLabel, !isSignIn && s.toggleLabelActive]}>Sign Up</Text>
          </TouchableOpacity>
        </View>

        <View style={s.form}>
          <TextInput
            style={s.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor={colors.textTertiary}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            editable={!loading}
          />
          <TextInput
            style={s.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor={colors.textTertiary}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            textContentType={isSignIn ? 'password' : 'newPassword'}
            returnKeyType="done"
            onSubmitEditing={isSignIn ? handleSignIn : handleSignUp}
            editable={!loading}
          />
        </View>

        <View style={s.tosRow}>
          <TouchableOpacity
            onPress={() => { setAgreed(v => !v); setError(null) }}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <View style={[s.checkbox, agreed && s.checkboxOn]}>
              {agreed && (
                <SymbolView
                  name="checkmark"
                  size={14}
                  tintColor={colors.ink}
                  weight="semibold"
                  resizeMode="scaleAspectFit"
                />
              )}
            </View>
          </TouchableOpacity>
          <Text style={s.tosText}>
            I agree to the Terms of Service
            {' '}and Privacy Policy to continue
          </Text>
        </View>

        {error ? <Text style={s.error}>{error}</Text> : null}

        <AuthButton
          label={loading ? (isSignIn ? 'Signing in…' : 'Signing up…') : (isSignIn ? 'Sign In' : 'Sign Up')}
          onPress={isSignIn ? handleSignIn : handleSignUp}
          disabled={!agreed || loading}
          loading={loading}
          style={s.fullWidth}
        />
      </View>
    </KeyboardAvoidingView>
    </>
  )
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[8],
    paddingTop: spacing[5],
    gap: spacing[4],
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  toggle: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    padding: 3,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: spacing[2],
    alignItems: 'center',
    borderRadius: radii.sm - 2,
  },
  toggleBtnActive: {
    backgroundColor: colors.surfaceRaised,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: fontWeight.medium,
    color: colors.textTertiary,
  },
  toggleLabelActive: {
    color: colors.white,
  },
  form: {
    gap: spacing[3],
    alignSelf: 'stretch',
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 0.5,
    borderColor: colors.borderDefault,
    borderRadius: radii.sm,
    paddingHorizontal: spacing[4],
    paddingVertical: 13,
    fontSize: 15,
    color: colors.white,
  },
  tosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
    alignSelf: 'stretch',
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.borderDefault,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: {
    backgroundColor: colors.white,
    borderColor: colors.white,
  },
  tosText: {
    color: colors.white,
    lineHeight: 18,
    maxWidth: 300,
  },
  error: {
    fontSize: 12,
    color: colors.error,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
})
