import { OnboardingStepHeader } from '@/components/ui/OnboardingStepHeader'
import { useAuthStore } from '@/store/auth.store'
import { colors, fontWeight, radii, spacing } from '@/theme'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

const ITEM_H = 48
const VISIBLE = 5
const DRUM_H = ITEM_H * VISIBLE
const PAD = Math.floor(VISIBLE / 2) * ITEM_H

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1))
const NOW = new Date()
const MAX_YEAR = NOW.getFullYear() - 13
const YEARS = Array.from({ length: MAX_YEAR - 1919 }, (_, i) => String(MAX_YEAR - i))

export default function BirthdayScreen() {
  const onboardingName = useAuthStore(s => s.onboardingName)
  const setOnboardingBirthday = useAuthStore(s => s.setOnboardingBirthday)

  const defaultMonth = NOW.getMonth()
  const defaultDay = NOW.getDate() - 1
  const defaultYear = 0  // top of list = MAX_YEAR - 13

  const [monthIdx, setMonthIdx] = useState(defaultMonth)
  const [dayIdx, setDayIdx] = useState(defaultDay)
  const [yearIdx, setYearIdx] = useState(defaultYear)

  const monthRef = useRef<ScrollView>(null)
  const dayRef = useRef<ScrollView>(null)
  const yearRef = useRef<ScrollView>(null)

  useEffect(() => {
    const t = setTimeout(() => {
      monthRef.current?.scrollTo({ y: defaultMonth * ITEM_H, animated: false })
      dayRef.current?.scrollTo({ y: defaultDay * ITEM_H, animated: false })
      yearRef.current?.scrollTo({ y: defaultYear * ITEM_H, animated: false })
    }, 80)
    return () => clearTimeout(t)
  }, [])

  function onScrollEnd(
    e: NativeSyntheticEvent<NativeScrollEvent>,
    items: string[],
    setter: (i: number) => void,
  ) {
    const raw = Math.round(e.nativeEvent.contentOffset.y / ITEM_H)
    setter(Math.max(0, Math.min(items.length - 1, raw)))
  }

  function handleNext() {
    const mm = String(monthIdx + 1).padStart(2, '0')
    const dd = String(dayIdx + 1).padStart(2, '0')
    const yyyy = YEARS[yearIdx]
    setOnboardingBirthday(`${yyyy}-${mm}-${dd}`)
    router.push('/(auth)/onboarding/notifications')
  }

  function handleSkip() {
    setOnboardingBirthday(null)
    router.push('/(auth)/onboarding/notifications')
  }

  const firstName = onboardingName.split(' ')[0]

  return (
    <View style={s.root}>
      <OnboardingStepHeader
        step={2}
        total={3}
        onBack={() => router.back()}
        onSkip={handleSkip}
      />

      <View style={s.body}>
        <Text style={s.question}>
          hey <Text style={s.nameAccent}>{firstName || 'you'}</Text>,{'\n'}
          when was{'\n'}this story born?
        </Text>

        {/* Drum-roll picker */}
        <View style={s.drumWrap}>
          {/* Selection highlight */}
          <View style={s.selectionBar} pointerEvents="none" />

          <View style={s.drumsRow}>
            {/* Month */}
            <ScrollView
              ref={monthRef}
              style={s.drum}
              contentContainerStyle={s.drumContent}
              showsVerticalScrollIndicator={false}
              snapToInterval={ITEM_H}
              decelerationRate="fast"
              onScrollEndDrag={e => onScrollEnd(e, MONTHS, setMonthIdx)}
              onMomentumScrollEnd={e => onScrollEnd(e, MONTHS, setMonthIdx)}
            >
              {MONTHS.map((m, i) => (
                <View key={m} style={s.drumItem}>
                  <Text style={[s.drumLabel, i === monthIdx && s.drumLabelSelected]}>{m}</Text>
                </View>
              ))}
            </ScrollView>

            {/* Day */}
            <ScrollView
              ref={dayRef}
              style={s.drum}
              contentContainerStyle={s.drumContent}
              showsVerticalScrollIndicator={false}
              snapToInterval={ITEM_H}
              decelerationRate="fast"
              onScrollEndDrag={e => onScrollEnd(e, DAYS, setDayIdx)}
              onMomentumScrollEnd={e => onScrollEnd(e, DAYS, setDayIdx)}
            >
              {DAYS.map((d, i) => (
                <View key={d} style={s.drumItem}>
                  <Text style={[s.drumLabel, i === dayIdx && s.drumLabelSelected]}>{d}</Text>
                </View>
              ))}
            </ScrollView>

            {/* Year */}
            <ScrollView
              ref={yearRef}
              style={s.drum}
              contentContainerStyle={s.drumContent}
              showsVerticalScrollIndicator={false}
              snapToInterval={ITEM_H}
              decelerationRate="fast"
              onScrollEndDrag={e => onScrollEnd(e, YEARS, setYearIdx)}
              onMomentumScrollEnd={e => onScrollEnd(e, YEARS, setYearIdx)}
            >
              {YEARS.map((y, i) => (
                <View key={y} style={s.drumItem}>
                  <Text style={[s.drumLabel, i === yearIdx && s.drumLabelSelected]}>{y}</Text>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Fade overlays */}
          <LinearGradient
            colors={[colors.background, 'transparent']}
            style={s.fadeTop}
            pointerEvents="none"
          />
          <LinearGradient
            colors={['transparent', colors.background]}
            style={s.fadeBottom}
            pointerEvents="none"
          />
        </View>
      </View>

      {/* Next button */}
      <TouchableOpacity style={s.nextBtn} onPress={handleNext} activeOpacity={0.88}>
        <Text style={s.nextLabel}>Next</Text>
      </TouchableOpacity>
    </View>
  )
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[6],
  },
  question: {
    fontSize: 34,
    lineHeight: 42,
    fontWeight: fontWeight.semiBold,
    color: colors.textPrimary,
    letterSpacing: -1,
    marginBottom: spacing[8],
  },
  nameAccent: {
    color: colors.ember,
  },
  drumWrap: {
    height: DRUM_H,
    position: 'relative',
    overflow: 'hidden',
  },
  selectionBar: {
    position: 'absolute',
    top: PAD,
    left: 0,
    right: 0,
    height: ITEM_H,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.borderSubtle,
    zIndex: 1,
  },
  drumsRow: {
    flexDirection: 'row',
    height: DRUM_H,
  },
  drum: {
    flex: 1,
  },
  drumContent: {
    paddingVertical: PAD,
  },
  drumItem: {
    height: ITEM_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drumLabel: {
    fontSize: 17,
    color: colors.textTertiary,
    fontWeight: fontWeight.regular,
  },
  drumLabelSelected: {
    fontSize: 18,
    color: colors.textPrimary,
    fontWeight: fontWeight.semiBold,
  },
  fadeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: PAD,
    zIndex: 2,
  },
  fadeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: PAD,
    zIndex: 2,
  },
  nextBtn: {
    marginHorizontal: spacing[6],
    marginBottom: spacing[10],
    backgroundColor: colors.primary,
    borderRadius: radii.full,
    paddingVertical: 17,
    alignItems: 'center',
  },
  nextLabel: {
    fontSize: 15,
    fontWeight: fontWeight.semiBold,
    color: colors.white,
  },
})
