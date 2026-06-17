import { OnboardingSlide } from '@/components/onboarding/OnboardingSlide'
import { Stack, router } from 'expo-router'

export default function OnboardingSlide1() {
  return (
    <>
      <Stack.Screen options={{ animation: 'fade' }} />
      <OnboardingSlide
        illustration="🔒"
        headline={"Your memories,\nlocked in time"}
        body="Memoria lets you and your friends collect photos in secret — then reveal them all at once on a date you choose."
        dotsActive={0}
        buttonLabel="Continue"
        onPress={() => router.push('/(onboarding)/onboarding-2')}
      />
    </>
  )
}
