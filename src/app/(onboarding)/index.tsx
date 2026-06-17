import { Stack, router } from 'expo-router'
import { useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

// Circle large enough that at scale=1 it covers the full screen from center
const BURST_SIZE = 1600
const BOX_SIZE = 96
const BOX_RADIUS = 20

function goNext() {
  router.replace('/(onboarding)/onboarding-1' as any)
}

export default function IntroScreen() {
  const boxOp      = useSharedValue(0)
  const burstScale = useSharedValue(0)

  useEffect(() => {
    // Box fades in immediately
    boxOp.value = withTiming(1, { duration: 300 })

    // After box is visible, burst expands from center outward
    const burstTimer = setTimeout(() => {
      burstScale.value = withTiming(1, {
        duration: 750,
        easing: Easing.out(Easing.quad),
      })
    }, 600)

    const navTimer = setTimeout(goNext, 1500)

    return () => {
      clearTimeout(burstTimer)
      clearTimeout(navTimer)
    }
  }, [])

  const boxStyle = useAnimatedStyle(() => ({
    opacity: boxOp.value,
  }))

  const burstStyle = useAnimatedStyle(() => ({
    transform: [{ scale: burstScale.value }],
  }))

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={s.root}>
        {/*
          absoluteFill container with flex centering — the circle's own center
          lands exactly on the screen center, so transform:scale expands from there.
        */}
        <View style={s.burstOuter}>
          <Animated.View style={[s.burst, burstStyle]} />
        </View>

        <Animated.View style={[s.box, boxStyle]} />
      </View>
    </>
  )
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  burstOuter: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  burst: {
    width: BURST_SIZE,
    height: BURST_SIZE,
    borderRadius: BURST_SIZE / 2,
    backgroundColor: '#FFFFFF',
  },
  box: {
    width: BOX_SIZE,
    height: BOX_SIZE,
    borderRadius: BOX_RADIUS,
    backgroundColor: '#FFFFFF',
  },
})
