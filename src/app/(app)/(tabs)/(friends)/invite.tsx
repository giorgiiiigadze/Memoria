import { GlassIconButton } from '@/components/ui/GlassIconButton'
import { TabBarContext } from '@/context/TabBarContext'
import { colors, fontSize, fontWeight, radii, spacing } from '@/theme'
import { router, useFocusEffect } from 'expo-router'
import { ScanLine, X } from 'lucide-react-native'
import { useCallback, useContext } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function InviteScreen() {
  const insets = useSafeAreaInsets()
  const { setIsTabBarHidden } = useContext(TabBarContext)

  useFocusEffect(useCallback(() => {
    setIsTabBarHidden(true)
    return () => setIsTabBarHidden(false)
  }, []))

  return (
    <View style={[s.root, { paddingTop: insets.top + spacing[4] }]}>
      <View style={s.header}>
        <GlassIconButton onPress={() => router.back()}>
          <X size={18} color={colors.textPrimary} strokeWidth={2.5} />
        </GlassIconButton>
        <GlassIconButton>
          <ScanLine size={18} color={colors.textPrimary} strokeWidth={2} />
        </GlassIconButton>
      </View>

      <View style={s.content}>
        <Text style={s.title}>Invite friends</Text>
        <Text style={s.subtitle}>QR code coming soon</Text>

        {/* QR code placeholder */}
        <View style={s.qrPlaceholder}>
          <Text style={s.qrLabel}>QR</Text>
        </View>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing[4],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[4],
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semiBold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
  },
  qrPlaceholder: {
    width: 220,
    height: 220,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceCard,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing[4],
  },
  qrLabel: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.textTertiary,
  },
})
