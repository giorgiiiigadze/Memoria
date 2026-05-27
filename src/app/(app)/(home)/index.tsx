// app/(app)/(home)/index.tsx

import { useAuthStore } from '@/store/auth.store'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

export default function Home() {
  const { user, profile, signOut } = useAuthStore()

  const displayName = profile?.display_name ?? profile?.username ?? user?.email ?? 'Unknown'

  return (
    <View style={s.root}>

      <View style={s.content}>
        <Text style={s.greeting}>Hey, {displayName} 👋</Text>
        <Text style={s.sub}>{user?.email}</Text>
      </View>

      <TouchableOpacity style={s.signOutBtn} onPress={signOut} activeOpacity={0.8}>
        <Text style={s.signOutLabel}>Sign out</Text>
      </TouchableOpacity>

    </View>
  )
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#121212',
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  sub: {
    fontSize: 14,
    color: '#898989',
  },
  signOutBtn: {
    borderWidth: 0.5,
    borderColor: '#3B3B3B',
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: 'center',
  },
  signOutLabel: {
    fontSize: 14,
    color: '#EA4942',
  },
})