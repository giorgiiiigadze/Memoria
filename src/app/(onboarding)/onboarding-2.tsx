import AsyncStorage from '@react-native-async-storage/async-storage'
import { Dots } from '@/components/ui/Dots'
import { router } from 'expo-router'
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

const ONBOARDING_KEY = '@memoria/onboarding_complete'

async function completeOnboarding() {
  await AsyncStorage.setItem(ONBOARDING_KEY, 'true')
  router.replace('/(app)/(home)')
}

export default function Onboarding2() {
  return (
    <SafeAreaView style={styles.root}>
      <TouchableOpacity style={styles.skipBtn} onPress={completeOnboarding}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.illustration}>📅</Text>
        <Text style={styles.headline}>Set a date.{'\n'}Lock it in.</Text>
        <Text style={styles.body}>
          Create a Drop, pick when it opens, and invite your friends. Everyone uploads photos until the big reveal.
        </Text>
      </View>

      <View style={styles.footer}>
        <Dots active={1} />
        <TouchableOpacity
          style={styles.btn}
          onPress={() => router.push('/(onboarding)/onboarding-3')}
          activeOpacity={0.8}
        >
          <Text style={styles.btnLabel}>Next</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#121212',
  },
  skipBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  skipText: {
    color: '#626262',
    fontSize: 14,
    fontWeight: '500',
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
