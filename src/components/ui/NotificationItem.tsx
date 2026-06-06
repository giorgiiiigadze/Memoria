import type { NotificationWithMeta } from '@/api/notifications.api'
import { notifText, timeAgo } from '@/utils/notifications'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

type Props = {
  item: NotificationWithMeta
  onPress: (item: NotificationWithMeta) => void
}

export default function NotificationItem({ item, onPress }: Props) {
  return (
    <TouchableOpacity
      style={[styles.item, !item.read && styles.itemUnread]}
      onPress={() => onPress(item)}
      activeOpacity={0.75}
    >
      {!item.read && <View style={styles.dot} />}
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
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    gap: 10,
    backgroundColor: 'transparent',
  },
  itemUnread: { backgroundColor: 'rgba(255,255,255,0.07)' },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#5B8CFF',
    marginTop: 5,
    flexShrink: 0,
  },
  itemBody: { flex: 1, gap: 4 },
  itemText: { fontSize: 14, color: '#FFFFFF', lineHeight: 20 },
  itemTime: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
})
