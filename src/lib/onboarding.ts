import AsyncStorage from '@react-native-async-storage/async-storage'
import { router } from 'expo-router'

const ONBOARDING_KEY = '@memoria/onboarding_complete'

export async function completeOnboarding() {
  await AsyncStorage.setItem(ONBOARDING_KEY, 'true')
  router.replace('/(app)/(home)')
}
