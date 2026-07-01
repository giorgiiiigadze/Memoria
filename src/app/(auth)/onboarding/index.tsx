import { supabase } from '@/api/client'
import { findProfilesByPhones, sendRequest } from '@/api/friends.api'
import { OnboardingStepHeader } from '@/components/onboarding/OnboardingStepHeader'
import { AuthButton } from '@/components/ui/AuthButton'
import { InitialAvatar } from '@/components/ui/InitialAvatar'
import { useAuthStore } from '@/store/auth.store'
import { colors, fontWeight, spacing } from '@/theme'
import type { Profile } from '@/types/database.types'
import { Contact, ContactField, getPermissionsAsync, requestPermissionsAsync } from 'expo-contacts'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import * as Notifications from 'expo-notifications'
import { router } from 'expo-router'
import { SymbolView } from 'expo-symbols'
import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
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

const USERNAME_RE = /^[a-z0-9_]{3,30}$/

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7

type SuggestedProfile = Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url' | 'phone'> & { contactName: string }
type UnmatchedContact = { name: string; phone: string }

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (raw.trim().startsWith('+')) return `+${digits}`
  if (digits.length === 10) return `+1${digits}`
  return `+${digits}`
}
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
  const setOnboardingAge = useAuthStore(s => s.setOnboardingAge)
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

  const [profileCreating, setProfileCreating] = useState(false)
  const [contactsLoading, setContactsLoading] = useState(false)
  const [contactSuggestions, setContactSuggestions] = useState<SuggestedProfile[]>([])
  const [unmatchedContacts, setUnmatchedContacts] = useState<UnmatchedContact[]>([])
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set())
  const [addingId, setAddingId] = useState<string | null>(null)
  const contactsLoadedRef = useRef(false)

  async function loadContactSuggestions() {
    if (contactsLoadedRef.current) return
    contactsLoadedRef.current = true
    const user = useAuthStore.getState().user
    if (!user) return
    setContactsLoading(true)
    try {
      let status = (await getPermissionsAsync()).status
      if (status !== 'granted') {
        status = (await requestPermissionsAsync()).status
      }
      if (status !== 'granted') return
      const contacts = await Contact.getAllDetails([ContactField.FULL_NAME, ContactField.PHONES])
      const phoneToName = new Map<string, string>()
      for (const c of contacts) {
        if (!c.phones?.length) continue
        const name = c.fullName ?? 'Unknown'
        for (const pn of c.phones) {
          if (!pn.number) continue
          const normalized = normalizePhone(pn.number)
          if (normalized.length >= 8) phoneToName.set(normalized, name)
        }
      }
      const allPhones = Array.from(phoneToName.keys())
      const profiles = await findProfilesByPhones(allPhones, user.id)
      const matchedPhones = new Set(profiles.map(p => p.phone).filter(Boolean))
      const matched: SuggestedProfile[] = []
      const unmatched: UnmatchedContact[] = []
      const seenIds = new Set<string>()
      const seenPhones = new Set<string>()
      for (const p of profiles) {
        if (seenIds.has(p.id)) continue
        seenIds.add(p.id)
        const contactName = p.phone ? (phoneToName.get(p.phone) ?? p.display_name ?? p.username ?? '') : ''
        matched.push({ ...p, contactName })
      }
      for (const [phone, name] of phoneToName.entries()) {
        if (matchedPhones.has(phone) || seenPhones.has(phone)) continue
        seenPhones.add(phone)
        unmatched.push({ name, phone })
      }
      setContactSuggestions(matched)
      setUnmatchedContacts(unmatched)
    } catch {
      // fail silently
    } finally {
      setContactsLoading(false)
    }
  }

  async function handleInvite(phone: string) {
    const message = "Hey! I'm using Memoria to share photo memories with friends. Come join me!"
    const sep = Platform.OS === 'ios' ? '&' : '?'
    const url = `sms:${phone}${sep}body=${encodeURIComponent(message)}`
    const canOpen = await Linking.canOpenURL(url)
    if (canOpen) Linking.openURL(url)
  }

  async function handleAddContact(profileId: string) {
    const user = useAuthStore.getState().user
    if (!user || addingId) return
    setAddingId(profileId)
    try {
      await sendRequest(user.id, profileId)
      setAddedIds(prev => new Set(prev).add(profileId))
    } catch {
      // fail silently
    } finally {
      setAddingId(null)
    }
  }

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

  const [age, setAge] = useState('')
  const ageRef = useRef<TextInput>(null)
  const ageNum = parseInt(age, 10)
  const ageValid = !isNaN(ageNum) && ageNum >= 1 && ageNum <= 120

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

  function handleBirthdayNext() {
    setOnboardingAge(ageValid ? ageNum : null)
    goToStep(5)
  }

  function handleBirthdaySkip() {
    setOnboardingAge(null)
    goToStep(5)
  }

  async function createProfileEarly(phone: string | null) {
    const user = useAuthStore.getState().user
    if (!user) return
    const store = useAuthStore.getState()
    const displayName = store.onboardingName.trim() || 'You'
    const uname = store.onboardingUsername.trim()
    if (!uname) return
    setProfileCreating(true)
    try {
      const payload = {
        id: user.id,
        username: uname,
        display_name: displayName,
        ...(phone ? { phone } : {}),
        ...(store.onboardingAvatarUrl ? { avatar_url: store.onboardingAvatarUrl } : {}),
        ...(store.onboardingAge != null ? { age: store.onboardingAge } : {}),
      }
      const { data: profile, error } = await supabase
        .from('profiles')
        .upsert(payload)
        .select()
        .single()
      if (!error && profile) store.setProfile(profile)
    } catch {
      // non-fatal — complete.tsx will retry on "let's go"
    } finally {
      setProfileCreating(false)
    }
  }

  async function handlePhoneNext() {
    const digits = phone.replace(/\D/g, '')
    const normalized = digits.length >= 7 ? `+${digits}` : null
    if (normalized) setOnboardingPhone(normalized)
    await createProfileEarly(normalized)
    loadContactSuggestions()
    goToStep(6)
  }

  function handlePhoneSkip() {
    setOnboardingPhone(null)
    createProfileEarly(null) // fire-and-forget; contacts load async gives it time to finish
    loadContactSuggestions()
    goToStep(6)
  }

  function handleContactsNext() {
    goToStep(7)
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
    { text: "Let's get you set up", color: INK },
  ]

  const step2Headline: Segment[] = [
    { text: `Hey ${firstName},\n`, color: INK },
    { text: 'Pick a username.', color: INK },
  ]

