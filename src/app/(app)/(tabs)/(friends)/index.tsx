import { Chip } from '@/components/friends/Chip'
import { FriendSearchBar } from '@/components/friends/FriendSearchBar'
import { UserRow } from '@/components/friends/UserRow'
import { useFriends } from '@/hooks/useFriends'
import { colors, fontSize, fontWeight, spacing } from '@/theme'
import type { Profile } from '@/types/database.types'
import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

export default function FriendsScreen() {
  const { friends, incoming, outgoing, isLoaded, error, actionLoading, add, accept, decline, search, retry } = useFriends()
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

  function relationshipStatus(userId: string) {
    if (friends.some(f => f.id === userId)) return 'friends' as const
    if (outgoing.some(r => r.profile.id === userId)) return 'pending' as const
    if (incoming.some(r => r.profile.id === userId)) return 'incoming' as const
    return 'none' as const
  }

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">

      <View style={s.searchWrap}>
        <FriendSearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Search by username..."
        />
      </View>

      {isSearchMode && (
        <View style={s.section}>
          {searching ? (
            <ActivityIndicator color={colors.textTertiary} size="small" />
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
                    <Chip label="Friends" variant="muted" />
                  ) : status === 'pending' ? (
                    <Chip label="Pending" variant="muted" />
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
                      variant="blue"
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
          {friends.length > 0 && <Text style={s.sectionLabel}>Your friends</Text>}
          {!isLoaded ? null : friends.length === 0 ? (
            <Text style={s.empty}>No friends yet.{'\n'}Search for people to add.</Text>
          ) : (
            friends.map(profile => <UserRow key={profile.id} profile={profile} />)
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
section: { marginBottom: spacing[8] },
  sectionLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing[3],
  },
  empty: { fontSize: fontSize.sm, color: colors.textTertiary, textAlign: 'center', paddingVertical: spacing[6], lineHeight: 22 },
  requestActions: { flexDirection: 'row' },
  errorBox: { alignItems: 'center', paddingVertical: spacing[10], gap: spacing[3] },
  errorMsg: { fontSize: fontSize.sm, color: colors.textTertiary, textAlign: 'center' },
  retryText: { fontSize: fontSize.sm, color: colors.primary, fontWeight: fontWeight.medium },
})
