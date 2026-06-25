import { OnboardingHeader } from '@/components/onboarding/OnboardingHeader'
import { colors } from '@/theme'
import { Stack } from 'expo-router'

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        header: () => <OnboardingHeader />,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  )
}