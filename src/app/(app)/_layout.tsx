import { useNotifications } from '@/hooks/useNotifications'
import { useAuthStore } from '@/store/auth.store'
import { colors } from '@/theme'
import { Redirect } from 'expo-router'
import { NativeTabs } from 'expo-router/unstable-native-tabs'

export default function AppLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  useNotifications()

  if (!isAuthenticated) return <Redirect href="/(auth)/sign-in" />

  return (
    <NativeTabs screenOptions={{ contentStyle: { backgroundColor: colors.background } }}>
      <NativeTabs.Trigger name="(home)">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house.fill" md="home" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(friends)">
        <NativeTabs.Trigger.Label>Friends</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person.2.fill" md="group" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(create)">
        <NativeTabs.Trigger.Label>Create</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="plus.circle.fill" md="add_circle" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(calendar)">
        <NativeTabs.Trigger.Label>Calendar</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="calendar" md="calendar_month" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(profile)">
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person.crop.circle.fill" md="account_circle" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="drop" hidden />
    </NativeTabs>
  )
}