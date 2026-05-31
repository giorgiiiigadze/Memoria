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

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <TouchableOpacity style={styles.back} onPress={() => router.back()} hitSlop={12}>
        <AntDesign name="left" size={20} color="#FFFFFF" />
      </TouchableOpacity>

      <View style={styles.body}>
        <View style={styles.top}>
          <Text style={styles.heading}>Enter your password</Text>
          <Text style={styles.emailHint}>{email}</Text>

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#3B3B3B"
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
            style={[styles.primaryBtn, (!hasValue || loading) && styles.primaryBtnInactive]}
            onPress={handleSignIn}
            disabled={!hasValue || loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#555555" size="small" />
              : <Text style={[styles.primaryBtnLabel, (!hasValue || loading) && styles.primaryBtnLabelInactive]}>
                  Sign in
                </Text>
            }
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryBtn, (!hasValue || loading) && styles.secondaryBtnInactive]}
            onPress={handleSignUp}
            disabled={!hasValue || loading}
            activeOpacity={0.85}
          >
            <Text style={[styles.secondaryBtnLabel, (!hasValue || loading) && styles.secondaryBtnLabelInactive]}>
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
    paddingHorizontal: 24,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  top: {
    marginTop: 32,
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
    marginBottom: 28,
  },
  input: {
    fontSize: 28,
    fontWeight: '500',
    color: '#FFFFFF',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#3B3B3B',
  },
  error: {
    marginTop: 12,
    fontSize: 13,
    color: '#EA4942',
  },
  info: {
    marginTop: 12,
    fontSize: 13,
    color: '#4CAF7D',
  },
  footer: {
    gap: 10,
  },
  primaryBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  primaryBtnInactive: {
    backgroundColor: '#1C1C1C',
  },
  primaryBtnLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0A0A0A',
  },
  primaryBtnLabelInactive: {
    color: '#3B3B3B',
  },
  secondaryBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#626262',
  },
  secondaryBtnInactive: {
    borderColor: '#2A2A2A',
  },
  secondaryBtnLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryBtnLabelInactive: {
    color: '#3B3B3B',
  },
})
