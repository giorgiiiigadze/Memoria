import { supabase } from '@/api/client'
import { getMyDrops, type DropWithParticipants } from '@/api/drops.api'
import { MiniDropGrid, MiniDropGridSkeleton } from '@/components/drops/MiniDropCard'
import { InitialAvatar } from '@/components/ui/InitialAvatar'
import { selectProfile, selectUser, useAuthStore } from '@/store/auth.store'
import { useDropsStore } from '@/store/drops.store'
import { colors, fontSize, fontWeight, radii, spacing } from '@/theme'
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


function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <View style={s.stat}>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  )
}

export default function ProfileScreen() {
  const user = useAuthStore(selectUser)
  const profile = useAuthStore(selectProfile)
  const setProfile = useAuthStore(s => s.setProfile)
  const signOut = useAuthStore(s => s.signOut)

  const cachedDrops = useDropsStore(s => s.drops)
  const [drops, setDrops] = useState<DropWithParticipants[]>(cachedDrops)
  const [loadingDrops, setLoadingDrops] = useState(cachedDrops.length === 0)
  const [editing, setEditing] = useState(false)
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '')
  const [bio, setBio] = useState(profile?.bio ?? '')
  const [avatarUri, setAvatarUri] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useFocusEffect(
    useCallback(() => {
      getMyDrops()
        .then(d => { setDrops(d); setLoadingDrops(false) })
        .catch(console.error)
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

  // Stats derived from real drop data (swap for friends / photos counts when those queries land)
  const activeCount = drops.filter(d => d.state === 'active').length
  const readyCount = drops.filter(d => d.state === 'ready').length
  const openCount = drops.filter(d => d.state === 'open').length

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">

        {/* Top bar: [Sign out] — [avatar] — [Edit] */}
        <View style={s.topBar}>
          <View style={s.topSide}>
            <TouchableOpacity onPress={signOut} activeOpacity={0.7}>
              <Text style={s.topActionMuted}>Sign out</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={editing ? pickAvatar : undefined}
            activeOpacity={editing ? 0.7 : 1}
          >
            <InitialAvatar name={displayedName || '?'} avatarUrl={avatarSource?.uri} size={88} />
            {editing && (
              <View style={s.avatarEditBadge}>
                <Text style={s.avatarEditBadgeLabel}>Edit</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={[s.topSide, s.topSideRight]}>
            {!editing && (
              <TouchableOpacity onPress={startEdit} activeOpacity={0.7}>
                <Text style={s.topAction}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Centered identity */}
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
          <View style={s.identity}>
            <Text style={s.name}>{displayedName}</Text>
            <Text style={s.metaLine}>
              @{profile?.username}
              {profile?.bio ? `  •  ${profile.bio}` : ''}
            </Text>

            {/* Stats row */}
            <View style={s.statsRow}>
              <Stat value={drops.length} label="Drops" />
              <Stat value={activeCount} label="Active" />
              <Stat value={readyCount} label="Ready" />
              <Stat value={openCount} label="Open" />
            </View>
          </View>
        )}

        {/* Drops content */}
        {!editing && (
          <>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Your Drops</Text>
              <Text style={s.sectionCount}>{drops.length}</Text>
            </View>

            {loadingDrops ? (
              <MiniDropGridSkeleton count={6} />
            ) : drops.length === 0 ? (
              <View style={s.emptyDrops}>
                <Text style={s.emptyText}>No drops yet. Tap Create to start one.</Text>
              </View>
            ) : (
              <MiniDropGrid drops={drops} />
            )}
          </>
        )}

        {__DEV__ && (
          <TouchableOpacity style={s.devBtn} onPress={() => router.replace('/(onboarding)' as any)}>
            <Text style={s.devBtnLabel}>Dev: back to onboarding</Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingTop: 64, paddingBottom: spacing[12] },

  // Top bar
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[5] },
  topSide: { flex: 1, justifyContent: 'center' },
  topSideRight: { alignItems: 'flex-end' },
  topAction: { fontSize: 15, color: colors.white, fontWeight: fontWeight.semiBold },
  topActionMuted: { fontSize: 14, color: colors.textTertiary, alignSelf: 'flex-start' },
  avatarEditBadge: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.55)', borderBottomLeftRadius: 44, borderBottomRightRadius: 44,
    alignItems: 'center', paddingBottom: spacing[1],
  },
  avatarEditBadgeLabel: { fontSize: 10, color: colors.white, fontWeight: fontWeight.medium },

  // Centered identity
  identity: { alignItems: 'center' },
  name: { fontSize: 28, fontWeight: fontWeight.semiBold, color: colors.white, letterSpacing: -0.5, textAlign: 'center', marginBottom: spacing[2] },
  metaLine: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20, paddingHorizontal: spacing[2] },

  // Stats
  statsRow: { flexDirection: 'row', alignSelf: 'stretch', marginTop: spacing[6], marginBottom: spacing[8] },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: fontWeight.semiBold, color: colors.white },
  statLabel: { fontSize: 13, color: colors.textMuted, marginTop: 2 },

  // Edit form
  editFields: { gap: spacing[2], marginTop: spacing[4] },
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

  // Drops
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[3] },
  sectionTitle: { fontSize: 15, fontWeight: fontWeight.semiBold, color: colors.white },
  sectionCount: { fontSize: 13, color: colors.textTertiary },
  emptyDrops: { paddingVertical: spacing[6], alignItems: 'center' },
  emptyText: { fontSize: fontSize.sm, color: colors.textTertiary },

  devBtn: { marginTop: spacing[10], alignItems: 'center' },
  devBtnLabel: { fontSize: 12, color: colors.textTertiary },
})