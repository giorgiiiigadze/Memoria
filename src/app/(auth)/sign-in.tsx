import { AntDesign } from '@expo/vector-icons'
import { router } from 'expo-router'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

export default function SignInScreen() {
  async function handleGoogleSignIn() {
    console.log('Google sign-in — TODO')
  }

  async function handleAppleSignIn() {
    console.log('Apple sign-in — TODO')
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.wordmark}>memoria</Text>
        <Text style={styles.tagline}>your memories, beautifully kept.</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.btnSocial} onPress={handleAppleSignIn} activeOpacity={0.8}>
          <AntDesign name="apple1" size={16} color="#FFFFFF" />
          <Text style={styles.btnSocialLabel}>Continue with Apple</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnSocial} onPress={handleGoogleSignIn} activeOpacity={0.8}>
          <AntDesign name="google" size={15} color="#FFFFFF" />
          <Text style={styles.btnSocialLabel}>Continue with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btnSocial, styles.btnEmail]}
          onPress={() => router.push('/(auth)/sign-in-email')}
          activeOpacity={0.8}
        >
          <AntDesign name="mail" size={16} color="#FFFFFF" />
          <Text style={styles.btnSocialLabel}>Continue with Email</Text>
        </TouchableOpacity>

        <Text style={styles.terms}>
          By continuing, you agree to our{' '}
          <Text style={styles.termsLink}>Terms</Text>
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
    paddingBottom: 48,
  },
  header: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 40,
  },
  wordmark: {
    fontSize: 40,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -1.5,
    marginBottom: 10,
  },
  tagline: {
    fontSize: 15,
    color: '#626262',
  },
  actions: {
    gap: 10,
  },
  btnSocial: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 0.5,
    borderColor: '#3B3B3B',
    borderRadius: 14,
    paddingVertical: 14,
    backgroundColor: '#191919',
  },
  btnEmail: {
    borderColor: '#555555',
    backgroundColor: '#1C1C1C',
  },
  btnSocialLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#C4C4C4',
  },
  terms: {
    textAlign: 'center',
    fontSize: 12,
    color: '#4A4A4A',
    marginTop: 6,
  },
  termsLink: {
    color: '#626262',
    textDecorationLine: 'underline',
  },
})
