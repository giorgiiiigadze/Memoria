import { OnboardingHeader } from '@/components/onboarding/OnboardingHeader'
import { Stack } from 'expo-router'

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        header: () => <OnboardingHeader />,
      }}
    />
  )
}