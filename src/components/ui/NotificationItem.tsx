import type { NotificationWithMeta } from '@/api/notifications.api'
import { InitialAvatar } from '@/components/ui/InitialAvatar'
import { selectProfile, selectUser, useAuthStore } from '@/store/auth.store'
import { colors, fontSize, spacing } from '@/theme'
import { notifText, timeAgo } from '@/utils/notifications'
import { Image } from 'expo-image'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

const AVATAR_SIZE = 42
const DUAL_SIZE = 28
const DUAL_OFFSET = AVATAR_SIZE - DUAL_SIZE // 14 — second avatar shifts by this much

type Props = {
  item: NotificationWithMeta
  onPress: (item: NotificationWithMeta) => void
}

function DualAvatar({ creatorName, creatorUrl, userName, userUrl }: {
  creatorName: string
  creatorUrl?: string | null
  userName: string
  userUrl?: string | null
}) {
  return (
    <View style={styles.dualWrap}>
      <View style={styles.dualTop}>
        <InitialAvatar name={creatorName} avatarUrl={creatorUrl ?? undefined} size={DUAL_SIZE} />
      </View>
      <View style={styles.dualBottom}>
        <InitialAvatar name={userName} avatarUrl={userUrl ?? undefined} size={DUAL_SIZE} />
      </View>
    </View>
  )
}

export default function NotificationItem({ item, onPress }: Props) {
  const actor = item.actor
  const actorName = actor?.display_name ?? actor?.username ?? '?'
  const me = useAuthStore(selectProfile)
  const myId = useAuthStore(selectUser)?.id
  const isDrop = !!item.drop_id
  const creatorIsMe = isDrop && item.drop?.creator?.id === myId

  return (
    <TouchableOpacity
      style={[styles.item, !item.read && styles.itemUnread]}
      onPress={() => onPress(item)}
      activeOpacity={0.75}
    >
      <View style={styles.avatarWrap}>
        {isDrop && !creatorIsMe ? (
          <DualAvatar
            creatorName={item.drop?.creator?.display_name ?? 'Drop'}
            creatorUrl={item.drop?.creator?.avatar_url}
            userName={me?.display_name ?? me?.username ?? '?'}
            userUrl={me?.avatar_url}
          />
        ) : (
          <InitialAvatar
            name={actorName}
            avatarUrl={actor?.avatar_url ?? undefined}
            size={AVATAR_SIZE}
          />
        )}
        {!item.read && <View style={styles.badge} />}
      </View>

      <View style={styles.itemBody}>
        <Text style={styles.itemText}>{notifText(item)}</Text>
        <Text style={styles.itemTime}>{timeAgo(item.created_at)}</Text>
      </View>

      {item.drop?.thumbnail_url ? (
        <Image
          source={{ uri: item.drop.thumbnail_url }}
          style={styles.thumbnail}
          contentFit="cover"
        />
      ) : null}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[2.5],
    paddingVertical: 12,
    gap: 12,
    backgroundColor: 'transparent',
  },
  itemUnread: { backgroundColor: colors.surface },
  avatarWrap: {
    position: 'relative',
    flexShrink: 0,
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
  },
  dualWrap: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    position: 'relative',
  },
  dualTop: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  dualBottom: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderRadius: DUAL_SIZE / 2,
    borderWidth: 2,
    borderColor: colors.background,
  },
  badge: {
    position: 'absolute',
    bottom: 0,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.blueNotif,
    borderWidth: 1.5,
    borderColor: colors.background,
  },
  itemBody: { flex: 1, gap: 3 },
  thumbnail: { width: 44, height: 44, borderRadius: 4, flexShrink: 0 },
  itemText: { fontSize: fontSize.sm, color: colors.white, lineHeight: 20 },
  itemTime: { fontSize: fontSize.xs, color: colors.textTertiary },
})
