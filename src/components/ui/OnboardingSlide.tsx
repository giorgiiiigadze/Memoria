import { Dots } from '@/components/ui/Dots'
import { OnboardingButton } from '@/components/ui/OnboardingButton'
import { completeOnboarding } from '@/lib/onboarding'
import { colors } from '@/theme/colors'
import type { ReactNode } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

type Props = {
  illustration: ReactNode // emoji string, <Image/>, or any node
  headline: string
  body?: string
  dotsActive: number
  buttonLabel: string
  onPress: () => void
  buttonLoading?: boolean
  showSkip?: boolean
  brand?: string // wordmark text — swap for a logo node if you have one
}

export function OnboardingSlide({
  illustration,
  headline,
  body,
  dotsActive,
  buttonLabel,
  onPress,
  buttonLoading,
  showSkip = true,
  brand = 'Memoria',
}: Props) {
  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      {/* Header: centered wordmark + Skip pinned right */}
      <View style={styles.header}>
        <Text style={styles.brand}>{brand}</Text>
        {showSkip && (
          <TouchableOpacity
            style={styles.skipBtn}
            onPress={completeOnboarding}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Hero visual fills the upper area */}
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
  header: {
    height: 48,
    marginTop: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brand: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.surface,
    letterSpacing: -0.3,
  },
  skipBtn: {
    position: 'absolute',
    right: 24,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  skipText: {
    color: '#898989',
    fontSize: 15,
    fontWeight: '500',
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