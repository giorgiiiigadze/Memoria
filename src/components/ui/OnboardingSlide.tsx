import { Dots } from '@/components/ui/Dots'
import { OnboardingButton } from '@/components/ui/OnboardingButton'
import { colors } from '@/theme/colors'
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

      {/* Big, bold headline sits low — the BeReal signature */}
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
    backgroundColor: colors.bone,
  },
  illustrationWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
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
    fontSize: 34,
    fontWeight: '800',
    color: colors.surface,
    textAlign: 'center',
    letterSpacing: -0.6,
    lineHeight: 38,
  },
  body: {
    fontSize: 15,
    color: '#898989',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 14,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 24,
    alignItems: 'center',
  },
})