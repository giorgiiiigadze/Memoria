import { getMyDrops, type DropWithParticipants } from '@/api/drops.api'
import { supabase } from '@/api/client'
import { selectProfile, selectUser, useAuthStore } from '@/store/auth.store'
import type { DropState } from '@/types/database.types'
import { Image } from 'expo-image'
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
  active:  { label: 'Active',   color: '#0044FF' },
  ready:   { label: 'Ready',    color: '#4CAF7D' },
  open:    { label: 'Open',     color: '#F59E0B' },
  expired: { label: 'Expired',  color: '#626262' },
}

export default function ProfileScreen() {
  const user = useAuthStore(selectUser)
  const profile = useAuthStore(selectProfile)
  const setProfile = useAuthStore(s => s.setProfile)
  const signOut = useAuthStore(s => s.signOut)

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
        const blob = await (await fetch(avatarUri)).blob()
        const { error: upErr } = await supabase.storage
          .from('avatars')
          .upload(path, blob, { upsert: true, contentType: `image/${ext}` })
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
          <TouchableOpacity style={s.signOutBtn} onPress={signOut} activeOpacity={0.7}>
            <Text style={s.signOutLabel}>Sign out</Text>
          </TouchableOpacity>
        </View>

        {/* Avatar + identity */}
        <View style={s.identity}>
          <TouchableOpacity onPress={editing ? pickAvatar : undefined} activeOpacity={editing ? 0.7 : 1}>
            {avatarSource ? (
              <Image source={avatarSource} style={s.avatar} contentFit="cover" />
            ) : (
              <View style={s.avatarPlaceholder}>
                <Text style={s.avatarInitial}>
                  {displayedName.charAt(0).toUpperCase() || '?'}
                </Text>
              </View>
            )}
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
                placeholderTextColor="#626262"
                maxLength={50}
                returnKeyType="next"
              />
              <Text style={s.fieldLabel}>Bio</Text>
              <TextInput
                style={[s.input, s.inputMulti]}
                value={bio}
                onChangeText={setBio}
                placeholder="A little about you"
                placeholderTextColor="#626262"
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
                    ? <ActivityIndicator color="#fff" size="small" />
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
              onPress={() => router.push(`/drop/${drop.id}` as any)}
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
  root: { flex: 1, backgroundColor: '#121212' },
  content: { paddingHorizontal: 24, paddingTop: 72, paddingBottom: 48 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 },
  heading: { fontSize: 22, fontWeight: '600', color: '#FFFFFF', letterSpacing: -0.5 },
  signOutBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, borderWidth: 0.5, borderColor: '#3B3B3B' },
  signOutLabel: { fontSize: 13, color: '#626262' },
  identity: { flexDirection: 'row', gap: 16, marginBottom: 36, alignItems: 'flex-start' },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#191919' },
  avatarPlaceholder: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#191919', borderWidth: 0.5, borderColor: '#3B3B3B',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { fontSize: 26, fontWeight: '600', color: '#C4C4C4' },
  avatarEditBadge: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.55)', borderBottomLeftRadius: 36, borderBottomRightRadius: 36,
    alignItems: 'center', paddingBottom: 4,
  },
  avatarEditBadgeLabel: { fontSize: 10, color: '#fff', fontWeight: '500' },
  identityInfo: { flex: 1, paddingTop: 4, gap: 4 },
  displayName: { fontSize: 17, fontWeight: '600', color: '#FFFFFF' },
  username: { fontSize: 13, color: '#898989' },
  bio: { fontSize: 13, color: '#C4C4C4', lineHeight: 18, marginTop: 4 },
  editBtn: { marginTop: 10, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, borderWidth: 0.5, borderColor: '#3B3B3B' },
  editBtnLabel: { fontSize: 13, color: '#C4C4C4' },
  editFields: { flex: 1, gap: 8 },
  fieldLabel: { fontSize: 11, fontWeight: '500', color: '#626262', textTransform: 'uppercase', letterSpacing: 0.4 },
  input: { backgroundColor: '#191919', borderWidth: 0.5, borderColor: '#3B3B3B', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#FFFFFF' },
  inputMulti: { height: 72, textAlignVertical: 'top' },
  errorText: { fontSize: 12, color: '#EA4942' },
  editActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  btnCancel: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 0.5, borderColor: '#3B3B3B', alignItems: 'center' },
  btnCancelLabel: { fontSize: 13, color: '#898989' },
  btnSave: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: '#0044FF', alignItems: 'center' },
  btnDisabled: { opacity: 0.5 },
  btnSaveLabel: { fontSize: 13, color: '#FFFFFF', fontWeight: '600' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  sectionCount: { fontSize: 13, color: '#626262' },
  emptyDrops: { paddingVertical: 24, alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#626262' },
  dropCard: {
    backgroundColor: '#191919', borderWidth: 0.5, borderColor: '#3B3B3B',
    borderRadius: 10, padding: 14, marginBottom: 8,
  },
  dropCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  dropTitle: { fontSize: 15, fontWeight: '600', color: '#FFFFFF', flex: 1, marginRight: 10 },
  badge: { borderWidth: 0.5, borderRadius: 5, paddingHorizontal: 7, paddingVertical: 3 },
  badgeLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  dropMeta: { fontSize: 12, color: '#626262' },
})
