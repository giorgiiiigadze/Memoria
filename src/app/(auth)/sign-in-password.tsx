import { supabase } from '@/api/client'
import { useAuthStore } from '@/store/auth.store'
import { AntDesign } from '@expo/vector-icons'
import { Session } from '@supabase/supabase-js'
import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

export default function SignInPasswordScreen() {
  const { email } = useLocalSearchParams<{ email: string }>()
  const { setSession, setProfile } = useAuthStore()

  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  async function handlePostAuth(session: Session, isNewUser: boolean) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle()

    setProfile(profile ?? null)

    if (isNewUser || !profile?.username) {
      router.replace('/(auth)/setup-profile')
    } else {
      router.replace('/(app)/(home)')
    }
  }

  async function handleSignIn() {
    setLoading(true)
    setError(null)
    setInfo(null)
    try {
      const { data, error: sbError } = await supabase.auth.signInWithPassword({ email, password })
      if (sbError) { setError(sbError.message); return }
      setSession(data.session)
      await handlePostAuth(data.session, false)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSignUp() {
    setLoading(true)
    setError(null)
    setInfo(null)
    try {
      const { data, error: sbError } = await supabase.auth.signUp({ email, password })
      if (sbError) { setError(sbError.message); return }
      if (!data.session) {
        if (data.user?.identities?.length === 0) {
          setError('An account with this email already exists. Try signing in instead.')
          return
        }
        setInfo('Account created! Check your email to confirm, then sign in.')
        return
      }
      setSession(data.session)
      await handlePostAuth(data.session, true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const disabled = loading || !password

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableOpacity style={styles.back} onPress={() => router.back()} hitSlop={12}>
        <AntDesign name="left" size={20} color="#FFFFFF" />
      </TouchableOpacity>

      <View style={styles.inner}>
        <Text style={styles.heading}>Enter your password</Text>
        <Text style={styles.emailHint}>{email}</Text>

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#898989"
          value={password}
          onChangeText={(v) => { setPassword(v); if (error) setError(null); if (info) setInfo(null) }}
          secureTextEntry
          autoFocus
          returnKeyType="go"
          onSubmitEditing={handleSignIn}
        />

        {error && <Text style={styles.error}>{error}</Text>}
        {info && <Text style={styles.info}>{info}</Text>}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.primaryBtn, disabled && styles.primaryBtnDisabled]}
          onPress={handleSignIn}
          disabled={disabled}
          activeOpacity={0.85}
        >
          {loading
            ? null
            : <Text style={[styles.primaryBtnLabel, disabled && styles.primaryBtnLabelDisabled]}>Sign in</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryBtn, disabled && styles.secondaryBtnDisabled]}
          onPress={handleSignUp}
          disabled={disabled}
          activeOpacity={0.85}
        >
          <Text style={[styles.secondaryBtnLabel, disabled && styles.secondaryBtnLabelDisabled]}>
            Create account
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  back: {
    marginTop: 56,
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 80,
  },
  heading: {
    fontSize: 26,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  emailHint: {
    fontSize: 14,
    color: '#626262',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#191919',
    borderWidth: 0.5,
    borderColor: '#3B3B3B',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#FFFFFF',
  },
  error: {
    marginTop: 8,
    fontSize: 13,
    color: '#EA4942',
    paddingHorizontal: 2,
  },
  info: {
    marginTop: 8,
    fontSize: 13,
    color: '#4CAF7D',
    paddingHorizontal: 2,
  },
  footer: {
    gap: 10,
  },
  primaryBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnDisabled: {
    backgroundColor: '#2A2A2A',
  },
  primaryBtnLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0A0A0A',
  },
  primaryBtnLabelDisabled: {
    color: '#555555',
  },
  secondaryBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#626262',
  },
  secondaryBtnDisabled: {
    borderColor: '#2A2A2A',
  },
  secondaryBtnLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryBtnLabelDisabled: {
    color: '#555555',
  },
})
