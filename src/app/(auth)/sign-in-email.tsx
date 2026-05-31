import { AuthStepLayout } from '@/components/ui/AuthStepLayout'
import { BigInput } from '@/components/ui/BigInput'
import { Button } from '@/components/ui/Button'
import { router } from 'expo-router'
import { useState } from 'react'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function SignInEmailScreen() {
  const [email, setEmail] = useState('')
  const trimmed = email.trim()
  const isValid = EMAIL_RE.test(trimmed)

  function fontSizeForLength(len: number) {
    if (len <= 18) return 40
    if (len <= 26) return 32
    if (len <= 34) return 26
    return 20
  }

  function handleContinue() {
    if (!isValid) return
    router.push({ pathname: '/(auth)/sign-in-password', params: { email: trimmed } })
  }

  return (
    <AuthStepLayout
      heading="What's your email?"
      footer={
        <Button label="Continue" onPress={handleContinue} disabled={!isValid} />
      }
    >
      <BigInput
        placeholder="your@email.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        autoFocus
        returnKeyType="go"
        onSubmitEditing={handleContinue}
        style={{ fontSize: fontSizeForLength(trimmed.length) }}
      />
    </AuthStepLayout>
  )
}