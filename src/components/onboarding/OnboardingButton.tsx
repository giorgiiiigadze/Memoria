import { colors, fontSize, fontWeight, radii } from '@/theme'
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

type Props = {
  label: string
  onPress: () => void
  loading?: boolean
}

export function OnboardingButton({ label, onPress, loading = false }: Props) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.shadow} />
      <TouchableOpacity
        style={styles.face}
        onPress={onPress}
        activeOpacity={0.85}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color={colors.ink} size="small" />
          : <Text style={styles.label}>{label}</Text>}
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'stretch',
    position: 'relative',
    marginBottom: 5,
  },
  shadow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 5,
    bottom: -5,
    backgroundColor: colors.ink,
    borderRadius: radii.full,
  },
  face: {
    backgroundColor: '#9EC6B8', // onboarding brand color — intentional one-off
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: radii.full,
    paddingVertical: 18,
    alignItems: 'center',
  },
  label: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.strong,
    color: colors.ink,
    letterSpacing: 0.1,
  },
})
