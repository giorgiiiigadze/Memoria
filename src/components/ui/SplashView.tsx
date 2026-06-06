import { colors, fontWeight } from '@/theme'
import { StyleSheet, Text, View } from 'react-native'

export function SplashView() {
  return (
    <View style={styles.splash}>
      <Text style={styles.splashText}>Memoria</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashText: {
    color: colors.white,
    fontSize: 32,
    fontWeight: fontWeight.semiBold,
    letterSpacing: 2,
  },
})
