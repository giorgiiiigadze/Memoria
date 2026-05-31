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
      keyboardVerticalOffset={0}
    >
      <TouchableOpacity style={styles.back} onPress={() => router.back()} hitSlop={12}>
        <AntDesign name="left" size={20} color="#FFFFFF" />
      </TouchableOpacity>

      <View style={styles.body}>
        <View style={styles.top}>
          <Text style={styles.heading}>What's your email?</Text>
          <TextInput
            style={styles.input}
            placeholder="your@email.com"
            placeholderTextColor="#3B3B3B"
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
            style={[styles.btn, hasValue ? styles.btnActive : styles.btnInactive]}
            onPress={handleContinue}
            disabled={!hasValue}
            activeOpacity={0.85}
          >
            <Text style={[styles.btnLabel, hasValue ? styles.btnLabelActive : styles.btnLabelInactive]}>
              Continue
            </Text>
          </TouchableOpacity>
        </View>
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
    paddingHorizontal: 24,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  top: {
    marginTop: 32,
  },
  heading: {
    fontSize: 26,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 28,
  },
  input: {
    fontSize: 28,
    fontWeight: '500',
    color: '#FFFFFF',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#3B3B3B',
  },
  footer: {},
  btn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnActive: {
    backgroundColor: '#FFFFFF',
  },
  btnInactive: {
    backgroundColor: '#1C1C1C',
  },
  btnLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  btnLabelActive: {
    color: '#0A0A0A',
  },
  btnLabelInactive: {
    color: '#3B3B3B',
  },
})
