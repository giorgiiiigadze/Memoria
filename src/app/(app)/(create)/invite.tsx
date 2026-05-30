import { useDropsStore } from '@/store/drops.store'
import { useFriendsStore } from '@/store/friends.store'
import type { Profile } from '@/types/database.types'
import { router } from 'expo-router'
import { Image } from 'expo-image'
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

export default function InviteScreen() {
  const { draft, setDraftInvitedIds } = useDropsStore()
  const friends = useFriendsStore(s => s.friends)

  function toggle(id: string) {
    const next = draft.invitedIds.includes(id)
      ? draft.invitedIds.filter(x => x !== id)
      : [...draft.invitedIds, id]
    setDraftInvitedIds(next)
  }

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content}>

      <Text style={s.title}>Invite friends</Text>
      <Text style={s.subtitle}>Who's in on this drop?</Text>

      {friends.length === 0 ? (
        <Text style={s.empty}>You haven't added any friends yet.</Text>
      ) : (
        friends.map(friend => {
          const selected = draft.invitedIds.includes(friend.id)
          return (
            <TouchableOpacity
              key={friend.id}
              style={[s.row, selected && s.rowSelected]}
              onPress={() => toggle(friend.id)}
              activeOpacity={0.7}
            >
              <Avatar profile={friend} />
              <View style={s.info}>
                <Text style={s.name}>{friend.display_name ?? friend.username}</Text>
                <Text style={s.handle}>@{friend.username}</Text>
              </View>
              <View style={[s.check, selected && s.checkSelected]}>
                {selected && <Text style={s.checkMark}>✓</Text>}
              </View>
            </TouchableOpacity>
          )
        })
      )}

      <TouchableOpacity
        style={s.btn}
        onPress={() => router.push('/(app)/(create)/confirm')}
        activeOpacity={0.8}
      >
        <Text style={s.btnLabel}>
          {draft.invitedIds.length > 0 ? `Next  (${draft.invitedIds.length} invited)` : 'Skip'}
        </Text>
      </TouchableOpacity>

    </ScrollView>
  )
}

function Avatar({ profile }: { profile: Profile }) {
  const initial = (profile.display_name ?? profile.username).charAt(0).toUpperCase()
  return (
    <View style={s.avatar}>
      {profile.avatar_url
        ? <Image source={{ uri: profile.avatar_url }} style={s.avatarImg} contentFit="cover" />
        : <Text style={s.avatarInitial}>{initial}</Text>}
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000000' },
  content: { paddingHorizontal: 24, paddingTop: 80, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: '600', color: '#FFFFFF', letterSpacing: -0.5, marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#626262', marginBottom: 28 },
  empty: { fontSize: 14, color: '#626262', textAlign: 'center', paddingVertical: 32 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 6,
  },
  rowSelected: { backgroundColor: '#0A1A40' },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#252525',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarImg: { width: 42, height: 42, borderRadius: 21 },
  avatarInitial: { fontSize: 16, fontWeight: '500', color: '#898989' },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '500', color: '#FFFFFF' },
  handle: { fontSize: 12, color: '#626262', marginTop: 1 },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#3B3B3B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkSelected: { backgroundColor: '#0044FF', borderColor: '#0044FF' },
  checkMark: { fontSize: 12, color: '#FFFFFF', fontWeight: '700' },
  btn: {
    backgroundColor: '#0044FF',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  btnLabel: { fontSize: 15, fontWeight: '500', color: '#FFFFFF' },
})
