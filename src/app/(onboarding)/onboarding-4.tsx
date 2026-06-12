import { OnboardingHeader } from '@/components/onboarding/OnboardingHeader'
import { OnboardingSlide } from '@/components/onboarding/OnboardingSlide'
import { completeOnboarding } from '@/lib/onboarding'
import * as ImagePicker from 'expo-image-picker'
import { Stack } from 'expo-router'
import { useState } from 'react'

export default function Onboarding4() {
  const [loading, setLoading] = useState(false)

  async function handleGetStarted() {
    setLoading(true)
    await Promise.all([
      ImagePicker.requestMediaLibraryPermissionsAsync(),
      ImagePicker.requestCameraPermissionsAsync(),
    ])
    await completeOnboarding()
  }

  return (
    <>
      <Stack.Screen options={{ header: () => <OnboardingHeader showSkip={false} /> }} />
      <OnboardingSlide
        illustration="✨"
        headline={"The moment you've\nbeen waiting for"}
        body="When the date arrives, the Drop opens and everyone sees every photo — all at once."
        dotsActive={3}
        buttonLabel="Get Started"
        onPress={handleGetStarted}
        buttonLoading={loading}
      />
    </>
  )
}
