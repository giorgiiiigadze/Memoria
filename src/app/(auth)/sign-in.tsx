import { AntDesign, FontAwesome } from '@expo/vector-icons'
import { router } from 'expo-router'
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

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
      <View style={styles.brand}>
        <Text style={styles.welcome}>Welcome to</Text>
        <View style={styles.brandRow}>
          <FontAwesome name="asterisk" size={26} color="#FFFFFF" />
          <Text style={styles.brandName}>memoria</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.btn, styles.btnLight, styles.btnHalf]}
            onPress={handleAppleSignIn}
            activeOpacity={0.85}
          >
            <AntDesign name="apple1" size={16} color="#0A0A0A" />
            <Text style={styles.btnLightLabel}>Apple</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.btnLight, styles.btnHalf]}
            onPress={handleGoogleSignIn}
            activeOpacity={0.85}
          >
            <AntDesign name="google" size={15} color="#0A0A0A" />
            <Text style={styles.btnLightLabel}>Google</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.btn, styles.btnDark]}
          onPress={() => router.push('/(auth)/sign-in-email')}
          activeOpacity={0.85}
        >
          <AntDesign name="mail" size={16} color="#FFFFFF" />
          <Text style={styles.btnDarkLabel}>Continue with Email</Text>
        </TouchableOpacity>

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
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  brand: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcome: {
    fontFamily: serif,
    fontSize: 34,
    color: '#FFFFFF',
    marginBottom: 6,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandName: {
    fontFamily: serif,
    fontSize: 40,
    color: '#FFFFFF',
  },
  actions: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  btnHalf: {
    flex: 1,
  },
  btnLight: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
  },
  btnLightLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0A0A0A',
  },
  btnDark: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
  },
  btnDarkLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  terms: {
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 18,
    color: '#555555',
    marginTop: 12,
  },
  termsLink: {
    color: '#888888',
    textDecorationLine: 'underline',
  },
})
