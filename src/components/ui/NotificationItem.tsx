import type { NotificationWithMeta } from '@/api/notifications.api'
import { InitialAvatar } from '@/components/ui/InitialAvatar'
import { colors, fontSize, spacing } from '@/theme'
import { notifText, timeAgo } from '@/utils/notifications'
import { Image } from 'expo-image'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

type Props = {
  item: NotificationWithMeta
  onPress: (item: NotificationWithMeta) => void
}

export default function NotificationItem({ item, onPress }: Props) {
  const actor = item.actor
  const actorName = actor?.display_name ?? actor?.username ?? '?'

  return (
    <TouchableOpacity
      style={[styles.item, !item.read && styles.itemUnread]}
      onPress={() => onPress(item)}
      activeOpacity={0.75}
    >
      <View style={styles.avatarWrap}>
        <InitialAvatar
          name={actorName}
          avatarUrl={actor?.avatar_url ?? undefined}
          size={42}
        />
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
