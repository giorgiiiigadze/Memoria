import { AuthButton } from '@/components/ui/AuthButton'
import { colors, fontWeight, spacing } from '@/theme'
import { router } from 'expo-router'
import { StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function SuccessScreen() {
  const insets = useSafeAreaInsets()

  return (
    <View style={s.root}>
      <View style={[s.content, { paddingBottom: insets.bottom + spacing[1] }]}>
        <Text style={s.preText}>congrats you are</Text>
        <Text style={s.inText}>in</Text>

        <AuthButton
          variant="outline"
          label="let's set up your profile →"
          onPress={() => router.replace('/(auth)/onboarding')}
        />
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing[2.5],
    paddingTop: spacing[4],
  },
  preText: {
    fontSize: 18,
    color: colors.textMuted,
    fontWeight: fontWeight.regular,
    marginBottom: 4,
  },
  inText: {
    fontSize: 120,
    lineHeight: 120,
    color: colors.success,
    fontWeight: fontWeight.bold,
    letterSpacing: -6,
    marginBottom: spacing[8],
  },
})
