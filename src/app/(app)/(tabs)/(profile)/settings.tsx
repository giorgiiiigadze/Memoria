import { useAuthStore } from '@/store/auth.store'
import { colors, fontWeight, spacing } from '@/theme'
import { router, Stack } from 'expo-router'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

export default function SettingsScreen() {
  const signOut = useAuthStore(s => s.signOut)

  return (
    <>
      <Stack.Screen options={{ headerTitle: 'Settings', headerShown: true, headerStyle: { backgroundColor: colors.background }, headerShadowVisible: false, headerTintColor: colors.white }} />
      <View style={s.root}>
        <TouchableOpacity style={s.signOutBtn} onPress={signOut}>
          <Text style={s.signOutLabel}>Sign Out</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.devBtn} onPress={() => router.replace('/(onboarding)' as any)}>
          <Text style={s.devBtnLabel}>Dev: back to onboarding</Text>
        </TouchableOpacity>
      </View>
    </>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background, padding: spacing[4], gap: spacing[3] },
  signOutBtn: {
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.error,
    alignItems: 'center',
  },
  signOutLabel: { fontSize: 15, color: colors.error, fontWeight: fontWeight.medium },
  devBtn: {
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.white,
    alignItems: 'center',
  },
  devBtnLabel: { fontSize: 13, color: colors.white, fontWeight: fontWeight.medium },
})
