import { findProfilesByPhones, sendRequest, getFriends, getOutgoingRequests } from '@/api/friends.api'
import { Chip } from '@/components/friends/Chip'
import { UserRowSkeleton } from '@/components/friends/UserRow'
import { GlassIconButton } from '@/components/ui/GlassIconButton'
import { InitialAvatar } from '@/components/ui/InitialAvatar'
import { selectUser, useAuthStore } from '@/store/auth.store'
import { colors, fontSize, fontWeight, spacing } from '@/theme'
import { SymbolView } from 'expo-symbols'
import type { Profile } from '@/types/database.types'
import { Contact, ContactField, getPermissionsAsync, requestPermissionsAsync } from 'expo-contacts'
import { router } from 'expo-router'
import { Share } from 'react-native'
import { useEffect, useState } from 'react'
import {
  Alert,
  Linking,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type ProfileMatch = Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url' | 'phone'>

type ContactItem =
  | { kind: 'matched'; name: string; profile: ProfileMatch }
  | { kind: 'unmatched'; name: string; phone: string }

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (raw.trim().startsWith('+')) return `+${digits}`
  if (digits.length === 10) return `+1${digits}`
  return `+${digits}`
}

export default function ContactsScreen() {
  const user = useAuthStore(selectUser)
  const insets = useSafeAreaInsets()

  type PermStatus = 'unknown' | 'granted' | 'denied'
  const [permStatus, setPermStatus] = useState<PermStatus>('unknown')
  const [loading, setLoading] = useState(false)
  const [matched, setMatched] = useState<ContactItem[]>([])
  const [unmatched, setUnmatched] = useState<ContactItem[]>([])
  const [friendIds, setFriendIds] = useState<Set<string>>(new Set())
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    checkAndLoad()
  }, [])

  async function checkAndLoad() {
    const { status } = await getPermissionsAsync()
    if (status === 'granted') {
      setPermStatus('granted')
      loadContacts()
    } else if (status === 'denied') {
      setPermStatus('denied')
    } else {
      requestPermission()
    }
  }

  async function requestPermission() {
    const { status } = await requestPermissionsAsync()
    if (status === 'granted') {
      setPermStatus('granted')
      loadContacts()
    } else {
      setPermStatus('denied')
    }
  }

  async function loadContacts() {
    if (!user) return
    setLoading(true)
    try {
      const contacts = await Contact.getAllDetails([ContactField.FULL_NAME, ContactField.PHONES])

      // Build a map: normalizedPhone → contact name
      const phoneToName = new Map<string, string>()
      for (const contact of contacts) {
        if (!contact.phones?.length) continue
        const name = contact.fullName ?? 'Unknown'
        for (const pn of contact.phones) {
          if (!pn.number) continue
          const normalized = normalizePhone(pn.number)
          if (normalized.length >= 8) phoneToName.set(normalized, name)
        }
      }

      const allPhones = Array.from(phoneToName.keys())
      const [profiles, friends, outgoing] = await Promise.all([
        findProfilesByPhones(allPhones, user.id),
        getFriends(user.id),
        getOutgoingRequests(user.id),
      ])

      setFriendIds(new Set(friends.map(f => f.id)))
      setPendingIds(new Set(outgoing.map(r => r.profile.id)))

      // Build phone → profile map for matched lookup
      const profileByPhone = new Map<string, typeof profiles[0]>()
      for (const p of profiles) {
        if (p.phone) profileByPhone.set(p.phone, p)
      }

      const matchedList: ContactItem[] = []
      const unmatchedList: ContactItem[] = []
      const seenProfileIds = new Set<string>()
      const seenUnmatchedPhones = new Set<string>()

      for (const [phone, name] of phoneToName.entries()) {
        const profile = profileByPhone.get(phone)
        if (profile) {
          if (!seenProfileIds.has(profile.id)) {
            seenProfileIds.add(profile.id)
            matchedList.push({ kind: 'matched', name, profile })
          }
        } else {
          if (!seenUnmatchedPhones.has(phone)) {
            seenUnmatchedPhones.add(phone)
            unmatchedList.push({ kind: 'unmatched', name, phone })
          }
        }
      }

      matchedList.sort((a, b) => a.name.localeCompare(b.name))
      unmatchedList.sort((a, b) => a.name.localeCompare(b.name))
      setMatched(matchedList)
      setUnmatched(unmatchedList)
    } catch (e) {
      console.error('[contacts] load error:', e)
      Alert.alert('Error', 'Could not load contacts. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd(profileId: string) {
    if (!user || actionLoading) return
    setActionLoading(profileId)
    try {
      await sendRequest(user.id, profileId)
      setPendingIds(prev => new Set(prev).add(profileId))
    } catch {
      Alert.alert('Error', 'Could not send friend request.')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleInvite(name: string) {
    await Share.share({
      message: `Hey ${name}! I'm using Memoria to share moments with friends. Join me!`,
    })
  }

  const sections: { title: string; data: ContactItem[] }[] = [
    ...(matched.length > 0 ? [{ title: 'On Memoria', data: matched }] : []),
    ...(unmatched.length > 0 ? [{ title: 'Invite Friends', data: unmatched }] : []),
  ]

  if (permStatus === 'denied') {
    return (
      <View style={[s.root, s.center, { paddingTop: insets.top }]}>
        <Text style={s.permTitle}>Contacts Access Needed</Text>
        <Text style={s.permSub}>Allow Memoria to access your contacts to find friends on the app.</Text>
        <TouchableOpacity style={s.openSettings} onPress={() => Linking.openSettings()} activeOpacity={0.8}>
          <Text style={s.openSettingsText}>Open Settings</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <GlassIconButton onPress={() => router.back()}>
          <SymbolView name="chevron.left" size={18} tintColor={colors.white} resizeMode="scaleAspectFit" />
        </GlassIconButton>
        <Text style={s.title}>Find Friends</Text>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <View style={s.content}>
          <UserRowSkeleton />
          <UserRowSkeleton />
          <UserRowSkeleton />
          <UserRowSkeleton />
          <UserRowSkeleton />
        </View>
      ) : sections.length === 0 ? (
        <View style={[s.content, s.center]}>
          <Text style={s.emptyTitle}>No contacts found</Text>
          <Text style={s.emptySub}>None of your contacts are on Memoria yet.</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item, index) => {
            if (item.kind === 'matched') return item.profile.id
            return item.phone + index
          }}
          contentContainerStyle={s.listContent}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <Text style={s.sectionLabel}>{section.title}</Text>
          )}
          renderItem={({ item }) => {
            if (item.kind === 'matched') {
              const isFriend = friendIds.has(item.profile.id)
              const isPending = pendingIds.has(item.profile.id)
              const isLoading = actionLoading === item.profile.id
              return (
                <View style={s.row}>
                  <InitialAvatar
                    name={item.name}
                    avatarUrl={item.profile.avatar_url}
                    size={62}
                  />
                  <View style={s.rowInfo}>
                    <Text style={s.rowName}>{item.name}</Text>
                    <Text style={s.rowHandle}>@{item.profile.username}</Text>
                  </View>
                  {isFriend ? (
                    <Chip label="Friends" variant="muted" />
                  ) : isPending ? (
                    <Chip label="Pending" variant="muted" />
                  ) : (
                    <Chip
                      label={isLoading ? '…' : 'Add'}
                      variant="white"
                      onPress={() => handleAdd(item.profile.id)}
                      disabled={!!actionLoading}
                    />
                  )}
                </View>
              )
            }

            return (
              <View style={s.row}>
                <InitialAvatar name={item.name} size={48} />
                <View style={s.rowInfo}>
                  <Text style={s.rowName}>{item.name}</Text>
                  <Text style={s.rowHandle}>{item.phone}</Text>
                </View>
                <Chip
                  label="Invite"
                  variant="muted"
                  onPress={() => handleInvite(item.name)}
                />
              </View>
            )
          }}
        />
      )}
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  title: { fontSize: fontSize.md, fontWeight: fontWeight.semiBold, color: colors.textPrimary },
  content: { padding: spacing[4] },
  listContent: { paddingHorizontal: spacing[4], paddingBottom: spacing[10] },
  sectionLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semiBold,
    color: colors.white,
    marginTop: spacing[6],
    marginBottom: spacing[3],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: spacing[2],
  },
  rowInfo: { flex: 1 },
  rowName: { fontSize: 17, fontWeight: fontWeight.semiBold, color: colors.white },
  rowHandle: { fontSize: fontSize.xs, color: colors.textTertiary, marginTop: 1 },
  permTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semiBold,
    color: colors.textPrimary,
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  permSub: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing[8],
    marginBottom: spacing[6],
  },
  openSettings: {
    backgroundColor: colors.surfaceRaised,
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderRadius: 999,
  },
  openSettingsText: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.textPrimary },
  emptyTitle: {
    fontSize: 17,
    fontWeight: fontWeight.semiBold,
    color: colors.textPrimary,
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  emptySub: { fontSize: 14, color: colors.textPrimary, textAlign: 'center', lineHeight: 20 },
})
