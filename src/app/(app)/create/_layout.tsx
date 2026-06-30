import { ModalCloseButton } from '@/components/ui/ModalCloseButton'
import { colors } from '@/theme'
import { Stack } from 'expo-router'
import { View } from 'react-native'

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
          headerLeft: () => <ModalCloseButton />,
          headerBackVisible: false,
          headerTitle: 'New drop',
          headerTitleStyle: { color: colors.white },
        }}
      />
    </Stack>
    </View>
  )
}
