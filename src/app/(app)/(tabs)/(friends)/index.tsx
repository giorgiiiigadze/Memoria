import { findProfilesByPhones } from '@/api/friends.api'
import { Chip } from '@/components/friends/Chip'
import { FriendSearchBar } from '@/components/friends/FriendSearchBar'
import { UserRow, UserRowSkeleton } from '@/components/friends/UserRow'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { InitialAvatar } from '@/components/ui/InitialAvatar'
import { useFriends } from '@/hooks/useFriends'
import { selectProfile, selectUser, useAuthStore } from '@/store/auth.store'
import { useFriendsStore } from '@/store/friends.store'
import { colors, fontSize, fontWeight, glass, radii, spacing } from '@/theme'
import type { Profile } from '@/types/database.types'
import { Contact, ContactField, getPermissionsAsync } from 'expo-contacts'
import { router, useFocusEffect } from 'expo-router'
import { SymbolView } from 'expo-symbols'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

const SUGGESTED_LIMIT = 3

type SuggestedProfile = Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url' | 'phone'> & { contactName: string }

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (raw.trim().startsWith('+')) return `+${digits}`
  if (digits.length === 10) return `+1${digits}`
  return `+${digits}`
}

export default function FriendsScreen() {
  const user = useAuthStore(selectUser)
  const profile = useAuthStore(selectProfile)
  const { friends, incoming, outgoing, isLoaded, error, actionLoading, add, accept, decline, search, refresh, retry } = useFriends()

  const [suggested, setSuggested] = useState<SuggestedProfile[]>([])
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set())

  useFocusEffect(
    useCallback(() => {
      refresh()
      loadSuggested()
    }, [])
  )

  async function loadSuggested() {
    if (!user) return
    try {
      const { status } = await getPermissionsAsync()
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

      const { friends: currentFriends, outgoing: currentOutgoing, incoming: currentIncoming } = useFriendsStore.getState()
      const friendIds = new Set(currentFriends.map(f => f.id))
      const pendingIds = new Set(currentOutgoing.map(r => r.profile.id))
      const incomingIds = new Set(currentIncoming.map(r => r.profile.id))

      const results: SuggestedProfile[] = []
      const seen = new Set<string>()
      for (const p of profiles) {
        if (seen.has(p.id)) continue
        if (friendIds.has(p.id) || pendingIds.has(p.id) || incomingIds.has(p.id)) continue
        seen.add(p.id)
        const contactName = p.phone ? (phoneToName.get(p.phone) ?? p.display_name ?? p.username ?? '') : ''
        results.push({ ...p, contactName })
        if (results.length >= SUGGESTED_LIMIT) break
      }
      setSuggested(results)
    } catch {
      // suggestions are best-effort, fail silently
    }
  }

  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Profile[]>([])
  const [searching, setSearching] = useState(false)
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current)
    if (query.trim().length < 2) { setSearchResults([]); return }

    debounce.current = setTimeout(async () => {
      setSearching(true)
      try { setSearchResults(((await search(query)) ?? []) as Profile[]) }
      catch { setSearchResults([]) }
      finally { setSearching(false) }
    }, 400)

    return () => { if (debounce.current) clearTimeout(debounce.current) }
  }, [query])

  const isSearchMode = query.trim().length >= 2

  function handleInviteFriends() {
    router.push('/(app)/(tabs)/(friends)/invite')
  }

  function relationshipStatus(userId: string) {
    if (friends.some(f => f.id === userId)) return 'friends' as const
    if (outgoing.some(r => r.profile.id === userId)) return 'pending' as const
    if (incoming.some(r => r.profile.id === userId)) return 'incoming' as const
    return 'none' as const
  }

  async function handleAddSuggested(profileId: string) {
    await add(profileId)
    setAddedIds(prev => new Set(prev).add(profileId))
  }

  const visibleSuggested = suggested.filter(p => !addedIds.has(p.id))

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">

      <View style={s.searchWrap}>
        <FriendSearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Search by username..."
        />
      </View>

      {!isSearchMode && (
        <GlassSurface
          onPress={handleInviteFriends}
          isInteractive
          colorScheme="dark"
          tintColor={glass.tint.panel}
          style={s.inviteCard}
          fallbackStyle={s.inviteCardFallback}
          pressedOpacity={0.85}
        >
          <InitialAvatar
            name={profile?.display_name || profile?.username || '?'}
            avatarUrl={profile?.avatar_url}
            size={34}
          />
          <View style={s.inviteText}>
            <Text style={s.inviteTitle}>Invite your friends</Text>
            <Text style={s.inviteSubtitle}>Invite your people. Fill a Drop together.</Text>
          </View>
          <SymbolView name="square.and.arrow.up" size={26} tintColor={colors.white} weight="semibold" />
        </GlassSurface>
      )}

      {!isSearchMode && visibleSuggested.length > 0 && (
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionLabel}>Suggested</Text>
            <TouchableOpacity onPress={() => router.push('/(app)/(tabs)/(friends)/contacts')} activeOpacity={0.7}>
              <Text style={s.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          {visibleSuggested.map(profile => (
            <View key={profile.id} style={s.row}>
              <InitialAvatar
                name={profile.contactName || profile.display_name || profile.username || '?'}
                avatarUrl={profile.avatar_url}
                size={48}
              />
              <View style={s.rowInfo}>
                <Text style={s.rowName}>{profile.contactName || profile.display_name}</Text>
                <Text style={s.rowHandle}>@{profile.username}</Text>
              </View>
              <Chip
                label="Add"
                variant="white"
                onPress={() => handleAddSuggested(profile.id)}
                disabled={actionLoading}
              />
            </View>
          ))}
        </View>
      )}

      {isSearchMode && (
        <View style={s.section}>
          {searching ? (
            <>
              <UserRowSkeleton />
              <UserRowSkeleton />
              <UserRowSkeleton />
            </>
          ) : searchResults.length === 0 ? (
            <Text style={s.empty}>No users found.</Text>
          ) : (
            searchResults.map(user => {
              const status = relationshipStatus(user.id)
              const incomingReq = status === 'incoming'
                ? incoming.find(r => r.profile.id === user.id)
                : undefined

              return (
                <UserRow key={user.id} profile={user} right={
                  status === 'friends' ? (
                    <Chip label="Friends" variant="card" />
                  ) : status === 'pending' ? (
                    <Chip label="Pending" variant="card" />
                  ) : status === 'incoming' ? (
                    <Chip
                      label="Accept"
                      variant="green"
                      onPress={() => incomingReq && accept(incomingReq.friendship.id)}
                      disabled={actionLoading}
                    />
                  ) : (
                    <Chip
                      label="Add"
                      variant="white"
                      onPress={() => add(user.id)}
                      disabled={actionLoading}
                    />
                  )
                } />
              )
            })
          )}
        </View>
      )}

      {!isSearchMode && incoming.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionLabel}>Requests</Text>
          {incoming.map(({ friendship, profile }) => (
            <UserRow key={friendship.id} profile={profile} right={
              <View style={s.requestActions}>
                <Chip
                  label="Accept"
                  variant="green"
                  onPress={() => accept(friendship.id)}
                  disabled={actionLoading}
                />
                <Chip
                  label="Decline"
                  variant="muted"
                  onPress={() => decline(friendship.id)}
                  disabled={actionLoading}
                  style={{ marginLeft: 8 }}
                />
              </View>
            } />
          ))}
        </View>
      )}

      {!isSearchMode && isLoaded && error && (
        <View style={s.errorBox}>
          <Text style={s.errorMsg}>{error}</Text>
          <TouchableOpacity onPress={retry} activeOpacity={0.7}>
            <Text style={s.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      )}

      {!isSearchMode && !error && (
        <View style={s.section}>
          {!isLoaded ? null : friends.length === 0 ? (
            <Text style={s.empty}>No friends yet.{'\n'}Search for people to add.</Text>
          ) : (
            <>
              {visibleSuggested.length > 0 && <Text style={s.sectionLabel}>Your friends</Text>}
              {friends.map(profile => <UserRow key={profile.id} profile={profile} since={profile.friendsSince} />)}
            </>
          )}
        </View>
      )}

    </ScrollView>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing[10], paddingTop: spacing[5], paddingHorizontal: spacing[2.5] },
  searchWrap: { marginBottom: spacing[6] },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[3] },
  section: { marginBottom: spacing[8] },
  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semiBold,
    color: colors.white,
    paddingTop: spacing[4],
    paddingBottom: spacing[2],
    textTransform: 'capitalize',
  },
  inviteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.lg,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
    marginBottom: spacing[6],
    gap: spacing[3],
  },
  inviteCardFallback: {
    backgroundColor: glass.fallback.panel,
  },
  inviteText: { flex: 1 },
  inviteTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semiBold,
    color: colors.textPrimary,
  },
  inviteSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    marginTop: 2,
    lineHeight: 20,
  },
  seeAll: { fontSize: fontSize.sm, color: colors.accent },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: spacing[2] },
  rowInfo: { flex: 1 },
  rowName: { fontSize: 17, fontWeight: fontWeight.semiBold, color: colors.white },
  rowHandle: { fontSize: fontSize.xs, color: colors.textTertiary, marginTop: 1 },
  empty: { fontSize: fontSize.sm, color: colors.textTertiary, textAlign: 'center', paddingVertical: spacing[6], lineHeight: 22 },
  requestActions: { flexDirection: 'row' },
  errorBox: { alignItems: 'center', paddingVertical: spacing[10], gap: spacing[3] },
  errorMsg: { fontSize: fontSize.sm, color: colors.textTertiary, textAlign: 'center' },
  retryText: { fontSize: fontSize.sm, color: colors.primary, fontWeight: fontWeight.medium },
})
