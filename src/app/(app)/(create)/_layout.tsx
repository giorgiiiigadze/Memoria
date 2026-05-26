import { Stack } from 'expo-router';

export default function CreateLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#121212' } }} />
  );
}
