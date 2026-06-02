import type { Profile } from '@/types/database.types'
import { Avatar } from '@/components/ui/Avatar'
import type { ReactNode } from 'react'
import { StyleSheet, Text, View } from 'react-native'

export function UserRow({ profile, right }: { profile: Profile; right?: ReactNode }) {
  return (
    <View style={s.row}>
      <Avatar uri={profile.avatar_url} name={profile.display_name ?? profile.username} size={40} style={s.avatarSpacing} />
      <View style={s.rowInfo}>
        <Text style={s.rowName}>{profile.display_name ?? profile.username}</Text>
        <Text style={s.rowHandle}>@{profile.username}</Text>
      </View>
      {right && <View style={s.rowRight}>{right}</View>}
    </View>
  )
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  avatarSpacing: { marginRight: 12 },
  rowInfo: { flex: 1 },
  rowName: { fontSize: 15, fontWeight: '500', color: '#FFFFFF' },
  rowHandle: { fontSize: 12, color: '#626262', marginTop: 1 },
  rowRight: { marginLeft: 12 },
})
