import { FriendRow } from '@/components/friends/FriendRow'
import { FriendSearchBar } from '@/components/friends/FriendSearchBar'
import { TabBarContext } from '@/context/TabBarContext'
import { useDropsStore } from '@/store/drops.store'
import { useFriendsStore } from '@/store/friends.store'
import { colors, fontSize, fontWeight, radii, spacing } from '@/theme'
import { router, useFocusEffect } from 'expo-router'
import { use, useMemo, useState } from 'react'
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

export default function InviteScreen() {
  const { setIsTabBarHidden } = use(TabBarContext)
  const { draft, setDraftInvitedIds } = useDropsStore()
  const friends = useFriendsStore(s => s.friends)
  const [query, setQuery] = useState('')

  useFocusEffect(() => {
    setIsTabBarHidden(true)
    return () => setIsTabBarHidden(false)
  })

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return friends
    return friends.filter(f =>
      (f.display_name ?? '').toLowerCase().includes(q) ||
      f.username.toLowerCase().includes(q),
    )
  }, [friends, query])

  function toggle(id: string) {
    const next = draft.invitedIds.includes(id)
      ? draft.invitedIds.filter(x => x !== id)
      : [...draft.invitedIds, id]
    setDraftInvitedIds(next)
  }

  const count = draft.invitedIds.length

  return (
    <View style={s.root}>
      <View style={s.searchWrap}>
        <FriendSearchBar value={query} onChangeText={setQuery} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {friends.length === 0 ? (
          <Text style={s.empty}>You haven't added any friends yet.</Text>
        ) : filtered.length === 0 ? (
          <Text style={s.empty}>No friends match “{query.trim()}”.</Text>
        ) : (
          filtered.map(friend => (
            <FriendRow
              key={friend.id}
              friend={friend}
              selected={draft.invitedIds.includes(friend.id)}
              onPress={toggle}
            />
          ))
        )}
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity
          style={s.btn}
          onPress={() => router.push('/(app)/(create)/confirm' as any)}
          activeOpacity={0.8}
        >
          <Text style={s.btnLabel}>
            {count > 0 ? `Next  ·  ${count} invited` : 'Skip'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  searchWrap: {
    paddingHorizontal: spacing[2.5],
    paddingTop: spacing[4],
    paddingBottom: spacing[2],
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: spacing[2.5],
    paddingTop: spacing[1],
    paddingBottom: spacing[6],
  },
  empty: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    textAlign: 'center',
    paddingVertical: spacing[8],
  },
  footer: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[2],
    paddingBottom: spacing[10],
  },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: radii.sm,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnLabel: { fontSize: 15, fontWeight: fontWeight.medium, color: colors.white },
})