import { OnboardingStepHeader } from '@/components/ui/OnboardingStepHeader'
import { colors, fontWeight, radii, spacing } from '@/theme'
import * as Notifications from 'expo-notifications'
import { router } from 'expo-router'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

export default function NotificationsScreen() {
  async function handleEnable() {
    await Notifications.requestPermissionsAsync()
    router.push('/(auth)/onboarding/complete')
  }

  function handleSkip() {
    router.push('/(auth)/onboarding/complete')
  }

  return (
    <View style={s.root}>
      <OnboardingStepHeader
        step={3}
        total={3}
        onBack={() => router.back()}
      />

      <View style={s.body}>
        {/* Visual — concentric rings + bell */}
        <View style={s.visual}>
          <View style={s.ring3}>
            <View style={s.ring2}>
              <View style={s.ring1}>
                <Text style={s.bell}>🔔</Text>
              </View>
            </View>
          </View>
        </View>

        <Text style={s.headline}>
          never miss{'\n'}
          the moment{'\n'}
          <Text style={s.headlineAccent}>drops unlock.</Text>
        </Text>

        <Text style={s.sub}>
          Get notified when a drop is ready to open or when friends add to yours.
        </Text>
      </View>

      {/* Actions */}
      <View style={s.actions}>
        <TouchableOpacity style={s.btnOutline} onPress={handleSkip} activeOpacity={0.75}>
          <Text style={s.btnOutlineLabel}>maybe later</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.btnFilled} onPress={handleEnable} activeOpacity={0.88}>
          <Text style={s.btnFilledLabel}>turn on notifications</Text>
        </TouchableOpacity>
      </View>
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
  visual: {
    alignItems: 'center',
    marginBottom: spacing[8],
  },
  ring3: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring2: {
    width: 116,
    height: 116,
    borderRadius: 58,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring1: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bell: {
    fontSize: 30,
  },
  headline: {
    fontSize: 36,
    lineHeight: 44,
    fontWeight: fontWeight.semiBold,
    color: colors.textPrimary,
    letterSpacing: -1,
    marginBottom: spacing[4],
  },
  headlineAccent: {
    color: colors.primary,
  },
  sub: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 22,
  },
  actions: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[10],
    gap: spacing[3],
  },
  btnOutline: {
    borderRadius: radii.full,
    paddingVertical: 17,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  btnOutlineLabel: {
    fontSize: 15,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  btnFilled: {
    borderRadius: radii.full,
    paddingVertical: 17,
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  btnFilledLabel: {
    fontSize: 15,
    fontWeight: fontWeight.semiBold,
    color: colors.white,
  },
})
