import { OnboardingSlide } from '@/components/ui/OnboardingSlide'
import { router } from 'expo-router'

export default function OnboardingScreen() {
  return (
    <OnboardingSlide
      illustration="🔒"
      headline={"Your memories,\nlocked in time"}
      body="Memoria lets you and your friends collect photos in secret — then reveal them all at once on a date you choose."
      dotsActive={0}
      buttonLabel="Continue"
      onPress={() => router.push('/(onboarding)/onboarding-2')}
    />
  )
}
