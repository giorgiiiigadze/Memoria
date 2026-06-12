import { InitialAvatar } from '@/components/ui/InitialAvatar'
import { colors, fontSize, fontWeight, radii } from '@/theme'
import type { Profile } from '@/types/database.types'
import { Ionicons } from '@expo/vector-icons'
import { memo } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

interface FriendRowProps {
  friend: Profile
  selected: boolean
  onPress: (id: string) => void
}

function FriendRowComponent({ friend, selected, onPress }: FriendRowProps) {
  const name = friend.display_name ?? friend.username
  return (
    <TouchableOpacity
      style={[s.row, selected && s.rowSelected]}
      onPress={() => onPress(friend.id)}
      activeOpacity={0.7}
    >
      <InitialAvatar name={name} avatarUrl={friend.avatar_url} size={44} />
      <View style={s.info}>
        <Text style={s.name} numberOfLines={1}>{name}</Text>
        <Text style={s.handle} numberOfLines={1}>@{friend.username}</Text>
      </View>
      <View style={[s.check, selected && s.checkSelected]}>
        {selected && <Ionicons name="checkmark" size={14} color={colors.white} />}
      </View>
    </TouchableOpacity>
  )
}

export const FriendRow = memo(FriendRowComponent)

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radii.sm,
    marginBottom: 2,
  },
  rowSelected: { backgroundColor: '#0A1A40' },
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
})