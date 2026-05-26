// app/(app)/(profile)/_layout.tsx
import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#121212' },
        animation: 'slide_from_right',
      }}
    />
  );
}