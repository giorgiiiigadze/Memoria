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

  const hasValue = email.trim().length > 0

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableOpacity style={styles.back} onPress={() => router.back()} hitSlop={12}>
        <AntDesign name="left" size={20} color="#FFFFFF" />
      </TouchableOpacity>

      <View style={styles.body}>
        <View style={styles.top}>
          <Text style={styles.wordmark}>memoria.</Text>
          <Text style={styles.heading}>What's your email?</Text>
          <TextInput
            style={styles.input}
            placeholder="your@email.com"
            placeholderTextColor="#444444"
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

        <TouchableOpacity
          style={[styles.btn, hasValue && styles.btnActive]}
          onPress={handleContinue}
          disabled={!hasValue}
          activeOpacity={0.85}
        >
          <Text style={[styles.btnLabel, hasValue && styles.btnLabelActive]}>
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
  },
  back: {
    marginTop: 56,
    marginLeft: 24,
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
    justifyContent: 'space-between',
  },
  top: {
    marginTop: 24,
    alignItems: 'center',
  },
  wordmark: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 32,
  },
  heading: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  input: {
    fontSize: 42,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    width: '100%',
    paddingVertical: 4,
  },
  btn: {
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#2C2C2C',
  },
  btnActive: {
    backgroundColor: '#FFFFFF',
  },
  btnLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#7A7A7A',
  },
  btnLabelActive: {
    color: '#000000',
  },
})
