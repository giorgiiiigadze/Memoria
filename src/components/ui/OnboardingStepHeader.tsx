import { colors, fontWeight, spacing } from '@/theme'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

interface Props {
  step: number
  total: number
  onBack?: () => void
  onSkip?: () => void
}

export function OnboardingStepHeader({ step, total, onBack, onSkip }: Props) {
  const pct = `${Math.round((step / total) * 100)}%` as `${number}%`

  return (
    <View style={s.root}>
      <View style={s.row}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={onBack}
          disabled={!onBack}
          activeOpacity={0.7}
          hitSlop={12}
        >
          <Text style={[s.backArrow, !onBack && s.invisible]}>←</Text>
        </TouchableOpacity>

        <View style={s.trackWrap}>
          <View style={s.track}>
            <View style={[s.fill, { width: pct }]} />
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
    paddingHorizontal: spacing[5],
    paddingTop: spacing[6],
    paddingBottom: spacing[4],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  backBtn: {
    width: 28,
    alignItems: 'center',
  },
  backArrow: {
    fontSize: 20,
    color: colors.textPrimary,
    fontWeight: fontWeight.medium,
  },
  invisible: {
    opacity: 0,
  },
  trackWrap: {
    flex: 1,
  },
  track: {
    height: 3,
    backgroundColor: colors.borderDefault,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: 3,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  stepLabel: {
    fontSize: 12,
    color: colors.textTertiary,
    fontWeight: fontWeight.medium,
    minWidth: 28,
    textAlign: 'right',
  },
  skip: {
    fontSize: 13,
    color: colors.textTertiary,
    fontWeight: fontWeight.medium,
  },
  skipPlaceholder: {
    width: 32,
  },
})
