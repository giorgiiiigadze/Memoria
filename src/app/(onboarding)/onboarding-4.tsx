import AsyncStorage from '@react-native-async-storage/async-storage'
import { Dots } from '@/components/ui/Dots'
import * as ImagePicker from 'expo-image-picker'
import { router } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

const ONBOARDING_KEY = '@memoria/onboarding_complete'

export default function Onboarding4() {
  const [loading, setLoading] = useState(false)

  async function handleGetStarted() {
    setLoading(true)
    await Promise.all([
      ImagePicker.requestMediaLibraryPermissionsAsync(),
      ImagePicker.requestCameraPermissionsAsync(),
    ])
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true')
    router.replace('/(app)/(home)')
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.skipPlaceholder} />

      <View style={styles.content}>
        <Text style={styles.illustration}>✨</Text>
        <Text style={styles.headline}>The moment you've{'\n'}been waiting for</Text>
        <Text style={styles.body}>
          When the date arrives, the Drop opens and everyone sees every photo — all at once.
        </Text>
      </View>

      <View style={styles.footer}>
        <Dots active={3} />
        <TouchableOpacity
          style={styles.btn}
          onPress={handleGetStarted}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.btnLabel}>Get Started</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  skipPlaceholder: {
    height: 48,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  illustration: {
    fontSize: 80,
    marginBottom: 40,
  },
  headline: {
    fontSize: 30,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 36,
    marginBottom: 16,
  },
  body: {
    fontSize: 15,
    color: '#898989',
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 24,
    alignItems: 'center',
  },
  btn: {
    backgroundColor: '#0044FF',
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  btnLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
})
