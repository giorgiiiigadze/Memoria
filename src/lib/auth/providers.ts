// src/lib/auth/providers.ts
// NOTE: Social auth (Apple, Google) stubbed until client IDs are ready.
// Only phone OTP is active.

import { supabase } from '@/api/client'
import { Session } from '@supabase/supabase-js'

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

// ─── Phone OTP ───────────────────────────────────────────────────────────────

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

// ─── Stubs ───────────────────────────────────────────────────────────────────

export async function signInWithApple(): Promise<AuthResult> {
  throw new AuthError('Apple sign-in not configured yet.', 'NOT_CONFIGURED')
}

export function useGoogleAuthRequest() {
  return [null, null, async () => {}] as const
}

export async function handleGoogleResponse(): Promise<AuthResult | null> {
  throw new AuthError('Google sign-in not configured yet.', 'NOT_CONFIGURED')
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isNewUser(session: Session): boolean {
  const { created_at, last_sign_in_at } = session.user
  if (!created_at || !last_sign_in_at) return false
  return Math.abs(
    new Date(last_sign_in_at).getTime() - new Date(created_at).getTime()
  ) < 3000
}