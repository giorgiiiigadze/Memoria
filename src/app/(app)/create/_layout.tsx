import { colors } from '@/theme'
import { router, Stack } from 'expo-router'
import { SymbolView } from 'expo-symbols'
import { Pressable, StyleSheet, View } from 'react-native'

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
    <View style={{ flex: 1, backgroundColor: colors.surfaceGrouped }}>
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: colors.surfaceGrouped },
        headerStyle: { backgroundColor: colors.surfaceGrouped },
        headerShadowVisible: false,
        headerTintColor: colors.white,
        headerTitle: '',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerLeft: () => <CloseButton />,
          headerBackVisible: false,
          headerTitle: 'New drop',
          headerTitleStyle: { color: colors.white },
        }}
      />
    </Stack>
    </View>
  )
}

const s = StyleSheet.create({
  pressed: { opacity: 0.6 },
})
