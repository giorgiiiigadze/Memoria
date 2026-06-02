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
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '600',
    letterSpacing: 2,
  },
})