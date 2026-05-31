import { AuthStepLayout } from '@/components/ui/AuthStepLayout'
import { BigInput } from '@/components/ui/BigInput'
import { Button } from '@/components/ui/Button'
import { router } from 'expo-router'
import { useState } from 'react'

export default function SignInEmailScreen() {
  const [email, setEmail] = useState('')
  const hasValue = email.trim().length > 0

  function handleContinue() {
    const trimmed = email.trim()
    if (!trimmed) return
    router.push({ pathname: '/(auth)/sign-in-password', params: { email: trimmed } })
  }

  return (
    <AuthStepLayout
      heading="What's your email?"
      footer={
        <Button
          label="Continue"
          onPress={handleContinue}
          disabled={!hasValue}
        />
      }
    >
      <BigInput
        placeholder="your@email.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoFocus
        returnKeyType="go"
        onSubmitEditing={handleContinue}
      />
    </AuthStepLayout>
  )
}
