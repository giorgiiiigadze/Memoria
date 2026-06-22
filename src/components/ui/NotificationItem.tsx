import type { NotificationWithMeta } from '@/api/notifications.api'
import { InitialAvatar } from '@/components/ui/InitialAvatar'
import { colors } from '@/theme'
import { notifText, timeAgo } from '@/utils/notifications'
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
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    gap: 12,
    backgroundColor: 'transparent',
  },
  itemUnread: { backgroundColor: 'rgba(255,255,255,0.05)' },
  avatarWrap: {
    position: 'relative',
    flexShrink: 0,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: colors.background,
  },
  itemBody: { flex: 1, gap: 3 },
  itemText: { fontSize: 14, color: '#FFFFFF', lineHeight: 20 },
  itemTime: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
})
