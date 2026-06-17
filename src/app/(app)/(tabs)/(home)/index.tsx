import type { DropWithParticipants } from '@/api/drops.api'
import { DropCard } from '@/components/drops/DropCard'
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
import {
  Easing,
  cancelAnimation,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const HEADER_HEIGHT  = 66
const PULL_THRESHOLD = 100 // px of overscroll to reach progress = 1

function ListFooter({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <View style={s.footer}>
      <View style={s.footerPrimaryRow}>
        <Text style={s.footerPrimaryText}>All caught up</Text>
        <SymbolView
          name="sparkles"
          size={20}
          resizeMode="scaleAspectFit"
          tintColor={colors.white}
        />
      </View>
      <Text style={s.footerSecondaryText}>
        Until the next capsule cracks open
      </Text>
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
  // gridProgress: scroll-driven (0→1) while pulling, loops while refreshing
  const gridProgress    = useSharedValue(0)
  // loadingProgress: loops while initial data is loading
  const loadingProgress = useSharedValue(0)
  // ref so the scroll handler can check without stale closure
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

  // ── Scroll handler — runs on JS thread, acceptable for slow pull gesture ──
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
    <View style={s.root}>
      {/* Pull-to-refresh indicator — always mounted, invisible at progress=0 */}
      <View
        pointerEvents="none"
        style={[s.refreshOverlay, { top: insets.top + HEADER_HEIGHT + spacing[3] }]}
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
            paddingTop: insets.top + HEADER_HEIGHT + spacing[2],
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
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing[20],
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
