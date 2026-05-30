import type { Profile } from '@/types/database.types'
import { Image } from 'expo-image'
import type { ReactNode } from 'react'
import { StyleSheet, Text, View } from 'react-native'

export function UserRow({ profile, right }: { profile: Profile; right?: ReactNode }) {
  const initial = (profile.display_name ?? profile.username).charAt(0).toUpperCase()
  return (
    <View style={s.row}>
      <View style={s.avatar}>
        {profile.avatar_url
          ? <Image source={profile.avatar_url} style={s.avatarImg} contentFit="cover" />
          : <Text style={s.avatarInitial}>{initial}</Text>}
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
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#252525',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarImg: { width: 40, height: 40, borderRadius: 20 },
  avatarInitial: { fontSize: 15, fontWeight: '500', color: '#898989' },
  rowInfo: { flex: 1 },
  rowName: { fontSize: 15, fontWeight: '500', color: '#FFFFFF' },
  rowHandle: { fontSize: 12, color: '#626262', marginTop: 1 },
  rowRight: { marginLeft: 12 },
})
