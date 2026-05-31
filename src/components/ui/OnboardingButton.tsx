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
          ? <ActivityIndicator color="#0A0A0A" size="small" />
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
    backgroundColor: '#0A0A0A',
    borderRadius: 999,
  },
  face: {
    backgroundColor: '#9EC6B8',
    borderWidth: 2,
    borderColor: '#0A0A0A',
    borderRadius: 999,
    paddingVertical: 18,
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0A0A0A',
    letterSpacing: 0.1,
  },
})
