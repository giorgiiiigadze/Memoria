import { ModalCloseButton } from '@/components/ui/ModalCloseButton'
import { useAuthStore } from '@/store/auth.store'
import { colors } from '@/theme'
import {
  Button,
  Form,
  Host,
  Section,
} from '@expo/ui/swift-ui'
import {
  environment,
  foregroundStyle,
  imageScale,
  listRowBackground,
  listSectionSpacing,
  scrollContentBackground,
  tint,
} from '@expo/ui/swift-ui/modifiers'
import { router, Stack } from 'expo-router'

export default function SettingsScreen() {
  const signOut = useAuthStore(s => s.signOut)

  return (
    <>
      <Stack.Screen options={{
        headerTitle: 'Settings',
        headerTitleStyle: { color: colors.white },
        headerShown: true,
        headerTransparent: true,
        headerShadowVisible: false,
        headerTintColor: colors.white,
        headerBackVisible: false,
        headerLeft: () => <ModalCloseButton />,
      }} />
      <Host style={{ flex: 1, backgroundColor: colors.surfaceGrouped }}>
        <Form
          modifiers={[
            scrollContentBackground('hidden'),
            listSectionSpacing('compact'),
            environment('colorScheme', 'dark'),
          ]}
        >
          <Section title="Account">
            <Button
              label="Sign Out"
              role="destructive"
              systemImage="rectangle.portrait.and.arrow.right"
              modifiers={[listRowBackground(colors.surfaceGroupedElevated), tint(colors.error), imageScale('small')]}
              onPress={signOut}
            />
          </Section>

          {__DEV__ && (
            <Section title="Developer">
              <Button
                label="Dev: back to onboarding"
                systemImage="arrow.counterclockwise"
                modifiers={[listRowBackground(colors.surfaceGroupedElevated), foregroundStyle(colors.white), imageScale('small')]}
                onPress={() => router.replace('/(onboarding)' as any)}
              />
            </Section>
          )}
        </Form>
      </Host>
    </>
  )
}
