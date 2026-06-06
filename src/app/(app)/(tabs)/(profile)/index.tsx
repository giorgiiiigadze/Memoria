import { supabase } from '@/api/client'
import { getMyDrops, type DropWithParticipants } from '@/api/drops.api'
import { InitialAvatar } from '@/components/ui/InitialAvatar'
import { selectProfile, selectUser, useAuthStore } from '@/store/auth.store'
import { colors, fontSize, fontWeight, radii, spacing } from '@/theme'
import type { DropState } from '@/types/database.types'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as ImagePicker from 'expo-image-picker'
import { router, useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
function fmtDate(iso: string | null) {
  if (!iso) return 'No date'
  const d = new Date(iso)
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

const STATE_META: Record<DropState, { label: string; color: string }> = {
  active:  { label: 'Active',   color: colors.primary },
  ready:   { label: 'Ready',    color: colors.success },
  open:    { label: 'Open',     color: colors.warning },
  expired: { label: 'Expired',  color: colors.textTertiary },
}

export default function ProfileScreen() {
  const user = useAuthStore(selectUser)
  const profile = useAuthStore(selectProfile)
  const setProfile = useAuthStore(s => s.setProfile)
  const setHasSeenOnboarding = useAuthStore(s => s.setHasSeenOnboarding)
  const signOut = useAuthStore(s => s.signOut)

  async function replayOnboarding() {
    await AsyncStorage.removeItem('@memoria/onboarding_complete')
    setHasSeenOnboarding(false)
    router.replace('/(onboarding)')
  }

  const [drops, setDrops] = useState<DropWithParticipants[]>([])
  const [editing, setEditing] = useState(false)
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '')
  const [bio, setBio] = useState(profile?.bio ?? '')
  const [avatarUri, setAvatarUri] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useFocusEffect(
    useCallback(() => {
      getMyDrops().then(setDrops).catch(console.error)
    }, [])
  )

  function startEdit() {
    setDisplayName(profile?.display_name ?? '')
    setBio(profile?.bio ?? '')
    setAvatarUri(null)
    setSaveError(null)
    setEditing(true)
  }

  function cancelEdit() {
    setEditing(false)
    setAvatarUri(null)
    setSaveError(null)
  }

  async function pickAvatar() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    })
    if (!result.canceled) setAvatarUri(result.assets[0].uri)
  }

  async function handleSave() {
    if (!user || !profile) return
    setSaving(true)
    setSaveError(null)

    let avatarUrl = profile.avatar_url
    if (avatarUri) {
      try {
        const ext = avatarUri.split('.').pop() ?? 'jpg'
        const path = `${user.id}/avatar.${ext}`
        const arrayBuffer = await (await fetch(avatarUri)).arrayBuffer()
        const { error: upErr } = await supabase.storage
          .from('avatars')
          .upload(path, arrayBuffer, { upsert: true, contentType: `image/${ext}` })
        if (!upErr) {
          const { data } = supabase.storage.from('avatars').getPublicUrl(path)
          avatarUrl = data.publicUrl
        }
      } catch (e) {
        console.error('[profile] avatar upload failed:', e)
      }
    }

    const { data: updated, error } = await supabase
      .from('profiles')
      .update({
        display_name: displayName.trim() || null,
        bio: bio.trim() || null,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      setSaveError('Failed to save. Try again.')
      console.error('[profile] update error:', error)
    } else if (updated) {
      setProfile(updated)
      setEditing(false)
      setAvatarUri(null)
    }
    setSaving(false)
  }

  const avatarSource = avatarUri
    ? { uri: avatarUri }
    : profile?.avatar_url
    ? { uri: profile.avatar_url }
    : null

  const displayedName = profile?.display_name ?? profile?.username ?? ''

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={s.headerRow}>
          <Text style={s.heading}>Profile</Text>
          <View style={s.headerActions}>
            <TouchableOpacity style={s.signOutBtn} onPress={replayOnboarding} activeOpacity={0.7}>
              <Text style={s.signOutLabel}>Intro</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.signOutBtn} onPress={signOut} activeOpacity={0.7}>
              <Text style={s.signOutLabel}>Sign out</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Avatar + identity */}
        <View style={s.identity}>
          <TouchableOpacity onPress={editing ? pickAvatar : undefined} activeOpacity={editing ? 0.7 : 1}>
            <InitialAvatar name={displayedName || '?'} avatarUrl={avatarSource?.uri} size={72} />
            {editing && (
              <View style={s.avatarEditBadge}>
                <Text style={s.avatarEditBadgeLabel}>Edit</Text>
              </View>
            )}
          </TouchableOpacity>

          {editing ? (
            <View style={s.editFields}>
              <Text style={s.fieldLabel}>Display name</Text>
              <TextInput
                style={s.input}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Your name"
                placeholderTextColor={colors.textTertiary}
                maxLength={50}
                returnKeyType="next"
              />
              <Text style={s.fieldLabel}>Bio</Text>
              <TextInput
                style={[s.input, s.inputMulti]}
                value={bio}
                onChangeText={setBio}
                placeholder="A little about you"
                placeholderTextColor={colors.textTertiary}
                maxLength={160}
                multiline
                returnKeyType="done"
              />
              {saveError ? <Text style={s.errorText}>{saveError}</Text> : null}
              <View style={s.editActions}>
                <TouchableOpacity style={s.btnCancel} onPress={cancelEdit} disabled={saving}>
                  <Text style={s.btnCancelLabel}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.btnSave, saving && s.btnDisabled]} onPress={handleSave} disabled={saving}>
                  {saving
                    ? <ActivityIndicator color={colors.white} size="small" />
                    : <Text style={s.btnSaveLabel}>Save</Text>}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={s.identityInfo}>
              {displayedName ? <Text style={s.displayName}>{displayedName}</Text> : null}
              <Text style={s.username}>@{profile?.username}</Text>
              {profile?.bio ? <Text style={s.bio}>{profile.bio}</Text> : null}
              <TouchableOpacity style={s.editBtn} onPress={startEdit} activeOpacity={0.7}>
                <Text style={s.editBtnLabel}>Edit Profile</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Drops section */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Your Drops</Text>
          <Text style={s.sectionCount}>{drops.length}</Text>
        </View>

        {drops.length === 0 ? (
          <View style={s.emptyDrops}>
            <Text style={s.emptyText}>No drops yet. Tap Create to start one.</Text>
          </View>
        ) : (
          drops.map(drop => (
            <TouchableOpacity
              key={drop.id}
              style={s.dropCard}
              onPress={() => router.push({ pathname: `/drop/${drop.id}`, params: { from: '/(app)/(profile)' } } as any)}
              activeOpacity={0.75}
            >
              <View style={s.dropCardTop}>
                <Text style={s.dropTitle} numberOfLines={1}>{drop.title}</Text>
                <View style={[s.badge, { borderColor: STATE_META[drop.state].color }]}>
                  <Text style={[s.badgeLabel, { color: STATE_META[drop.state].color }]}>
                    {STATE_META[drop.state].label}
                  </Text>
                </View>
              </View>
              <Text style={s.dropMeta}>{fmtDate(drop.open_date)}</Text>
            </TouchableOpacity>
          ))
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing[6], paddingTop: 72, paddingBottom: spacing[12] },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[8] },
  heading: { fontSize: fontSize.xl, fontWeight: fontWeight.semiBold, color: colors.white, letterSpacing: -0.5 },
  headerActions: { flexDirection: 'row', gap: spacing[2] },
  signOutBtn: { paddingHorizontal: spacing[3], paddingVertical: 6, borderRadius: 6, borderWidth: 0.5, borderColor: colors.borderDefault },
  signOutLabel: { fontSize: 13, color: colors.textTertiary },
  identity: { flexDirection: 'row', gap: spacing[4], marginBottom: 36, alignItems: 'flex-start' },
  avatarEditBadge: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.55)', borderBottomLeftRadius: 36, borderBottomRightRadius: 36,
    alignItems: 'center', paddingBottom: spacing[1],
  },
  avatarEditBadgeLabel: { fontSize: 10, color: colors.white, fontWeight: fontWeight.medium },
  identityInfo: { flex: 1, paddingTop: spacing[1], gap: spacing[1] },
  displayName: { fontSize: 17, fontWeight: fontWeight.semiBold, color: colors.white },
  username: { fontSize: 13, color: colors.textMuted },
  bio: { fontSize: 13, color: colors.textLight, lineHeight: 18, marginTop: spacing[1] },
  editBtn: { marginTop: 10, alignSelf: 'flex-start', paddingHorizontal: spacing[3], paddingVertical: 6, borderRadius: 6, borderWidth: 0.5, borderColor: colors.borderDefault },
  editBtnLabel: { fontSize: 13, color: colors.textLight },
  editFields: { flex: 1, gap: spacing[2] },
  fieldLabel: { fontSize: 11, fontWeight: fontWeight.medium, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.4 },
  input: { backgroundColor: colors.surfaceInput, borderWidth: 0.5, borderColor: colors.borderDefault, borderRadius: radii.sm, paddingHorizontal: spacing[3], paddingVertical: 10, fontSize: fontSize.sm, color: colors.white },
  inputMulti: { height: 72, textAlignVertical: 'top' },
  errorText: { fontSize: fontSize.xs, color: colors.error },
  editActions: { flexDirection: 'row', gap: spacing[2], marginTop: spacing[1] },
  btnCancel: { flex: 1, paddingVertical: 10, borderRadius: radii.sm, borderWidth: 0.5, borderColor: colors.borderDefault, alignItems: 'center' },
  btnCancelLabel: { fontSize: 13, color: colors.textMuted },
  btnSave: { flex: 1, paddingVertical: 10, borderRadius: radii.sm, backgroundColor: colors.primary, alignItems: 'center' },
  btnDisabled: { opacity: 0.5 },
  btnSaveLabel: { fontSize: 13, color: colors.white, fontWeight: fontWeight.semiBold },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[3] },
  sectionTitle: { fontSize: 15, fontWeight: fontWeight.semiBold, color: colors.white },
  sectionCount: { fontSize: 13, color: colors.textTertiary },
  emptyDrops: { paddingVertical: spacing[6], alignItems: 'center' },
  emptyText: { fontSize: fontSize.sm, color: colors.textTertiary },
  dropCard: {
    backgroundColor: colors.surfaceInput, borderWidth: 0.5, borderColor: colors.borderDefault,
    borderRadius: 10, padding: 14, marginBottom: spacing[2],
  },
  dropCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  dropTitle: { fontSize: 15, fontWeight: fontWeight.semiBold, color: colors.white, flex: 1, marginRight: spacing[3] },
  badge: { borderWidth: 0.5, borderRadius: 5, paddingHorizontal: 7, paddingVertical: 3 },
  badgeLabel: { fontSize: 10, fontWeight: fontWeight.semiBold, textTransform: 'uppercase', letterSpacing: 0.5 },
  dropMeta: { fontSize: fontSize.xs, color: colors.textTertiary },
})
