import { supabase } from '@/api/client'
import { Session } from '@supabase/supabase-js'
import * as AppleAuthentication from 'expo-apple-authentication'

export interface AuthResult {
  session: Session
  isNewUser: boolean
}

export class AuthError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = 'AuthError'
  }
}

export async function sendPhoneOtp(phone: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({ phone })
  if (error) throw new AuthError(error.message, error.status?.toString())
}

export async function verifyPhoneOtp(
  phone: string,
  token: string
): Promise<AuthResult> {
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms',
  })
  if (error) throw new AuthError(error.message, error.status?.toString())
  if (!data.session) throw new AuthError('OTP verified but no session returned.')
  return { session: data.session, isNewUser: isNewUser(data.session) }
}

export async function signInWithApple(): Promise<AuthResult> {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  })

  if (!credential.identityToken) {
    throw new AuthError('Apple Sign-In failed: no identity token returned.')
  }

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
  })

  if (error) throw new AuthError(error.message, error.code)
  if (!data.session) throw new AuthError('Apple Sign-In succeeded but no session was returned.')

  return { session: data.session, isNewUser: isNewUser(data.session) }
}

function isNewUser(session: Session): boolean {
  const { created_at, last_sign_in_at } = session.user
  if (!created_at || !last_sign_in_at) return false
  return Math.abs(
    new Date(last_sign_in_at).getTime() - new Date(created_at).getTime()
  ) < 3000
}