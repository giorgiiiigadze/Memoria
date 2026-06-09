import { GlassBackButton } from '@/components/ui/GlassBackButton'
import { colors, fontWeight, spacing } from '@/theme'
import { useEffect, useRef } from 'react'
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface Props {
  step: number
  total: number
  onBack?: () => void
  onSkip?: () => void
}

export function OnboardingStepHeader({ step, total, onBack, onSkip }: Props) {
  const insets = useSafeAreaInsets()
  const animFill = useRef(new Animated.Value(step / total)).current

  useEffect(() => {
    Animated.timing(animFill, {
      toValue: step / total,
      duration: 420,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start()
  }, [step, total])

  const fillWidth = animFill.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  })

  return (
    <View style={[s.root, { paddingTop: insets.top + spacing[4] }]}>
      <View style={s.row}>
        <View style={[s.backSlot, !onBack && s.hidden]}>
          <GlassBackButton onPress={onBack ?? (() => {})} />
        </View>

        <View style={s.trackWrap}>
          <View style={s.track}>
            <Animated.View style={[s.fill, { width: fillWidth }]} />
          </View>
        </View>

        <Text style={s.stepLabel}>{step}/{total}</Text>

        {onSkip ? (
          <TouchableOpacity onPress={onSkip} hitSlop={12} activeOpacity={0.7}>
            <Text style={s.skip}>Skip</Text>
          </TouchableOpacity>
        ) : (
          <View style={s.skipPlaceholder} />
        )}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  root: {
    paddingBottom: spacing[4],
    paddingHorizontal: spacing[4],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },
  backSlot: {
    width: 40,
    alignItems: 'center',
  },
  hidden: {
    opacity: 0,
    pointerEvents: 'none',
  },
  trackWrap: {
    flex: 1,
  },
  track: {
    height: 6,
    backgroundColor: colors.borderDefault,
    borderRadius: 100,
    overflow: 'hidden',
  },
  fill: {
    height: 6,
    backgroundColor: colors.white,
    borderRadius: 100,
  },
  stepLabel: {
    fontSize: 14,
    color: colors.textTertiary,
    fontWeight: fontWeight.medium,
    minWidth: 28,
    textAlign: 'right',
  },
  skip: {
    fontSize: 13,
    color: colors.white,
    fontWeight: fontWeight.medium,
  },
  skipPlaceholder: {
    width: 32,
  },
})