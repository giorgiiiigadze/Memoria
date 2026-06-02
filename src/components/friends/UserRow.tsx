import { InitialAvatar } from '@/components/ui/InitialAvatar'
import type { Profile } from '@/types/database.types'
import type { ReactNode } from 'react'
import { StyleSheet, Text, View } from 'react-native'

export function UserRow({ profile, right }: { profile: Profile; right?: ReactNode }) {
  const name = profile.display_name ?? profile.username
  return (
    <View style={s.row}>
      <View style={s.avatarWrap}>
        <InitialAvatar name={name} avatarUrl={profile.avatar_url} size={40} />
      </View>
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
  avatarWrap: { marginRight: 12 },
  rowInfo: { flex: 1 },
  rowName: { fontSize: 15, fontWeight: '500', color: '#FFFFFF' },
  rowHandle: { fontSize: 12, color: '#626262', marginTop: 1 },
  rowRight: { marginLeft: 12 },
})
