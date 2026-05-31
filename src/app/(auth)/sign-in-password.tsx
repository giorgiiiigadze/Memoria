import { supabase } from '@/api/client'
import { AuthStepLayout } from '@/components/ui/AuthStepLayout'
import { BigInput } from '@/components/ui/BigInput'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/auth.store'
import { Session } from '@supabase/supabase-js'
import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { StyleSheet, Text } from 'react-native'

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
    <AuthStepLayout
      heading={`Hi ${email.split('@')[0]}, what's your password?`}
      footer={
        <>
          <Button
            label="Sign in"
            onPress={handleSignIn}
            disabled={!hasValue}
            loading={loading}
          />
          <Button
            label="Create account"
            onPress={handleSignUp}
            variant="secondary"
            disabled={!hasValue || loading}
          />
        </>
      }
    >
      <BigInput
        placeholder="••••••••"
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
        style={styles.passwordInput}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      {info && <Text style={styles.info}>{info}</Text>}
    </AuthStepLayout>
  )
}

const styles = StyleSheet.create({
  passwordInput: {
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
})
