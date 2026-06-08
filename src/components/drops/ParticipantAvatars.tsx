import type { DropWithParticipants } from '@/api/drops.api'
import { InitialAvatar } from '@/components/ui/InitialAvatar'
import { colors, fontSize } from '@/theme'
import { StyleSheet, Text, View } from 'react-native'

const PARTICIPANT_AVATAR_SIZE = 28
const PARTICIPANT_OVERLAP = 10
const MAX_VISIBLE_PARTICIPANTS = 5

export function ParticipantAvatars({ participants }: { participants: DropWithParticipants['participants'] }) {
  const visible = participants.slice(0, MAX_VISIBLE_PARTICIPANTS)
  const extra = participants.length - MAX_VISIBLE_PARTICIPANTS

  if (visible.length === 0) return null

  return (
    <View style={s.participantRow}>
      {visible.map((p, i) => (
        <View
          key={p.id}
          style={[
            s.participantAvatar,
            { marginLeft: i === 0 ? 0 : -PARTICIPANT_OVERLAP, zIndex: MAX_VISIBLE_PARTICIPANTS - i },
          ]}
        >
          <InitialAvatar
            name={p.profile?.display_name ?? p.profile?.username ?? '?'}
            avatarUrl={p.profile?.avatar_url}
            size={PARTICIPANT_AVATAR_SIZE}
          />
        </View>
      ))}
      {extra > 0 && (
        <View style={[s.participantAvatar, s.extraBubble, { marginLeft: -PARTICIPANT_OVERLAP }]}>
          <Text style={s.extraText}>+{extra}</Text>
        </View>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantAvatar: {
    borderRadius: 999,
    overflow: 'hidden',
  },
  extraBubble: {
    width: PARTICIPANT_AVATAR_SIZE,
    height: PARTICIPANT_AVATAR_SIZE,
    borderRadius: PARTICIPANT_AVATAR_SIZE / 2,
    backgroundColor: colors.surfaceDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  extraText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: '600',
  },
})
