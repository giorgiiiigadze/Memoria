import type { DropWithParticipants } from '@/api/drops.api'
import { DropCard } from '@/components/drops/DropCard'
import HomeHeader from '@/components/ui/HomeHeader'
import { RefreshGrid } from '@/components/ui/RefreshGrid'
import { CARD_RADIUS } from '@/constants/drops'
import { useDrops } from '@/hooks/useDrops'
import { selectProfile, useAuthStore } from '@/store/auth.store'
import { colors, fontSize, fontWeight, glass, radii, spacing } from '@/theme'
import { BlurView } from 'expo-blur'
import { Image } from 'expo-image'
import * as Notifications from 'expo-notifications'
import { router, useFocusEffect, useScrollToTop } from 'expo-router'
import { SymbolView } from 'expo-symbols'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AppState,
  FlatList,
  Linking,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const PULL_THRESHOLD = 100

function ListFooter({ count }: { count: number }) {
  const hasAnimated = useRef(false)
  const headlineY  = useSharedValue(12)
  const headlineOp = useSharedValue(0)
  const subY       = useSharedValue(12)
  const subOp      = useSharedValue(0)

  useEffect(() => {
    if (count === 0 || hasAnimated.current) return
    hasAnimated.current = true
    const spring = { stiffness: 90, damping: 18 }
    headlineOp.value = withSpring(1, spring)
    headlineY.value  = withSpring(0, spring)
    subOp.value      = withDelay(80, withSpring(1, spring))
    subY.value       = withDelay(80, withSpring(0, spring))
  }, [count])

  const headlineStyle = useAnimatedStyle(() => ({
    opacity:   headlineOp.value,
    transform: [{ translateY: headlineY.value }],
  }))

  const subStyle = useAnimatedStyle(() => ({
    opacity:   subOp.value,
    transform: [{ translateY: subY.value }],
  }))

  if (count === 0) return null

  return (
    <View style={s.footer}>
      <Animated.View style={[s.footerPrimaryRow, headlineStyle]}>
        <Text style={s.footerPrimaryText}>All caught up</Text>
        <SymbolView
          name="sparkles"
          size={20}
          resizeMode="scaleAspectFit"
          tintColor={colors.white}
        />
      </Animated.View>
      <Animated.View style={subStyle}>
        <Text style={s.footerSecondaryText}>
          Until the next capsule cracks open
        </Text>
      </Animated.View>
    </View>
  )
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets()
  const { drops, isLoaded, error, refresh, retry } = useDrops()
  const profile = useAuthStore(selectProfile)
  const listRef = useRef<FlatList<DropWithParticipants>>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)
  useScrollToTop(listRef)

  useFocusEffect(useCallback(() => { if (isLoaded) refresh() }, [isLoaded]))

  const checkNotifPermission = useCallback(() => {
    Notifications.getPermissionsAsync().then(({ status }) => setPermissionDenied(status !== 'granted'))
  }, [])

  useFocusEffect(useCallback(() => { checkNotifPermission() }, [checkNotifPermission]))

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') checkNotifPermission()
    })
    return () => sub.remove()
  }, [checkNotifPermission])

  const gridProgress    = useSharedValue(0)
  const loadingProgress = useSharedValue(0)
  const isRefreshingRef = useRef(false)

  useEffect(() => {
    if (!isLoaded) {
      loadingProgress.value = withRepeat(
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      )
    } else {
      cancelAnimation(loadingProgress)
      loadingProgress.value = 0
    }
  }, [isLoaded])

  function handleScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    if (isRefreshingRef.current) return
    const y = e.nativeEvent.contentOffset.y
    gridProgress.value = Math.max(0, Math.min(1, -y / PULL_THRESHOLD))
  }

  async function handleRefresh() {
    isRefreshingRef.current = true
    setRefreshing(true)
    // Switch from scroll-driven to a looping ripple while data loads
    gridProgress.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    )
    await refresh()
    cancelAnimation(gridProgress)
    // Let the scroll bounce-back naturally animate gridProgress to 0
    isRefreshingRef.current = false
    setRefreshing(false)
  }

  const ListEmpty = !isLoaded ? (
    <View style={s.loadingBox}>
      <RefreshGrid progress={loadingProgress} />
    </View>
  ) : error ? (
    <View style={s.errorBox}>
      <Text style={s.errorText}>{error}</Text>
      <TouchableOpacity onPress={retry} activeOpacity={0.7}>
        <Text style={s.retryText}>Try again</Text>
      </TouchableOpacity>
    </View>
  ) : (
    <View style={s.empty}>
      <TouchableOpacity
        onPress={() => router.push('/create' as any)}
        activeOpacity={0.85}
        style={s.createCard}
      >
        <Image
          source={require('@/assets/images/container_bg.png')}
          style={s.createBg}
          contentFit="cover"
        />
        <BlurView intensity={40} tint="dark" style={s.createBg} />
        <View style={s.createTextWrap}>
          <Text style={s.createHeadline}>
            Hey {profile?.display_name || profile?.username || 'there'}
          </Text>
          <Text style={s.createSubline}>
            {'It\'s time to create your first drop\nand start sharing memories with friends'}
          </Text>
        </View>
        <View style={s.createButton}>
          <Text style={s.createButtonText}>Create your first drop</Text>
        </View>
      </TouchableOpacity>
    </View>
  )

  return (
    <>
      <HomeHeader />

      <View style={s.root}>
        <View
          pointerEvents="none"
          style={[s.refreshOverlay, { top: insets.top + 44 + spacing[6] }]}
        >
          <RefreshGrid progress={gridProgress} />
        </View>

        <FlatList<DropWithParticipants>
          ref={listRef}
          data={drops}
          keyExtractor={d => d.id}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="transparent"
              colors={['transparent']}
            />
          }
          ListHeaderComponent={
            permissionDenied ? (
              <TouchableOpacity
                onPress={() => Linking.openSettings()}
                activeOpacity={0.85}
                style={s.permBanner}
              >
                <View style={s.permIconWrap}>
                  <SymbolView name="bell.badge.fill" size={30} tintColor={colors.white} weight="semibold" resizeMode="scaleAspectFit" />
                </View>
                <View style={s.permTextWrap}>
                  <Text style={s.permSub}>Turn on notifications to get updates on drops and friends.</Text>
                </View>
                <View style={s.permButton}>
                  <Text style={s.permButtonText}>Turn On</Text>
                </View>
              </TouchableOpacity>
            ) : null
          }
          ListEmptyComponent={ListEmpty}
          contentContainerStyle={{
            paddingTop: insets.top + 44 + spacing[2],
            paddingBottom: insets.bottom + 40,
          }}
          renderItem={({ item }) => (
            <DropCard drop={item} showCreator={false} />
          )}
          ListFooterComponent={<ListFooter count={drops.length} />}
        />
      </View>
    </>
  )
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },

  refreshOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },

  loadingBox: {
    alignItems: 'center',
    paddingTop: spacing[10],
  },
  permBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: glass.fallback.panel,
    borderRadius: radii.lg,
    paddingTop: spacing[3],
    paddingHorizontal: spacing[3],
    paddingBottom: spacing[4],
    marginTop: spacing[10],
    marginBottom: spacing[6],
    gap: spacing[3],
  },
  permIconWrap: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permTextWrap: {
    flex: 1,
  },
  permSub: {
    fontSize: fontSize.sm,
    color: colors.white,
    lineHeight: 18,
  },
  permButton: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
  },
  permButtonText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semiBold,
    color: colors.ink,
  },
  empty: {
    paddingTop: spacing[4],
  },
  createCard: {
    aspectRatio: 3 / 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: CARD_RADIUS,
    paddingHorizontal: spacing[6],
    gap: spacing[3],
    overflow: 'hidden',
  },
  createBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  createTextWrap: {
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  createHeadline: {
    fontSize: 50,
    fontWeight: fontWeight.bold,
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  createSubline: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.regular,
    color: colors.white,
    textAlign: 'center',
  },
  createButton: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[8],
  },
  createButtonText: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.strong,
    color: colors.ink,
  },
  errorBox: {
    alignItems: 'center',
    paddingTop: spacing[10],
    gap: spacing[3],
  },
  errorText: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  retryText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },

  footerPrimaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footer: {
    alignItems: 'center',
    paddingTop: spacing[6],
  },
  footerPrimaryText: {
    fontSize: fontSize.md,
    color: colors.white,
    fontWeight: fontWeight.semiBold,
  },
  footerSecondaryText: {
    fontSize: fontSize.sm,
    color: colors.white,
    fontWeight: fontWeight.regular,
  },
})
