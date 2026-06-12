import { TabBarContext } from '@/context/TabBarContext'
import { colors } from '@/theme'
import { NativeTabs } from 'expo-router/unstable-native-tabs'
import { useState } from 'react'

export default function TabsLayout() {
  const [isTabBarHidden, setIsTabBarHidden] = useState(false)

  return (
    <TabBarContext value={{ setIsTabBarHidden }}>
      <NativeTabs
        hidden={isTabBarHidden}
        iconColor="white"
        labelStyle={{ color: colors.white }}
        blurEffect="systemUltraThinMaterialDark"
      >
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
          <NativeTabs.Trigger.Icon sf="plus" md="add_circle" />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="(calendar)">
          <NativeTabs.Trigger.Label>Calendar</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf="calendar" md="calendar_month" />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="(profile)">
          <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf="person.crop.circle.fill" md="account_circle" />
        </NativeTabs.Trigger>
      </NativeTabs>
    </TabBarContext>
  )
}