const step6Headline: Segment[] = [
    { text: 'Never miss\nthe moment\n', color: INK },
    { text: 'Drops unlock.', color: INK },
  ]

  return (
    <View style={s.root}>
      <OnboardingStepHeader
        step={step}
        total={7}
        onBack={step > 1 ? () => goToStep((step - 1) as Step) : () => router.replace('/(auth)')}
        onSkip={
          step === 3 ? () => goToStep(4) :
          step === 4 ? handleBirthdaySkip :
          step === 5 ? handlePhoneSkip :
          step === 6 ? handleContactsNext :
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
                <Text style={s.step1Sub}>What should friends call you?</Text>
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
                  <TextInput
                    ref={usernameRef}
                    style={s.input}
                    value={username}
                    onChangeText={v => setUsername(v.toLowerCase().replace(/ /g, '_').replace(/[^a-z0-9_]/g, ''))}
                    placeholder="username"
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
                  ) : availStatus === 'checking' ? (
                    <Text style={s.usernameHint}>Checking availability…</Text>
                  ) : availStatus === 'taken' ? (
                    <Text style={[s.usernameHint, s.usernameHintError]}>Username taken</Text>
                  ) : availStatus === 'available' ? (
                    <View style={s.usernameAvailRow}>
                      <SymbolView name="checkmark.seal.fill" size={18} tintColor={colors.success} weight="semibold" resizeMode="scaleAspectFit" />
                      <Text style={[s.usernameHint, s.usernameHintOk, s.usernameHintInline]}>Username available</Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              </View>
              <AuthButton scheme="light"
                label={availStatus === 'checking' ? 'Checking' : 'Continue'}
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
                      <SymbolView name="camera" size={32} tintColor={`${INK}55`} weight="semibold" resizeMode="scaleAspectFit" />
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
              <View style={s.body1}>
                <Headline segments={[{ text: `How old are\nyou, ${firstName}?`, color: INK }]} />
                <TouchableOpacity
                  style={s.inputWrap}
                  onPress={() => ageRef.current?.focus()}
                  activeOpacity={1}
                >
                  <TextInput
                    ref={ageRef}
                    style={[s.input, { fontSize: 72 }]}
                    value={age}
                    onChangeText={v => setAge(v.replace(/[^0-9]/g, ''))}
                    placeholder="20"
                    placeholderTextColor={`${colors.charcoal}55`}
                    keyboardType="number-pad"
                    returnKeyType="done"
                    selectionColor={INK}
                    onSubmitEditing={ageValid ? handleBirthdayNext : undefined}
                    autoFocus
                    maxLength={3}
                  />
                </TouchableOpacity>
              </View>
              <AuthButton scheme="light"
                label="Continue"
                onPress={handleBirthdayNext}
                disabled={!ageValid}
                style={[s.nextBtn, { marginBottom: keyboardVisible ? spacing[3] : insets.bottom }]}
              />
            </View>
          )}

          {step === 5 && (
            <View style={s.stepContainer}>
              <View style={s.body1}>
                <Headline segments={[{ text: "What's your\nnumber?", color: INK }]} />
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
                label={profileCreating ? 'Setting up…' : 'Continue'}
                onPress={handlePhoneNext}
                disabled={!phoneValid || profileCreating}
                loading={profileCreating}
                style={[s.nextBtn, { marginBottom: keyboardVisible ? spacing[3] : insets.bottom }]}
              />
            </View>
          )}

          {step === 6 && (
            <View style={s.stepContainer}>
              <ScrollView
                style={s.contactsList}
                contentContainerStyle={[s.contactsScrollContent, { paddingBottom: insets.bottom + 80 }]}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <Headline segments={[{ text: 'Your contacts\non Memoria.', color: INK }]} />
                {contactsLoading ? (
                  <View style={s.contactsCenter}>
                    <ActivityIndicator color={INK} />
                  </View>
                ) : (
                  <>
                    {contactSuggestions.length > 0 && (
                      <>
                        <Text style={s.contactsSectionLabel}>On Memoria</Text>
                        {contactSuggestions.map(profile => {
                          const isAdded = addedIds.has(profile.id)
                          const isAdding = addingId === profile.id
                          return (
                            <View key={profile.id} style={s.contactRow}>
                              <InitialAvatar
                                name={profile.contactName || profile.display_name || profile.username || '?'}
                                avatarUrl={profile.avatar_url}
                                size={48}
                              />
                              <View style={s.contactInfo}>
                                <Text style={s.contactName}>{profile.contactName || profile.display_name}</Text>
                                <Text style={s.contactHandle}>@{profile.username}</Text>
                              </View>
                              <TouchableOpacity
                                style={[s.addBtn, isAdded && s.addBtnDone]}
                                onPress={() => !isAdded && handleAddContact(profile.id)}
                                disabled={isAdded || !!addingId}
                                activeOpacity={0.7}
                              >
                                {isAdding ? (
                                  <ActivityIndicator size="small" color={INK} />
                                ) : (
                                  <Text style={[s.addBtnLabel, isAdded && s.addBtnLabelDone]}>
                                    {isAdded ? 'Added' : 'Add'}
                                  </Text>
                                )}
                              </TouchableOpacity>
                            </View>
                          )
                        })}
                      </>
                    )}
                    {unmatchedContacts.length > 0 && (
                      <>
                        <Text style={[s.contactsSectionLabel, contactSuggestions.length > 0 && { marginTop: spacing[6] }]}>Invite Friends</Text>
                        {unmatchedContacts.map(contact => (
                          <View key={contact.phone} style={s.contactRow}>
                            <InitialAvatar name={contact.name} size={48} />
                            <View style={s.contactInfo}>
                              <Text style={s.contactName}>{contact.name}</Text>
                              <Text style={s.contactHandle}>{contact.phone}</Text>
                            </View>
                            <TouchableOpacity
                              style={s.addBtn}
                              onPress={() => handleInvite(contact.phone)}
                              activeOpacity={0.7}
                            >
                              <Text style={s.addBtnLabel}>Invite</Text>
                            </TouchableOpacity>
                          </View>
                        ))}
                      </>
                    )}
                    {contactSuggestions.length === 0 && unmatchedContacts.length === 0 && (
                      <View style={s.contactsCenter}>
                        <Text style={s.contactsEmpty}>None of your contacts are on Memoria yet.</Text>
                      </View>
                    )}
                  </>
                )}
              </ScrollView>
              <AuthButton
                scheme="light"
                label="Continue"
                onPress={handleContactsNext}
                style={[s.nextBtn, { marginBottom: insets.bottom || spacing[4] }]}
              />
            </View>
          )}

          {step === 7 && (
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
    paddingHorizontal: spacing[4],
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
    fontWeight: fontWeight.semiBold,
    color: `${colors.charcoal}55`,
    textAlign: 'center',
    marginBottom: spacing[1],
  },
  usernameHint: {
    marginTop: spacing[3],
    fontSize: 15,
    color: `${colors.charcoal}55`,
    textAlign: 'center',
  },
  usernameHintError: {
    color: colors.error,
  },
  usernameHintOk: {
    color: colors.success,
  },
  usernameAvailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1],
    marginTop: spacing[3],
  },
  usernameHintInline: {
    marginTop: 0,
  },
  nextBtn: {
    marginHorizontal: spacing[4],
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
    width: 240,
    height: 240,
    borderRadius: 120,
  },
  avatarPlaceholder: {
    width: 240,
    height: 240,
    borderRadius: 120,
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
    borderRadius: 120,
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


  body3: {
    flex: 1,
    paddingHorizontal: spacing[4],
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

  contactsSectionLabel: {
    fontSize: 13,
    fontWeight: fontWeight.semiBold,
    color: INK,
    textTransform: 'capitalize',
    letterSpacing: 0.6,
    marginBottom: spacing[2],
  },
  contactsCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactsEmpty: {
    fontSize: 15,
    color: `${colors.charcoal}55`,
    textAlign: 'center',
    lineHeight: 22,
  },
  contactsList: {
    flex: 1,
    backgroundColor: BG,
  },
  contactsScrollContent: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[8],
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    gap: spacing[3],
  },
  contactInfo: { flex: 1 },
  contactName: {
    fontSize: 17,
    fontWeight: fontWeight.semiBold,
    color: INK,
  },
  contactHandle: {
    fontSize: 12,
    color: `${colors.charcoal}55`,
    marginTop: 1,
  },
  addBtn: {
    paddingHorizontal: spacing[4],
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: INK,
    minWidth: 60,
    alignItems: 'center',
  },
  addBtnDone: {
    borderColor: `${colors.charcoal}30`,
    backgroundColor: `${colors.charcoal}08`,
  },
  addBtnLabel: {
    fontSize: 13,
    fontWeight: fontWeight.semiBold,
    color: INK,
  },
  addBtnLabelDone: {
    color: `${colors.charcoal}55`,
  },
})
