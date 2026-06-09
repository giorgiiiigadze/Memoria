import { supabase } from '@/api/client'
import { SocialButton } from '@/components/ui/SocialButton'
import { useAuthStore } from '@/store/auth.store'
import { colors, fontWeight, spacing } from '@/theme'
import { AntDesign } from '@expo/vector-icons'
import { router } from 'expo-router'
import { SymbolView } from 'expo-symbols'
import { useState } from 'react'
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated'

const { width: SW, height: SH } = Dimensions.get('window')

type Segment = { text: string; color: string }

const SLIDES: { headline: Segment[] }[] = [
  {
    headline: [
      { text: 'capture', color: colors.lime },
      { text: ' and\nrelive ', color: colors.textPrimary },
      { text: 'together', color: colors.lime },
    ],
  },
  {
    headline: [
      { text: 'share ', color: colors.textPrimary },
      { text: 'moments', color: colors.lime },
      { text: '\nthat matter', color: colors.textPrimary },
    ],
  },
  {
    headline: [
      { text: 'unlock', color: colors.lime },
      { text: ' drops\ntogether', color: colors.textPrimary },
    ],
  },
]

function Slide({ index, scrollX, children }: {
  index: number
  scrollX: SharedValue<number>
  children?: React.ReactNode
}) {
  const animStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * SW, index * SW, (index + 1) * SW]
    const scale = interpolate(scrollX.value, inputRange, [0.82, 1, 0.82], Extrapolation.CLAMP)
    const opacity = interpolate(scrollX.value, inputRange, [0.3, 1, 0.3], Extrapolation.CLAMP)
    return { transform: [{ scale }], opacity }
  })
  return (
    <View style={s.slide}>
      <Animated.View style={[s.slideInner, animStyle]}>
        {children}
      </Animated.View>
    </View>
  )
}

function HeadlineLayer({ index, scrollX }: {
  index: number
  scrollX: SharedValue<number>
}) {
  const animStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * SW, index * SW, (index + 1) * SW]
    const opacity = interpolate(scrollX.value, inputRange, [0, 1, 0], Extrapolation.CLAMP)
    const translateY = interpolate(scrollX.value, inputRange, [12, 0, 12], Extrapolation.CLAMP)
    return { opacity, transform: [{ translateY }] }
  })

  return (
    <Animated.Text style={[s.headline, s.headlineAbs, animStyle]}>
      {SLIDES[index].headline.map((seg, i) => (
        <Text key={i} style={{ color: seg.color }}>
          {seg.text}
        </Text>
      ))}
    </Animated.Text>
  )
}


function Dot({ index, scrollX }: {
  index: number
  scrollX: SharedValue<number>
}) {
  const animStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * SW, index * SW, (index + 1) * SW]
    const width = interpolate(scrollX.value, inputRange, [6, 22, 6], Extrapolation.CLAMP)
    const opacity = interpolate(scrollX.value, inputRange, [0.35, 1, 0.35], Extrapolation.CLAMP)
    return { width, opacity }
  })
  return <Animated.View style={[s.dot, animStyle]} />
}

export default function LandingScreen() {
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollX = useSharedValue(0)

  const scrollHandler = useAnimatedScrollHandler((e) => {
    scrollX.value = e.contentOffset.x
  })

  async function handleDevSignIn() {
    if (!agreed) { setError('Please agree to the terms to continue.'); return }
    try {
      setLoading(true)
      setError(null)
      const { data, error: e } = await supabase.auth.signInWithPassword({
        email: 'salo@gmail.com',
        password: 'salosalo',
      })
      if (e || !data.session) { setError('Dev sign-in failed'); return }
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.session.user.id)
        .maybeSingle()
      useAuthStore.getState().setSession(data.session)
      useAuthStore.getState().setProfile(profile ?? null)
      router.replace(profile?.display_name ? '/(app)/(tabs)/(home)' : '/(auth)/success')
    } catch {
      setError('Dev sign-in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={s.root}>

      <Animated.ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        decelerationRate="fast"
        style={s.pager}
      >
        {SLIDES.map((_, i) => (
          <Slide key={i} index={i} scrollX={scrollX}>
            {/* swap with your illustration per slide */}
          </Slide>
        ))}
      </Animated.ScrollView>

      <View style={s.content}>

        {/* crossfading headlines stacked on top of each other */}
        <View style={s.headlineStack}>
          {SLIDES.map((_, i) => (
            <HeadlineLayer key={i} index={i} scrollX={scrollX} />
          ))}
        </View>

        <View style={s.dots}>
          {SLIDES.map((_, i) => (
            <Dot key={i} index={i} scrollX={scrollX} />
          ))}
        </View>

        <View style={s.tosRow}>
          <TouchableOpacity
            onPress={() => { setAgreed(v => !v); setError(null) }}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <View style={[s.checkbox, agreed && s.checkboxOn]}>
              {agreed && (
                <SymbolView
                  name="checkmark"
                  size={14}
                  tintColor={colors.ink}
                  resizeMode="scaleAspectFit"
                />
              )}
            </View>
          </TouchableOpacity>
          <Text style={s.tosText}>
            I agree to the Terms of Service
            {' '}and Privacy Policy to continue
          </Text>
        </View>

        {error ? <Text style={s.error}>{error}</Text> : null}

        {/* ── REAL Apple Sign-In — uncomment when on device ───────────────
        <TouchableOpacity
          style={[s.appleBtn, (!agreed || loading) && s.btnDimmed]}
          onPress={handleAppleSignIn}
          disabled={!agreed || loading}
          activeOpacity={0.88}
        >
          <AntDesign name="apple" size={18} color={colors.ink} />
          <Text style={s.appleBtnLabel}>
            {loading ? 'Signing in…' : 'Continue with Apple'}
          </Text>
        </TouchableOpacity>
        ─────────────────────────────────────────────────────────────────── */}

        {__DEV__ && (
          <SocialButton
            label={loading ? 'Signing in…' : 'Dev Sign In'}
            onPress={handleDevSignIn}
            disabled={!agreed}
            loading={loading}
            icon={<AntDesign name="lock" size={18} color={colors.ink} />}
            style={s.fullWidth}
          />
        )}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },

  pager: {
    flexGrow: 0,
    height: SH * 0.6,
  },
  slide: {
    width: SW,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: "#fff"
  },
  slideInner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  content: {
    flex: 1,
    paddingHorizontal: spacing[2.5],
    paddingBottom: spacing[12],
    paddingTop: spacing[4],
    gap: spacing[10],
    alignItems: 'center',
  },

  headlineStack: {
    height: 92,
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  headline: {
    fontSize: 38,
    textAlign: 'center',
    fontWeight: fontWeight.regular,
  },
  headlineAbs: {
    position: 'absolute',
    left: 0,
    right: 0,
  },

  dots: {
    flexDirection: 'row',
    gap: 6,
    height: 6,
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 10,
    backgroundColor: colors.textPrimary,
  },
  tosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
    alignSelf: 'stretch',
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.borderDefault,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: {
    backgroundColor: colors.white,
    borderColor: colors.white,
  },
  tosText: {
    color: colors.white,
    lineHeight: 18,
    maxWidth: 300,
  },
  error: {
    fontSize: 12,
    color: colors.error,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
})