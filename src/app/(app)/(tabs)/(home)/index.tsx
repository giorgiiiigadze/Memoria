import type { DropWithParticipants } from '@/api/drops.api'
import { DropCard } from '@/components/drops/DropCard'
import HomeHeader from '@/components/ui/HomeHeader'
import { RefreshGrid } from '@/components/ui/RefreshGrid'
import { useDrops } from '@/hooks/useDrops'
import { colors, fontSize, fontWeight, spacing } from '@/theme'
import { useFocusEffect, useScrollToTop } from 'expo-router'
import { SymbolView } from 'expo-symbols'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  FlatList,
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
    subOp.value      = withDelay(80, withSpring(0.85, spring))
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
  const listRef = useRef<FlatList<DropWithParticipants>>(null)
  const [refreshing, setRefreshing] = useState(false)
  useScrollToTop(listRef)

  useFocusEffect(useCallback(() => { if (isLoaded) refresh() }, [isLoaded]))

  // ── Animation SharedValues ────────────────────────────────────────────────
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

  // ── Pull-to-refresh ───────────────────────────────────────────────────────
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

  // ── Empty / loading / error states ───────────────────────────────────────
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
      <Text style={s.emptyTitle}>No drops yet</Text>
      <Text style={s.emptySub}>Tap Create to start your first one.</Text>
    </View>
  )

  return (
    <>
      <HomeHeader />

      <View style={s.root}>
        <View
          pointerEvents="none"
          style={[s.refreshOverlay, { top: insets.top + 44 + spacing[2] }]}
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
          ListEmptyComponent={ListEmpty}
          contentContainerStyle={[
            s.content,
            {
              paddingTop: insets.top + 44 + spacing[2],
              paddingBottom: insets.bottom + 40,
            },
          ]}
          renderItem={({ item }) => (
            <View style={s.cardWrapper}>
              <DropCard drop={item} showCreator={false} />
            </View>
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
  content: {},
  cardWrapper: {
    marginBottom: spacing[0],
  },

  // Always-present overlay — tiles are opacity 0 when progress=0
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
  empty: {
    alignItems: 'center',
    paddingTop: spacing[10],
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: fontWeight.medium,
    color: colors.white,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
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
    gap: spacing[2],
  },
  footerPrimaryText: {
    fontSize: fontSize.md,
    color: colors.white,
    fontWeight: fontWeight.semiBold,
    display: 'flex',
    alignItems: 'center',
  },
  footerSecondaryText: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    fontWeight: fontWeight.regular,
  },
})
