import { useAuthStore } from '@/store/auth.store'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { router } from 'expo-router'

const ONBOARDING_KEY = '@memoria/onboarding_complete'

export async function completeOnboarding() {
  await AsyncStorage.setItem(ONBOARDING_KEY, 'true')
  const { session, profile } = useAuthStore.getState()

  if (!session) {
    router.replace('/(auth)/sign-in')
  } else if (!profile?.username) {
    router.replace('/(auth)/setup-profile')
  } else {
    router.replace('/(app)/(tabs)/(home)')
  }
}
