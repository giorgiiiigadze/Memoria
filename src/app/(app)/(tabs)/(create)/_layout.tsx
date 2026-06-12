import { CreateFlowHeader } from '@/components/ui/CreateFlowHeader'
import { Stack } from 'expo-router'

export default function CreateLayout() {
  return (
    <Stack screenOptions={{ contentStyle: { backgroundColor: '#000000' }, headerStyle: { backgroundColor: 'transparent' } }}>
      <Stack.Screen
        name="index"
        options={{ header: () => <CreateFlowHeader variant="close" /> }}
      />
      <Stack.Screen
        name="invite"
        options={{ header: () => <CreateFlowHeader variant="back" /> }}
      />
      <Stack.Screen
        name="confirm"
        options={{ header: () => <CreateFlowHeader variant="back" /> }}
      />
    </Stack>
  )
}
