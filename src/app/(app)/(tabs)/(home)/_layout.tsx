import HomeHeader from '@/components/ui/HomeHeader';
import { colors } from '@/theme';
import { Stack } from 'expo-router';

export default function HomeLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: true,
          header: () => <HomeHeader />,
          headerTransparent: true,
          animation: 'none',
        }}
      />

      <Stack.Screen
        name="notifications"
        options={{
          presentation: 'formSheet',
          sheetGrabberVisible: true,
          sheetCornerRadius: 24,
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />
    </Stack>
  );
}