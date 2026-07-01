import { GlassIconButton } from '@/components/ui/GlassIconButton'
import { TabBarContext } from '@/context/TabBarContext'
import { selectProfile, useAuthStore } from '@/store/auth.store'
import { colors } from '@/theme/colors'
import { fontSize, fontWeight, radii, spacing } from '@/theme'
import { BlurView } from 'expo-blur'
import { Image } from 'expo-image'
import { router, useFocusEffect } from 'expo-router'
import { SymbolView } from 'expo-symbols'
import { useCallback, useContext } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function InviteScreen() {
  const insets = useSafeAreaInsets()
  const { setIsTabBarHidden } = useContext(TabBarContext)
  const profile = useAuthStore(selectProfile)

  useFocusEffect(useCallback(() => {
    setIsTabBarHidden(true)
    return () => setIsTabBarHidden(false)
  }, []))

  return (
    <View style={s.root}>
      {profile?.avatar_url ? (
        <>
          <Image
            source={{ uri: profile.avatar_url }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
          <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
        </>
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />
      )}
      <View style={[StyleSheet.absoluteFill, s.dimOverlay]} />

      <View style={[s.inner, { paddingTop: insets.top + spacing[4] }]}>
        <View style={s.header}>
          <GlassIconButton onPress={() => router.back()}>
            <SymbolView name="xmark" size={18} tintColor={colors.white} weight="semibold" resizeMode="scaleAspectFit" />
          </GlassIconButton>
          <GlassIconButton>
            <SymbolView name="qrcode.viewfinder" size={18} tintColor={colors.white} weight="semibold" resizeMode="scaleAspectFit" />
          </GlassIconButton>
        </View>

        <View style={s.content}>
          <Text style={s.title}>Invite friends</Text>
          <Text style={s.subtitle}>QR code coming soon</Text>

          <View style={s.qrPlaceholder}>
            <Text style={s.qrLabel}>QR</Text>
          </View>
        </View>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  root: {
    flex: 1,
  },
  dimOverlay: {
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  inner: {
    flex: 1,
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
    color: colors.white,
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
