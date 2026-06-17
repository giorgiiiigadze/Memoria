import { completeOnboarding } from '@/lib/onboarding'
import { colors, fontSize, fontWeight, spacing } from '@/theme'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type Props = {
  showSkip?: boolean
}

export function OnboardingHeader({ showSkip = true }: Props) {
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.inner}>
        <Text style={styles.brand}>Memoria</Text>
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
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.white,
  },
  inner: {
    height: 48,
    marginTop: spacing[1],
    justifyContent: 'center',
    alignItems: 'center',
  },
  brand: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.surface,
    letterSpacing: -0.3,
  },
  skipBtn: {
    position: 'absolute',
    right: spacing[6],
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  skipText: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: fontWeight.medium,
  },
})
