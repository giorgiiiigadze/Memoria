import { transparentHeaderOptions } from '@/theme'
import { Stack } from 'expo-router'

export default function CalendarLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          ...transparentHeaderOptions,
          headerTitle: 'Calendar',
        }}
      />
    </Stack>
  )
}
