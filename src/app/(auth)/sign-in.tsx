import { Button } from '@/components/ui/Button'
import { colors, fontWeight, radii, spacing } from '@/theme'
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
          colors={['transparent', colors.overlayDark, colors.background]}
          locations={[0, 1, 1]}
          style={styles.bottomScrim}
          pointerEvents="none"
        />

        <LinearGradient
          colors={['transparent', colors.background]}
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
            <AntDesign name="apple" size={16} color={colors.ink} />
            <Text style={styles.btnLightLabel}>Apple</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.btnLight, styles.btnHalf]}
            onPress={handleGoogleSignIn}
            activeOpacity={0.85}
          >
            <AntDesign name="google" size={16} color={colors.ink} />
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
    backgroundColor: colors.background,
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
    gap: spacing[4],
    backgroundColor: colors.background,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[6],
    paddingBottom: spacing[10],
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
    gap: spacing[2],
    paddingVertical: 18,
  },
  btnHalf: {
    flex: 1,
  },
  btnLight: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
  },
  btnLightLabel: {
    fontSize: 15,
    fontWeight: fontWeight.medium,
    color: colors.ink,
  },
  terms: {
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 18,
    color: '#555555', // terms text — intentional muted one-off
    marginTop: spacing[3],
  },
  termsLink: {
    textDecorationLine: 'underline',
  },
})
