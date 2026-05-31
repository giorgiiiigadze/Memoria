import { supabase } from '@/api/client'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/auth.store'
import { AntDesign } from '@expo/vector-icons'
import { Session } from '@supabase/supabase-js'
import { router } from 'expo-router'
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
      const { data, error: sbError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      })
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

  // TODO: implement Google OAuth via supabase.auth.signInWithOAuth
  async function handleGoogleSignIn() {
    console.log('Google sign-in — TODO')
  }

  // TODO: implement Apple OAuth via supabase.auth.signInWithIdToken + expo-apple-authentication
  async function handleAppleSignIn() {
    console.log('Apple sign-in — TODO')
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

          <Button
            label="Sign in"
            onPress={handleSignIn}
            disabled={disabled}
            loading={loading}
            style={styles.signInBtn}
          />

          <Button
            label="Create account"
            onPress={handleSignUp}
            variant="secondary"
            disabled={disabled}
          />
        </View>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Social auth */}
        <View style={styles.social}>
          <TouchableOpacity
            style={[styles.btnSocial, loading && styles.btnDisabled]}
            onPress={handleAppleSignIn}
            disabled={loading}
            activeOpacity={0.8}
          >
            <AntDesign size={16} color="#FFFFFF" />
            <Text style={styles.btnSocialLabel}>Continue with Apple</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btnSocial, loading && styles.btnDisabled]}
            onPress={handleGoogleSignIn}
            disabled={loading}
            activeOpacity={0.8}
          >
            <AntDesign name="google" size={15} color="#FFFFFF" />
            <Text style={styles.btnSocialLabel}>Continue with Google</Text>
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
  signInBtn: {
    marginTop: 4,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 0.5,
    backgroundColor: '#3B3B3B',
  },
  dividerText: {
    fontSize: 12,
    color: '#626262',
  },
  social: {
    gap: 10,
  },
  btnSocial: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 0.5,
    borderColor: '#3B3B3B',
    borderRadius: 8,
    paddingVertical: 13,
    backgroundColor: '#191919',
  },
  btnSocialLabel: {
    fontSize: 14,
    color: '#C4C4C4',
  },
})