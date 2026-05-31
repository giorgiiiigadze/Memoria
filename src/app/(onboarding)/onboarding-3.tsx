import { OnboardingSlide } from '@/components/ui/OnboardingSlide'
import { router } from 'expo-router'

export default function Onboarding3() {
  return (
    <OnboardingSlide
      illustration="🙈"
      headline={"No peeking\nallowed"}
      body="During the upload phase, you can only see your own photos. Nobody sees the full collection until the Drop opens."
      dotsActive={2}
      buttonLabel="Next"
      onPress={() => router.push('/(onboarding)/onboarding-4')}
    />
  )
}
