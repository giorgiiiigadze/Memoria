import { useFriends } from '@/hooks/useFriends'
import { Chip } from '@/components/friends/Chip'
import { UserRow } from '@/components/friends/UserRow'
import type { Profile } from '@/types/database.types'
import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'

export default function FriendsScreen() {
  const { friends, incoming, outgoing, isLoaded, actionLoading, add, accept, decline, search } = useFriends()
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Profile[]>([])
  const [searching, setSearching] = useState(false)
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current)
    if (query.trim().length < 2) { setSearchResults([]); return }

    debounce.current = setTimeout(async () => {
      setSearching(true)
      try { setSearchResults((await search(query)) ?? []) }
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

      <Text style={s.title}>Friends</Text>

      {/* ── Search ─────────────────────────────── */}
      <View style={s.searchRow}>
        <TextInput
          style={s.searchInput}
          placeholder="Search by username..."
          placeholderTextColor="#626262"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {searching && <ActivityIndicator style={s.searchSpinner} color="#898989" size="small" />}
      </View>

      {/* ── Search results ──────────────────────── */}
      {isSearchMode && (
        <View style={s.section}>
          {!searching && searchResults.length === 0 ? (
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

      {/* ── Incoming requests ───────────────────── */}
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

      {/* ── Friends list ────────────────────────── */}
      {!isSearchMode && (
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

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000000' },
  content: { paddingHorizontal: 24, paddingTop: 80, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: '600', color: '#FFFFFF', letterSpacing: -0.5, marginBottom: 20 },
  searchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  searchInput: {
    flex: 1,
    backgroundColor: '#191919',
    borderWidth: 0.5,
    borderColor: '#3B3B3B',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: '#FFFFFF',
  },
  searchSpinner: { marginLeft: 10 },
  section: { marginBottom: 28 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#626262',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  empty: { fontSize: 14, color: '#626262', textAlign: 'center', paddingVertical: 24, lineHeight: 22 },
  requestActions: { flexDirection: 'row' },
})
