import { OnboardingButton } from '@/components/onboarding/OnboardingButton'
import { Dots } from '@/components/ui/Dots'
import { colors, fontWeight, spacing } from '@/theme'
import type { ReactNode } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

type Props = {
  illustration: ReactNode
  headline: string
  body?: string
  dotsActive: number
  buttonLabel: string
  onPress: () => void
  buttonLoading?: boolean
}

export function OnboardingSlide({
  illustration,
  headline,
  body,
  dotsActive,
  buttonLabel,
  onPress,
  buttonLoading,
}: Props) {
  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <View style={styles.illustrationWrap}>
        {typeof illustration === 'string' ? (
          <Text style={styles.illustrationEmoji}>{illustration}</Text>
        ) : (
          illustration
        )}
      </View>

      <View style={styles.textWrap}>
        <Text style={styles.headline}>{headline}</Text>
        {body ? <Text style={styles.body}>{body}</Text> : null}
      </View>

      <View style={styles.footer}>
        <Dots active={dotsActive} />
        <OnboardingButton label={buttonLabel} onPress={onPress} loading={buttonLoading} />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  illustrationWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[8],
  },
  illustrationEmoji: {
    fontSize: 96,
  },
  textWrap: {
    paddingHorizontal: 28,
    marginBottom: 36,
    alignItems: 'center',
  },
  headline: {
    fontSize: 38,
    fontWeight: '900',
    color: colors.surface,
    textAlign: 'center',
    letterSpacing: -1,
    lineHeight: 43,
  },
  body: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 23,
    marginTop: 14,
  },
  footer: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[8],
    gap: spacing[6],
    alignItems: 'center',
  },
})
