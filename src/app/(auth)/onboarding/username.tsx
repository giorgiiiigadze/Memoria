import { OnboardingStepHeader } from '@/components/ui/OnboardingStepHeader'
import { useAuthStore } from '@/store/auth.store'
import { colors, fontWeight, radii, spacing } from '@/theme'
import { router } from 'expo-router'
import { useRef, useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

export default function UsernameScreen() {
  const setOnboardingName = useAuthStore(s => s.setOnboardingName)
  const [name, setName] = useState('')

  const inputRef = useRef<TextInput>(null)

  function handleNext() {
    const trimmed = name.trim()
    if (!trimmed) return
    setOnboardingName(trimmed)
    router.push('/(auth)/onboarding/birthday')
  }

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <OnboardingStepHeader step={1} total={3} />

      <View style={s.body}>
        <Text style={s.question}>
          what should{'\n'}
          <Text style={s.questionAccent}>memoria</Text>
          {'\n'}call you?
        </Text>

        <TouchableOpacity
          style={s.inputWrap}
          onPress={() => inputRef.current?.focus()}
          activeOpacity={1}
        >
          <TextInput
            ref={inputRef}
            style={s.input}
            value={name}
            onChangeText={setName}
            placeholder="your name"
            placeholderTextColor={colors.borderDefault}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={handleNext}
            autoFocus
            maxLength={50}
          />
          <View style={s.underline} />
        </TouchableOpacity>
      </View>

      {/* Floating next button */}
      <TouchableOpacity
        style={[s.nextBtn, !name.trim() && s.nextBtnOff]}
        onPress={handleNext}
        disabled={!name.trim()}
        activeOpacity={0.85}
      >
        <Text style={s.nextArrow}>→</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[8],
  },
  question: {
    fontSize: 36,
    lineHeight: 44,
    fontWeight: fontWeight.semiBold,
    color: colors.textPrimary,
    letterSpacing: -1,
    marginBottom: spacing[10],
  },
  questionAccent: {
    color: colors.ember,
  },
  inputWrap: {
    marginBottom: spacing[8],
  },
  input: {
    fontSize: 28,
    fontWeight: fontWeight.medium,
    color: colors.textPrimary,
    paddingVertical: spacing[2],
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
  },
  underline: {
    height: 1.5,
    backgroundColor: colors.borderDefault,
  },
  nextBtn: {
    position: 'absolute',
    right: spacing[6],
    bottom: spacing[10],
    width: 56,
    height: 56,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnOff: {
    backgroundColor: colors.borderDefault,
  },
  nextArrow: {
    fontSize: 22,
    color: colors.white,
    fontWeight: fontWeight.semiBold,
  },
})
