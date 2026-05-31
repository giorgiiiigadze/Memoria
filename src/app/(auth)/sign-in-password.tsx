import { supabase } from '@/api/client'
import { AuthStepLayout } from '@/components/ui/AuthStepLayout'
import { BigInput } from '@/components/ui/BigInput'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/auth.store'
import { Session } from '@supabase/supabase-js'
import { Redirect, router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { StyleSheet, Text } from 'react-native'

const MIN_PASSWORD_LENGTH = 6

export default function SignInPasswordScreen() {
  const { email } = useLocalSearchParams<{ email: string }>()
  const { setSession, setProfile } = useAuthStore()

  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  // Guard: never render this step without an email to authenticate.
  if (!email) {
    return <Redirect href="/(auth)/sign-in-email" />
  }

  const firstName = email.split('@')[0]
  const isValid = password.length >= MIN_PASSWORD_LENGTH

  async function handlePostAuth(session: Session, isNewUser: boolean) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle()

    // If we can't read the profile, don't silently shove the user into
    // onboarding — surface it and let them retry.
    if (profileError) {
      setError('Could not load your profile. Please try again.')
      return
    }

    setProfile(profile ?? null)

    if (isNewUser || !profile?.username) {
      router.replace('/(auth)/setup-profile')
    } else {
      router.replace('/(app)/(home)')
    }
  }

  // Single entry point: try to sign in, and if the account doesn't exist yet,
  // create it. This means the user never has to know whether they're new.
  async function handleContinue() {
    if (!isValid || loading) return

    setLoading(true)
    setError(null)
    setInfo(null)

    try {
      // 1. Attempt sign-in for returning users.
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({ email, password })

      if (!signInError && signInData.session) {
        setSession(signInData.session)
        await handlePostAuth(signInData.session, false)
        return
      }

      // 2. Sign-in failed. Try to create the account.
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({ email, password })

      if (signUpError) {
        setError(signUpError.message)
        return
      }

      // Supabase returns an empty identities array when the email is already
      // registered — so a failed sign-in + existing account = wrong password.
      if (signUpData.user?.identities?.length === 0) {
        setError('Incorrect password. Please try again.')
        return
      }

      // New account, but email confirmation is required (no session yet).
      if (!signUpData.session) {
        setInfo('Account created! Check your email to confirm, then come back to sign in.')
        return
      }

      // New account with an active session.
      setSession(signUpData.session)
      await handlePostAuth(signUpData.session, true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthStepLayout
      heading={`Hi ${firstName}, set your password`}
      footer={
        <Button
          label="Continue"
          onPress={handleContinue}
          disabled={!isValid}
          loading={loading}
        />
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
        onSubmitEditing={handleContinue}
        style={styles.passwordInput}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      {info && <Text style={styles.info}>{info}</Text>}
      {!error && !info && password.length > 0 && !isValid && (
        <Text style={styles.hint}>At least {MIN_PASSWORD_LENGTH} characters</Text>
      )}
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
  hint: {
    marginTop: 16,
    fontSize: 13,
    color: '#555555',
    textAlign: 'center',
  },
})