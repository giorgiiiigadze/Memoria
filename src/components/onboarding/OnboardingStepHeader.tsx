import { GlassIconButton } from '@/components/ui/GlassIconButton'
import { colors, fontWeight, spacing } from '@/theme'
import { SymbolView } from 'expo-symbols'
import { useEffect, useRef } from 'react'
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface Props {
  step: number
  total: number
  onBack?: () => void
  onSkip?: () => void
  tint?: string
  trackBg?: string
  glassScheme?: 'light' | 'dark'
}

export function OnboardingStepHeader({ step, total, onBack, onSkip, tint = colors.white, trackBg = colors.borderDefault, glassScheme = 'dark' }: Props) {
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
          <GlassIconButton onPress={onBack ?? (() => {})} colorScheme={glassScheme}>
            <SymbolView name="chevron.left" size={18} tintColor={tint} resizeMode="scaleAspectFit" />
          </GlassIconButton>
        </View>

        <View style={s.trackWrap}>
          <View style={[s.track, { backgroundColor: trackBg }]}>
            <Animated.View style={[s.fill, { width: fillWidth, backgroundColor: tint }]} />
          </View>
        </View>

{onSkip ? (
          <TouchableOpacity onPress={onSkip} hitSlop={12} activeOpacity={0.7}>
            <Text style={[s.skip, { color: tint }]}>Skip</Text>
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
    width: 44,
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
  skip: {
    fontSize: 13,
    color: colors.white,
    fontWeight: fontWeight.medium,
  },
  skipPlaceholder: {
    width: 32,
  },
})