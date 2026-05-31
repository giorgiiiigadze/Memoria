import { supabase } from '@/api/client'
import { useAuthStore } from '@/store/auth.store'
import { AntDesign } from '@expo/vector-icons'
import { Session } from '@supabase/supabase-js'
import { router, useLocalSearchParams } from 'expo-router'
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

  const hasValue = password.length > 0
  const disabled = !hasValue || loading

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableOpacity style={styles.back} onPress={() => router.back()} hitSlop={12}>
        <AntDesign name="left" size={20} color="#FFFFFF" />
      </TouchableOpacity>

      <View style={styles.body}>
        <View style={styles.top}>
          <Text style={styles.wordmark}>memoria.</Text>
          <Text style={styles.heading}>
            Hi {email.split('@')[0]}, what's your password?
          </Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#444444"
            value={password}
            onChangeText={(v) => {
              setPassword(v)
              if (error) setError(null)
              if (info) setInfo(null)
            }}
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
            style={[styles.primaryBtn, !disabled && styles.primaryBtnActive]}
            onPress={handleSignIn}
            disabled={disabled}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#555555" size="small" />
              : <Text style={[styles.primaryBtnLabel, !disabled && styles.primaryBtnLabelActive]}>Sign in</Text>
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
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  back: {
    marginTop: 56,
    marginLeft: 24,
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
    justifyContent: 'space-between',
  },
  top: {
    marginTop: 24,
    alignItems: 'center',
  },
  wordmark: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 32,
  },
  heading: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  input: {
    fontSize: 42,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    width: '100%',
    paddingVertical: 4,
    letterSpacing: 4,
  },
  error: {
    marginTop: 16,
    fontSize: 13,
    color: '#EA4942',
    textAlign: 'center',
  },
  info: {
    marginTop: 16,
    fontSize: 13,
    color: '#4CAF7D',
    textAlign: 'center',
  },
  footer: {
    gap: 10,
  },
  primaryBtn: {
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#2C2C2C',
  },
  primaryBtnActive: {
    backgroundColor: '#FFFFFF',
  },
  primaryBtnLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#7A7A7A',
  },
  primaryBtnLabelActive: {
    color: '#000000',
  },
  secondaryBtn: {
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  secondaryBtnDisabled: {
    borderColor: '#2C2C2C',
  },
  secondaryBtnLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryBtnLabelDisabled: {
    color: '#3B3B3B',
  },
})
