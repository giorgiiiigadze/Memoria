import { OnboardingStepHeader } from '@/components/ui/OnboardingStepHeader'
import { SocialButton } from '@/components/ui/SocialButton'
import { useAuthStore } from '@/store/auth.store'
import { colors, fontWeight, spacing } from '@/theme'
import { LinearGradient } from 'expo-linear-gradient'
import * as Notifications from 'expo-notifications'
import { router } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import {
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const ITEM_H = 48
const VISIBLE = 5
const DRUM_H = ITEM_H * VISIBLE
const PAD = Math.floor(VISIBLE / 2) * ITEM_H
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1))
const NOW = new Date()
const MAX_YEAR = NOW.getFullYear() - 13
const YEARS = Array.from({ length: MAX_YEAR - 1919 }, (_, i) => String(MAX_YEAR - i))

type Step = 1 | 2 | 3
type Segment = { text: string; color: string }

function Headline({ segments }: { segments: Segment[] }) {
  return (
    <Text style={s.headline}>
      {segments.map((seg, i) => (
        <Text key={i} style={{ color: seg.color }}>
          {seg.text}
        </Text>
      ))}
    </Text>
  )
}

export default function OnboardingFlow() {
  const setOnboardingName = useAuthStore(s => s.setOnboardingName)
  const setOnboardingBirthday = useAuthStore(s => s.setOnboardingBirthday)
  const onboardingName = useAuthStore(s => s.onboardingName)
  const insets = useSafeAreaInsets()

  const [step, setStep] = useState<Step>(1)
  const fadeAnim = useRef(new Animated.Value(1)).current

  const [name, setName] = useState('')
  const inputRef = useRef<TextInput>(null)

  const defaultMonth = NOW.getMonth()
  const defaultDay = NOW.getDate() - 1
  const [monthIdx, setMonthIdx] = useState(defaultMonth)
  const [dayIdx, setDayIdx] = useState(defaultDay)
  const [yearIdx, setYearIdx] = useState(0)
  const monthRef = useRef<ScrollView>(null)
  const dayRef = useRef<ScrollView>(null)
  const yearRef = useRef<ScrollView>(null)

  useEffect(() => {
    if (step !== 2) return
    const t = setTimeout(() => {
      monthRef.current?.scrollTo({ y: defaultMonth * ITEM_H, animated: false })
      dayRef.current?.scrollTo({ y: defaultDay * ITEM_H, animated: false })
      yearRef.current?.scrollTo({ y: 0, animated: false })
    }, 80)
    return () => clearTimeout(t)
  }, [step])

  function goToStep(next: Step) {
    Keyboard.dismiss()
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 160,
      useNativeDriver: true,
    }).start(() => {
      setStep(next)
      fadeAnim.setValue(0)
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start()
    })
  }

  function handleNameNext() {
    const trimmed = name.trim()
    if (!trimmed) return
    setOnboardingName(trimmed)
    goToStep(2)
  }

  function onScrollEnd(
    e: NativeSyntheticEvent<NativeScrollEvent>,
    items: string[],
    setter: (i: number) => void,
  ) {
    const raw = Math.round(e.nativeEvent.contentOffset.y / ITEM_H)
    setter(Math.max(0, Math.min(items.length - 1, raw)))
  }

  function handleBirthdayNext() {
    const mm = String(monthIdx + 1).padStart(2, '0')
    const dd = DAYS[dayIdx].padStart(2, '0')
    const yyyy = YEARS[yearIdx]
    setOnboardingBirthday(`${yyyy}-${mm}-${dd}`)
    goToStep(3)
  }

  function handleBirthdaySkip() {
    setOnboardingBirthday(null)
    goToStep(3)
  }

  async function handleEnableNotifications() {
    await Notifications.requestPermissionsAsync()
    router.replace('/(auth)/onboarding/complete')
  }

  function handleSkipNotifications() {
    router.replace('/(auth)/onboarding/complete')
  }

  const firstName = onboardingName.split(' ')[0] || 'you'

  const step1Headline: Segment[] = [
    { text: 'what should\n', color: colors.textPrimary },
    { text: 'memoria\n', color: colors.lime },
    { text: 'call you?', color: colors.textPrimary },
  ]

  const step2Headline: Segment[] = [
    { text: 'hey ', color: colors.textPrimary },
    { text: firstName, color: colors.lime },
    { text: ',\nwhen was\nwhere you born?', color: colors.textPrimary },
  ]

  const step3Headline: Segment[] = [
    { text: 'never miss\nthe moment\n', color: colors.textPrimary },
    { text: 'drops unlock.', color: colors.lime },
  ]

  return (
    <View style={s.root}>
      <OnboardingStepHeader
        step={step}
        total={3}
        onBack={step > 1 ? () => goToStep((step - 1) as Step) : undefined}
        onSkip={step === 2 ? handleBirthdaySkip : undefined}
      />

      <KeyboardAvoidingView
        style={s.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Animated.View style={[s.stepWrap, { opacity: fadeAnim }]}>

          {step === 1 && (
            <View style={s.stepContainer}>
              <View style={s.body1}>
                <Headline segments={step1Headline} />
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
                    selectionColor={colors.white}
                    onSubmitEditing={handleNameNext}
                    autoFocus
                    maxLength={50}
                  />
                </TouchableOpacity>
              </View>
              <SocialButton
                label="Next"
                onPress={handleNameNext}
                disabled={!name.trim()}
                style={[s.nextBtn, { marginBottom: insets.bottom + spacing[1] }]}
              />
            </View>
          )}

          {step === 2 && (
            <View style={s.stepContainer}>
              <View style={s.body2}>
                <Headline segments={step2Headline} />
                <View style={s.drumWrap}>
                  <View style={[s.selectionBar, { pointerEvents: 'none' }]} />
                  <View style={s.drumsRow}>
                    <ScrollView
                      ref={monthRef}
                      style={s.drum}
                      contentContainerStyle={s.drumContent}
                      showsVerticalScrollIndicator={false}
                      snapToInterval={ITEM_H}
                      decelerationRate="fast"
                      onScrollEndDrag={e => onScrollEnd(e, MONTHS, setMonthIdx)}
                      onMomentumScrollEnd={e => onScrollEnd(e, MONTHS, setMonthIdx)}
                    >
                      {MONTHS.map((m, i) => (
                        <View key={m} style={s.drumItem}>
                          <Text style={[s.drumLabel, i === monthIdx && s.drumLabelSelected]}>{m}</Text>
                        </View>
                      ))}
                    </ScrollView>
                    <ScrollView
                      ref={dayRef}
                      style={s.drum}
                      contentContainerStyle={s.drumContent}
                      showsVerticalScrollIndicator={false}
                      snapToInterval={ITEM_H}
                      decelerationRate="fast"
                      onScrollEndDrag={e => onScrollEnd(e, DAYS, setDayIdx)}
                      onMomentumScrollEnd={e => onScrollEnd(e, DAYS, setDayIdx)}
                    >
                      {DAYS.map((d, i) => (
                        <View key={d} style={s.drumItem}>
                          <Text style={[s.drumLabel, i === dayIdx && s.drumLabelSelected]}>{d}</Text>
                        </View>
                      ))}
                    </ScrollView>
                    <ScrollView
                      ref={yearRef}
                      style={s.drum}
                      contentContainerStyle={s.drumContent}
                      showsVerticalScrollIndicator={false}
                      snapToInterval={ITEM_H}
                      decelerationRate="fast"
                      onScrollEndDrag={e => onScrollEnd(e, YEARS, setYearIdx)}
                      onMomentumScrollEnd={e => onScrollEnd(e, YEARS, setYearIdx)}
                    >
                      {YEARS.map((y, i) => (
                        <View key={y} style={s.drumItem}>
                          <Text style={[s.drumLabel, i === yearIdx && s.drumLabelSelected]}>{y}</Text>
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                  <LinearGradient
                    colors={[colors.background, 'transparent']}
                    style={s.fadeTop}
                    pointerEvents="none"
                  />
                  <LinearGradient
                    colors={['transparent', colors.background]}
                    style={s.fadeBottom}
                    pointerEvents="none"
                  />
                </View>
              </View>
              <SocialButton
                label="Next"
                onPress={handleBirthdayNext}
                style={[s.nextBtn, { marginBottom: insets.bottom + spacing[1] }]}
              />
            </View>
          )}

          {step === 3 && (
            <View style={s.stepContainer}>
              <View style={s.body3}>
                <View style={s.visual}>
                  <View style={s.ring3}>
                    <View style={s.ring2}>
                      <View style={s.ring1}>
                        <Text style={s.bell}>🔔</Text>
                      </View>
                    </View>
                  </View>
                </View>
                <Headline segments={step3Headline} />
                <Text style={s.sub}>
                  Get notified when a drop is ready to open or when friends add to yours.
                </Text>
              </View>
              <View style={[s.actions, { paddingBottom: insets.bottom + spacing[1] }]}>
                <SocialButton variant="outline" label="maybe later" onPress={handleSkipNotifications} />
                <SocialButton label="turn on notifications" onPress={handleEnableNotifications} />
              </View>
            </View>
          )}

        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  )
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  kav: {
    flex: 1,
  },
  stepWrap: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },

  headline: {
    fontSize: 38,
    lineHeight: 46,
    fontWeight: fontWeight.regular,
    letterSpacing: -0.5,
    marginBottom: spacing[8],
    textAlign: 'center',
  },

  body1: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[8],
  },
  inputWrap: {
    marginBottom: spacing[8],
    alignItems: 'center',
  },
  input: {
    fontSize: 28,
    fontWeight: fontWeight.medium,
    color: colors.textPrimary,
    paddingVertical: spacing[2],
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
    textAlign: 'center',
    width: '100%',
  },
  nextBtn: {
    marginHorizontal: spacing[2],
  },

  body2: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[6],
  },
  drumWrap: {
    height: DRUM_H,
    position: 'relative',
    overflow: 'hidden',
  },
  selectionBar: {
    position: 'absolute',
    top: PAD,
    left: 0,
    right: 0,
    height: ITEM_H,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.borderSubtle,
    zIndex: 1,
  },
  drumsRow: {
    flexDirection: 'row',
    height: DRUM_H,
  },
  drum: {
    flex: 1,
  },
  drumContent: {
    paddingVertical: PAD,
  },
  drumItem: {
    height: ITEM_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drumLabel: {
    fontSize: 17,
    color: colors.textTertiary,
    fontWeight: fontWeight.regular,
  },
  drumLabelSelected: {
    fontSize: 18,
    color: colors.textPrimary,
    fontWeight: fontWeight.semiBold,
  },
  fadeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: PAD,
    zIndex: 2,
  },
  fadeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: PAD,
    zIndex: 2,
  },

  body3: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[6],
  },
  visual: {
    alignItems: 'center',
    marginBottom: spacing[8],
  },
  ring3: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring2: {
    width: 116,
    height: 116,
    borderRadius: 58,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring1: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bell: {
    fontSize: 30,
  },
  sub: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 22,
  },
  actions: {
    gap: spacing[3],
  },
})