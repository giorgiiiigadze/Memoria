import { supabase } from '@/api/client'
import { OnboardingStepHeader } from '@/components/onboarding/OnboardingStepHeader'
import { AuthButton } from '@/components/ui/AuthButton'
import { useAuthStore } from '@/store/auth.store'
import { colors, fontWeight, spacing } from '@/theme'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import { LinearGradient } from 'expo-linear-gradient'
import * as Notifications from 'expo-notifications'
import { router } from 'expo-router'
import { SymbolView } from 'expo-symbols'
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

const BG  = colors.lightBackground
const INK = colors.charcoal

const ITEM_H = 48
const VISIBLE = 5
const DRUM_H = ITEM_H * VISIBLE
const PAD = Math.floor(VISIBLE / 2) * ITEM_H
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1))
const NOW = new Date()
const MAX_YEAR = NOW.getFullYear() - 13
const YEARS = Array.from({ length: MAX_YEAR - 1919 }, (_, i) => String(MAX_YEAR - i))

const USERNAME_RE = /^[a-z0-9_]{3,30}$/

type Step = 1 | 2 | 3 | 4 | 5 | 6
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
  const setOnboardingUsername = useAuthStore(s => s.setOnboardingUsername)
  const setOnboardingAvatarUrl = useAuthStore(s => s.setOnboardingAvatarUrl)
  const setOnboardingBirthday = useAuthStore(s => s.setOnboardingBirthday)
  const setOnboardingPhone = useAuthStore(s => s.setOnboardingPhone)
  const onboardingName = useAuthStore(s => s.onboardingName)
  const insets = useSafeAreaInsets()

  const [step, setStep] = useState<Step>(1)
  const fadeAnim = useRef(new Animated.Value(1)).current
  const [keyboardVisible, setKeyboardVisible] = useState(false)

  useEffect(() => {
    const show = Keyboard.addListener('keyboardWillShow', () => setKeyboardVisible(true))
    const hide = Keyboard.addListener('keyboardWillHide', () => setKeyboardVisible(false))
    return () => { show.remove(); hide.remove() }
  }, [])

  const [name, setName] = useState('')
  const inputRef = useRef<TextInput>(null)

  const [username, setUsername] = useState('')
  const usernameRef = useRef<TextInput>(null)
  const usernameValid = USERNAME_RE.test(username)
  const usernameError = username.length > 0 && !usernameValid
    ? username.length < 3
      ? 'At least 3 characters'
      : /[^a-z0-9_]/.test(username)
        ? 'Letters, numbers, and underscores only'
        : null
    : null

  type AvailStatus = 'idle' | 'checking' | 'available' | 'taken'
  const [availStatus, setAvailStatus] = useState<AvailStatus>('idle')
  const checkTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (checkTimer.current) clearTimeout(checkTimer.current)
    if (!usernameValid) { setAvailStatus('idle'); return }
    setAvailStatus('checking')
    checkTimer.current = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .maybeSingle()
      setAvailStatus(data ? 'taken' : 'available')
    }, 500)
    return () => { if (checkTimer.current) clearTimeout(checkTimer.current) }
  }, [username, usernameValid])

  const [avatarUri, setAvatarUri] = useState<string | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)

  const [phone, setPhone] = useState('')
  const phoneRef = useRef<TextInput>(null)
  const phoneDigits = phone.replace(/\D/g, '')
  const phoneValid = phoneDigits.length >= 7 && phoneDigits.length <= 15

  async function handlePickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    })
    if (result.canceled) return
    const uri = result.assets[0].uri
    setAvatarUri(uri)
    setAvatarUploading(true)
    try {
      const userId = useAuthStore.getState().user?.id
      if (!userId) return
      const ext = uri.split('.').pop()?.toLowerCase() ?? 'jpg'
      const path = `${userId}/avatar.${ext}`
      const res = await fetch(uri)
      const blob = await res.blob()
      const { error } = await supabase.storage.from('avatars').upload(path, blob, {
        upsert: true,
        contentType: `image/${ext}`,
      })
      if (!error) {
        const { data } = supabase.storage.from('avatars').getPublicUrl(path)
        setOnboardingAvatarUrl(data.publicUrl)
      }
    } catch (e) {
      console.error('[onboarding] avatar upload failed:', e)
    } finally {
      setAvatarUploading(false)
    }
  }

  const defaultMonth = NOW.getMonth()
  const defaultDay = NOW.getDate() - 1
  const [monthIdx, setMonthIdx] = useState(defaultMonth)
  const [dayIdx, setDayIdx] = useState(defaultDay)
  const [yearIdx, setYearIdx] = useState(0)
  const monthRef = useRef<ScrollView>(null)
  const dayRef = useRef<ScrollView>(null)
  const yearRef = useRef<ScrollView>(null)

  useEffect(() => {
    if (step !== 4) return
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

  function handleUsernameNext() {
    if (!usernameValid) return
    setOnboardingUsername(username)
    goToStep(3)
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
    goToStep(5)
  }

  function handleBirthdaySkip() {
    setOnboardingBirthday(null)
    goToStep(5)
  }

  function handlePhoneNext() {
    const digits = phone.replace(/\D/g, '')
    if (digits.length >= 7) {
      setOnboardingPhone(`+${digits}`)
    }
    goToStep(6)
  }

  function handlePhoneSkip() {
    setOnboardingPhone(null)
    goToStep(6)
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
    { text: 'Lets get you set up', color: INK },
  ]

  const step2Headline: Segment[] = [
    { text: `Hey ${firstName},\n`, color: INK },
    { text: 'pick a username.', color: INK },
  ]

  const step3Headline: Segment[] = [
    { text: 'add a profile photo.', color: INK },
  ]

  const step6Headline: Segment[] = [
    { text: 'never miss\nthe moment\n', color: INK },
    { text: 'drops unlock.', color: INK },
  ]

  return (
    <View style={s.root}>
      <OnboardingStepHeader
        step={step}
        total={6}
        onBack={step > 1 ? () => goToStep((step - 1) as Step) : () => router.replace('/(auth)')}
        onSkip={
          step === 3 ? () => goToStep(4) :
          step === 4 ? handleBirthdaySkip :
          step === 5 ? handlePhoneSkip :
          undefined
        }
        tint={INK}
        trackBg="rgba(27,27,27,0.12)"
        glassScheme="light"
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
                <Text style={s.step1Sub}>What should we call you?</Text>
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
                    placeholder="Your name"
                    placeholderTextColor={`${colors.charcoal}55`}
                    autoCapitalize="words"
                    autoCorrect={false}
                    returnKeyType="done"
                    selectionColor={INK}
                    onSubmitEditing={handleNameNext}
                    autoFocus
                    maxLength={50}
                  />
                </TouchableOpacity>
              </View>
              <AuthButton scheme="light"
                label="Continue"
                onPress={handleNameNext}
                disabled={!name.trim()}
                style={[s.nextBtn, { marginBottom: keyboardVisible ? spacing[3] : insets.bottom }]}
              />
            </View>
          )}

          {step === 2 && (
            <View style={s.stepContainer}>
              <View style={s.body1}>
                <Headline segments={step2Headline} />
                <Text style={s.step1Sub}>This is how friends find you.</Text>
                <TouchableOpacity
                  style={s.inputWrap}
                  onPress={() => usernameRef.current?.focus()}
                  activeOpacity={1}
                >
                  <Text style={s.atSign}>@</Text>
                  <TextInput
                    ref={usernameRef}
                    style={s.input}
                    value={username}
                    onChangeText={v => setUsername(v.toLowerCase().replace(/ /g, '_').replace(/[^a-z0-9_]/g, ''))}
                    placeholder="Username"
                    placeholderTextColor={`${colors.charcoal}55`}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    selectionColor={INK}
                    onSubmitEditing={handleUsernameNext}
                    autoFocus
                    maxLength={30}
                  />
                  {usernameError ? (
                    <Text style={s.usernameHint}>{usernameError}</Text>
                  ) : availStatus === 'taken' ? (
                    <Text style={[s.usernameHint, s.usernameHintError]}>Username taken</Text>
                  ) : null}
                </TouchableOpacity>
              </View>
              <AuthButton scheme="light"
                label={availStatus === 'checking' ? 'Checking…' : 'Continue'}
                onPress={handleUsernameNext}
                disabled={availStatus !== 'available'}
                style={[s.nextBtn, { marginBottom: keyboardVisible ? spacing[3] : insets.bottom }]}
              />
            </View>
          )}

          {step === 3 && (
            <View style={s.stepContainer}>
              <View style={[s.body3, { justifyContent: 'flex-start' }]}>
                <Text style={s.headline}>Add a profile photo.</Text>
                <Text style={s.avatarSubtitle}>{' A profile picture helps\nyour friends know it\'s you'}</Text>
                <TouchableOpacity
                  style={s.avatarWrap}
                  onPress={handlePickPhoto}
                  activeOpacity={0.8}
                  disabled={avatarUploading}
                >
                  {avatarUri ? (
                    <Image source={{ uri: avatarUri }} style={s.avatarCircle} contentFit="cover" />
                  ) : (
                    <View style={s.avatarPlaceholder}>
                      <SymbolView name="camera" size={32} tintColor={`${INK}55`} resizeMode="scaleAspectFit" />
                    </View>
                  )}
                  {avatarUploading && (
                    <View style={s.avatarOverlay}>
                      <Text style={s.avatarOverlayText}>Uploading…</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
              <AuthButton
                scheme="light"
                label="Continue"
                onPress={() => goToStep(4)}
                style={[s.nextBtn, { marginBottom: insets.bottom }]}
              />
            </View>
          )}

          {step === 4 && (
            <View style={s.stepContainer}>
              <View style={s.body2}>
                <Headline segments={[{ text: `Hey ${firstName}, when were you born?`, color: INK }]} />
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
                    colors={[BG, 'transparent']}
                    style={s.fadeTop}
                    pointerEvents="none"
                  />
                  <LinearGradient
                    colors={['transparent', BG]}
                    style={s.fadeBottom}
                    pointerEvents="none"
                  />
                </View>
              </View>
              <AuthButton scheme="light"
                label="Continue"
                onPress={handleBirthdayNext}
                style={[s.nextBtn, { marginBottom: keyboardVisible ? spacing[3] : insets.bottom }]}
              />
            </View>
          )}

          {step === 5 && (
            <View style={s.stepContainer}>
              <View style={s.body1}>
                <Headline segments={[{ text: "what's your\nnumber?", color: INK }]} />
                <Text style={s.step1Sub}>Help friends find you on Memoria.</Text>
                <TouchableOpacity style={s.inputWrap} onPress={() => phoneRef.current?.focus()} activeOpacity={1}>
                  <Text style={s.atSign}>include country code, e.g. +1 555 123 4567</Text>
                  <TextInput
                    ref={phoneRef}
                    style={s.input}
                    value={phone}
                    onChangeText={v => setPhone(v.replace(/[^\d\s\-().+]/g, ''))}
                    placeholder="+1 555 123 4567"
                    placeholderTextColor={`${colors.charcoal}55`}
                    keyboardType="phone-pad"
                    returnKeyType="done"
                    selectionColor={INK}
                    onSubmitEditing={phoneValid ? handlePhoneNext : undefined}
                    autoFocus
                    maxLength={20}
                  />
                </TouchableOpacity>
              </View>
              <AuthButton
                scheme="light"
                label="Continue"
                onPress={handlePhoneNext}
                disabled={!phoneValid}
                style={[s.nextBtn, { marginBottom: keyboardVisible ? spacing[3] : insets.bottom }]}
              />
            </View>
          )}

          {step === 6 && (
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
                <Headline segments={step6Headline} />
                <Text style={s.sub}>
                  Get notified when a drop is ready to open or when friends add to yours.
                </Text>
              </View>
              <View style={[s.actions, { paddingBottom: insets.bottom }]}>
                <AuthButton scheme="light" variant="outline" label="maybe later" onPress={handleSkipNotifications} />
                <AuthButton scheme="light" label="turn on notifications" onPress={handleEnableNotifications} />
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
    backgroundColor: BG,
  },
  kav: {
    flex: 1,
  },
  stepWrap: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
  },

  headline: {
    fontSize: 32,
    lineHeight: 46,
    fontWeight: fontWeight.semiBold,
    letterSpacing: -0.5,
    marginBottom: spacing[8],
    textAlign: 'center',
    color: INK,
  },

  body1: {
    flex: 1,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[8],
  },
  step1Sub: {
    fontSize: 15,
    color: `${colors.charcoal}55`,
    fontWeight: fontWeight.regular,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  inputWrap: {
    marginTop: spacing[12],
    marginBottom: spacing[8],
    alignItems: 'center',
  },
  input: {
    fontSize: 40,
    fontWeight: fontWeight.semiBold,
    color: INK,
    paddingVertical: spacing[2],
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
    textAlign: 'center',
    width: '100%',
  },
  atSign: {
    fontSize: 15,
    fontWeight: fontWeight.medium,
    color: `${colors.charcoal}55`,
    textAlign: 'center',
    marginBottom: spacing[1],
  },
  usernameHint: {
    marginTop: spacing[3],
    fontSize: 13,
    color: `${colors.charcoal}55`,
    textAlign: 'center',
  },
  usernameHintError: {
    color: colors.error,
  },
  usernameHintOk: {
    color: colors.success,
  },
  nextBtn: {
    marginHorizontal: spacing[6],
  },

  avatarSubtitle: {
    fontSize: 14,
    color: `${colors.charcoal}60`,
    fontWeight: fontWeight.regular,
    marginTop: spacing[1],
    marginBottom: spacing[6],
  },
  avatarWrap: {
    alignSelf: 'center',
    marginTop: spacing[8],
    marginBottom: spacing[4],
  },
  avatarCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  avatarPlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: `${colors.charcoal}0D`,
    borderWidth: 1.5,
    borderColor: `${colors.charcoal}20`,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 100,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOverlayText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: fontWeight.medium,
  },
  avatarHint: {
    fontSize: 13,
    color: `${colors.charcoal}55`,
    textAlign: 'center',
    fontWeight: fontWeight.regular,
  },

  body2: {
    flex: 1,
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
    borderColor: 'rgba(27,27,27,0.15)',
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
    color: 'rgba(27,27,27,0.35)',
    fontWeight: fontWeight.regular,
  },
  drumLabelSelected: {
    fontSize: 18,
    color: INK,
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
    flex: 1,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[6],
    justifyContent: 'center',
    alignItems: 'center',
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
    borderColor: 'rgba(27,27,27,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring2: {
    width: 116,
    height: 116,
    borderRadius: 58,
    borderWidth: 1,
    borderColor: 'rgba(27,27,27,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring1: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(27,27,27,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bell: {
    fontSize: 30,
  },
  sub: {
    fontSize: 14,
    color: 'rgba(27,27,27,0.5)',
    lineHeight: 22,
  },
  actions: {
    gap: spacing[3],
  },
})
