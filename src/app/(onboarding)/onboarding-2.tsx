import { OnboardingSlide } from '@/components/ui/OnboardingSlide'
import { router } from 'expo-router'

export default function Onboarding2() {
  return (
    <OnboardingSlide
      illustration="📅"
      headline={"Set a date.\nLock it in."}
      body="Create a Drop, pick when it opens, and invite your friends. Everyone uploads photos until the big reveal."
      dotsActive={1}
      buttonLabel="Next"
      onPress={() => router.push('/(onboarding)/onboarding-3')}
    />
  )
}
