import { CreateFlowHeader } from '@/components/ui/CreateFlowHeader'
import { InitialAvatar } from '@/components/ui/InitialAvatar'
import { useDropsStore } from '@/store/drops.store'
import { useFriendsStore } from '@/store/friends.store'
import { colors, fontSize, fontWeight, radii, spacing } from '@/theme'
import type { Profile } from '@/types/database.types'
import { router } from 'expo-router'
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
    <View style={s.root}>
      <CreateFlowHeader variant="back" />
      <ScrollView style={s.scroll} contentContainerStyle={s.content}>

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
                <FriendAvatar profile={friend} />
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
          onPress={() => router.push('/(app)/(create)/confirm' as any)}
          activeOpacity={0.8}
        >
          <Text style={s.btnLabel}>
            {draft.invitedIds.length > 0 ? `Next  (${draft.invitedIds.length} invited)` : 'Skip'}
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  )
}

function FriendAvatar({ profile }: { profile: Profile }) {
  const name = profile.display_name ?? profile.username
  return (
    <View style={s.avatarWrap}>
      <InitialAvatar name={name} avatarUrl={profile.avatar_url} size={42} />
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
    paddingBottom: spacing[10],
  },
  title: {
    fontSize: 26,
    fontWeight: fontWeight.semiBold,
    color: colors.white,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: { fontSize: fontSize.sm, color: colors.textTertiary, marginBottom: 28 },
  empty: { fontSize: fontSize.sm, color: colors.textTertiary, textAlign: 'center', paddingVertical: spacing[8] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    paddingHorizontal: 14,
    borderRadius: radii.sm,
    marginBottom: spacing[1],
  },
  rowSelected: { backgroundColor: '#0A1A40' },
  avatarWrap: { marginRight: spacing[3] },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: fontWeight.medium, color: colors.white },
  handle: { fontSize: fontSize.xs, color: colors.textTertiary, marginTop: 1 },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.borderDefault,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkMark: { fontSize: 12, color: colors.white, fontWeight: fontWeight.strong },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: radii.sm,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing[5],
  },
  btnLabel: { fontSize: 15, fontWeight: fontWeight.medium, color: colors.white },
})
