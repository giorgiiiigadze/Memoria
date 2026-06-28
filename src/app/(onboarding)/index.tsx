import { Stack, router } from 'expo-router'
import { useEffect } from 'react'

export default function IntroScreen() {
  useEffect(() => {
    router.replace('/(onboarding)/onboarding-1' as any)
  }, [])

  return <Stack.Screen options={{ headerShown: false }} />
}
