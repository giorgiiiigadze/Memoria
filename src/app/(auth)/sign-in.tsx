import { supabase } from '@/api/client'
import { useAuthStore } from '@/store/auth.store'
import type { Profile } from '@/types/database.types'
import { Session } from '@supabase/supabase-js'
import { router } from 'expo-router'
import { useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

export default function SignInScreen() {
  const { setSession, setProfile } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  function clearMessages() {
    if (error) setError(null)
    if (info) setInfo(null)
  }

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
      const { data, error: sbError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (sbError) {
        setError(sbError.message)
        return
      }

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
      const { data, error: sbError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      })

      if (sbError) {
        setError(sbError.message)
        return
      }

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

  const disabled = loading || !email.trim() || !password

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>

        <View style={styles.header}>
          <Text style={styles.wordmark}>memoria</Text>
          <Text style={styles.subtitle}>Sign in or create an account.</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#898989"
            value={email}
            onChangeText={(v) => { setEmail(v); clearMessages() }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#898989"
            value={password}
            onChangeText={(v) => { setPassword(v); clearMessages() }}
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleSignIn}
          />

          {error && <Text style={styles.error}>{error}</Text>}
          {info && <Text style={styles.info}>{info}</Text>}

          <TouchableOpacity
            style={[styles.btnPrimary, disabled && styles.btnDisabled]}
            onPress={handleSignIn}
            disabled={disabled}
            activeOpacity={0.8}
          >
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.btnPrimaryLabel}>Sign in</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btnGhost, disabled && styles.btnDisabled]}
            onPress={handleSignUp}
            disabled={disabled}
            activeOpacity={0.8}
          >
            <Text style={styles.btnGhostLabel}>Create account</Text>
          </TouchableOpacity>
        </View>

      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
  },
  wordmark: {
    fontSize: 32,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -1,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#898989',
  },
  form: {
    gap: 10,
  },
  input: {
    backgroundColor: '#191919',
    borderWidth: 0.5,
    borderColor: '#3B3B3B',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#FFFFFF',
  },
  error: {
    fontSize: 13,
    color: '#EA4942',
    paddingHorizontal: 2,
  },
  info: {
    fontSize: 13,
    color: '#4CAF7D',
    paddingHorizontal: 2,
  },
  btnPrimary: {
    backgroundColor: '#0044FF',
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 4,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnPrimaryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  btnGhost: {
    borderWidth: 0.5,
    borderColor: '#3B3B3B',
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: 'center',
  },
  btnGhostLabel: {
    fontSize: 14,
    color: '#C4C4C4',
  },
})