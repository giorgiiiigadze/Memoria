import { AntDesign } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

export default function SignInEmailScreen() {
  const [email, setEmail] = useState('')

  function handleContinue() {
    const trimmed = email.trim()
    if (!trimmed) return
    router.push({ pathname: '/(auth)/sign-in-password', params: { email: trimmed } })
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableOpacity style={styles.back} onPress={() => router.back()} hitSlop={12}>
        <AntDesign name="left" size={20} color="#FFFFFF" />
      </TouchableOpacity>

      <View style={styles.inner}>
        <Text style={styles.heading}>What's your email?</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          placeholderTextColor="#898989"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
          returnKeyType="go"
          onSubmitEditing={handleContinue}
        />
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueBtn, !email.trim() && styles.continueBtnDisabled]}
          onPress={handleContinue}
          disabled={!email.trim()}
          activeOpacity={0.85}
        >
          <Text style={[styles.continueBtnLabel, !email.trim() && styles.continueBtnLabelDisabled]}>
            Continue
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  back: {
    marginTop: 56,
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 80,
  },
  heading: {
    fontSize: 26,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#191919',
    borderWidth: 0.5,
    borderColor: '#3B3B3B',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#FFFFFF',
  },
  footer: {},
  continueBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  continueBtnDisabled: {
    backgroundColor: '#2A2A2A',
  },
  continueBtnLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0A0A0A',
  },
  continueBtnLabelDisabled: {
    color: '#555555',
  },
})
