import { colors } from '@/theme'
import { router, Stack } from 'expo-router'
import { SymbolView } from 'expo-symbols'
import { Pressable, StyleSheet } from 'react-native'

function CloseButton() {
  return (
    <Pressable
      onPress={() => router.dismiss()}
      hitSlop={12}
      style={({ pressed }) => pressed && s.pressed}
    >
      <SymbolView name="xmark" size={20} tintColor={colors.white} />
    </Pressable>
  )
}

export default function CreateLayout() {
  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: colors.surfaceGrouped },
        headerStyle: { backgroundColor: colors.surfaceGrouped },
        headerShadowVisible: false,
        headerTitle: '',
        headerBackVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerLeft: () => <CloseButton />,
          headerTitle: 'New drop',
          headerTitleStyle: { color: colors.white },
        }}
      />
    </Stack>
  )
}

const s = StyleSheet.create({
  pressed: { opacity: 0.6 },
})
