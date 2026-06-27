import { colors } from '@/theme'
import { Stack } from 'expo-router'
import { StyleSheet, Text, View } from 'react-native'

export default function SettingsScreen() {
  return (
    <>
      <Stack.Screen options={{ headerTitle: 'Settings', headerShown: true, headerStyle: { backgroundColor: colors.background }, headerShadowVisible: false, headerTintColor: colors.white }} />
      <View style={s.root}>
        <Text style={s.text}>Hello</Text>
      </View>
    </>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  text: { color: colors.white, fontSize: 17 },
})
