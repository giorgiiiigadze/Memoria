import { Button } from '@/components/ui/Button'
import { AntDesign } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

const serif = Platform.select({ ios: 'Georgia', default: 'serif' })

export default function SignInScreen() {
  async function handleGoogleSignIn() {
    console.log('Google sign-in — TODO')
  }

  async function handleAppleSignIn() {
    console.log('Apple sign-in — TODO')
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <View style={styles.brand}>
        <Image
          source={require('../../../assets/images/test-image.png')}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />

        {/* Top scrim — keeps the clock/battery legible over bright photos */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.85)', '#000000']}
          locations={[0, 1, 1]}
          style={styles.bottomScrim}
          pointerEvents="none"
        />

        <LinearGradient
          colors={['transparent', '#000000']}
          style={styles.bottomScrim}
          pointerEvents="none"
        />
      </View>

      <View style={styles.actions}>
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.btn, styles.btnLight, styles.btnHalf]}
            onPress={handleAppleSignIn}
            activeOpacity={0.85}
          >
            <AntDesign name="apple" size={16} color="#0A0A0A" />
            <Text style={styles.btnLightLabel}>Apple</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.btnLight, styles.btnHalf]}
            onPress={handleGoogleSignIn}
            activeOpacity={0.85}
          >
            <AntDesign name="google" size={16} color="#0A0A0A" />
            <Text style={styles.btnLightLabel}>Google</Text>
          </TouchableOpacity>
        </View>

        <Button
          label="Continue with Email"
          onPress={() => router.push('/(auth)/sign-in-email')}
          variant="secondary"
        />

        <Text style={styles.terms}>
          By signing up, you agree to{'\n'}memoria's{' '}
          <Text style={styles.termsLink}>Terms of Service</Text>
          {' '}and{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  brand: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  topScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 140,
  },
  bottomScrim: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 220,
  },
  actions: {
    gap: 16,
    backgroundColor: '#000000',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 40,
    marginTop: -28,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
  },
  btnHalf: {
    flex: 1,
  },
  btnLight: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  btnLightLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#0A0A0A',
  },
  terms: {
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 18,
    color: '#555555',
    marginTop: 12,
  },
  termsLink: {
    textDecorationLine: 'underline',
  },
})