import type { DropWithParticipants } from '@/api/drops.api'
import { DropCard } from '@/components/drops/DropCard'
import { useDrops } from '@/hooks/useDrops'
import { selectUser, useAuthStore } from '@/store/auth.store'
import { colors } from '@/theme'
import { useFocusEffect } from 'expo-router'
import { useCallback, useMemo, useRef, useState } from 'react'
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type LayoutChangeEvent,
} from 'react-native'
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedProps,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const TABS = ['My Drops', 'Invited'] as const

const TOPBAR_HEIGHT = 44
const TABS_HEIGHT = 48
const INDICATOR_WIDTH = 26

const FADE_TOPBAR = 50
const FADE_TABS = 84

export default function HomeScreen() {
  const insets = useSafeAreaInsets()
  const user = useAuthStore(selectUser)
  const { drops, isLoaded, error, refresh, retry } = useDrops()

  useFocusEffect(useCallback(() => { if (isLoaded) refresh() }, [isLoaded]))

  const scrollY = useSharedValue(0)
  const scrollHandler = useAnimatedScrollHandler(e => {
    scrollY.value = e.contentOffset.y
  })

  // The whole header (background + content) dissolves as you scroll...
  const headerFadeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, FADE_TABS], [1, 0], Extrapolation.CLAMP),
  }))
  // ...and the top bar fades a touch faster, so it leads the dissolve.
  const topBarStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, FADE_TOPBAR], [1, 0], Extrapolation.CLAMP),
  }))
  // Once fully faded, let touches fall through to the list underneath.
  // `box-none` keeps the tab buttons tappable while passing scroll gestures
  // in the empty regions straight through to the feed.
  const headerPointerProps = useAnimatedProps(() => ({
    pointerEvents: scrollY.value >= FADE_TABS ? ('none' as const) : ('box-none' as const),
  }))

  const listRef = useRef<FlatList<DropWithParticipants>>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [stripWidth, setStripWidth] = useState(0)
  const indicatorX = useSharedValue(0)
  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }))

  const indicatorTargetFor = (index: number, width: number) => {
    const tabWidth = width / 2
    return index * tabWidth + (tabWidth - INDICATOR_WIDTH) / 2
  }

  const onStripLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width
    setStripWidth(width)
    indicatorX.value = indicatorTargetFor(activeIndex, width) // no animation on first measure
  }

  const onTabPress = (index: number) => {
    // Tapping the active tab scrolls back to top (which fades the header in).
    listRef.current?.scrollToOffset({ offset: 0, animated: true })
    if (index === activeIndex) return
    setActiveIndex(index)
    indicatorX.value = withTiming(indicatorTargetFor(index, stripWidth), { duration: 220 })
  }

  // ── Data ──────────────────────────────────────────────────────────────--
  const { myDrops, invitedDrops } = useMemo(
    () => ({
      myDrops: drops.filter(d => d.creator_id === user?.id),
      invitedDrops: drops.filter(d => d.creator_id !== user?.id),
    }),
    [drops, user?.id]
  )
  const activeDrops = activeIndex === 0 ? myDrops : invitedDrops
  const showCreator = activeIndex === 1

  const [refreshing, setRefreshing] = useState(false)
  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try { await refresh() } finally { setRefreshing(false) }
  }, [refresh])

  const ListEmpty = !isLoaded ? null : error ? (
    <View style={s.errorBox}>
      <Text style={s.errorText}>{error}</Text>
      <TouchableOpacity onPress={retry} activeOpacity={0.7}>
        <Text style={s.retryText}>Try again</Text>
      </TouchableOpacity>
    </View>
  ) : (
    <View style={s.empty}>
      <Text style={s.emptyTitle}>
        {activeIndex === 0 ? 'No drops yet' : 'No invites yet'}
      </Text>
      <Text style={s.emptySub}>
        {activeIndex === 0
          ? 'Tap Create to start your first one.'
          : 'Drops your friends invite you to land here.'}
      </Text>
    </View>
  )

  const headerHeight = insets.top + TOPBAR_HEIGHT + TABS_HEIGHT

  return (
    <View style={s.root}>
      <Animated.FlatList<DropWithParticipants>
        ref={listRef}
        data={activeDrops}
        keyExtractor={d => d.id}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={ListEmpty}
        contentContainerStyle={[
          s.content,
          { paddingTop: headerHeight + 8, paddingBottom: insets.bottom + 40 },
        ]}
        renderItem={({ item }) => (
          <View style={s.cardWrapper}>
            <DropCard drop={item} showCreator={showCreator} />
          </View>
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FFFFFF"
            progressViewOffset={headerHeight}
          />
        }
      />
      
      <Animated.View
        style={[s.header, { paddingTop: insets.top, height: headerHeight }, headerFadeStyle]}
        animatedProps={headerPointerProps}
      >
        <Animated.View style={[s.topBar, topBarStyle]} pointerEvents="none">
          <Text style={s.wordmark}>Memoria</Text>
        </Animated.View>

        <View style={s.tabs}>
          <View style={s.tabStrip} onLayout={onStripLayout}>
            {TABS.map((label, i) => {
              const active = i === activeIndex
              return (
                <Pressable
                  key={label}
                  style={s.tab}
                  onPress={() => onTabPress(i)}
                  hitSlop={8}
                >
                  <Text style={[s.tabLabel, active && s.tabLabelActive]}>{label}</Text>
                </Pressable>
              )
            })}
            <Animated.View style={[s.indicator, indicatorStyle]} />
          </View>
        </View>
      </Animated.View>
    </View>
  )
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    marginTop: 30,
  },
  cardWrapper: {
    marginBottom: 8,
  },

  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  topBar: {
    height: TOPBAR_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: {
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: -0.3,
    color: '#FFFFFF',
  },

  tabs: {
    height: TABS_HEIGHT,
  },
  tabStrip: {
    flex: 1,
    flexDirection: 'row',
    position: 'relative',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#626262',
  },
  tabLabelActive: {
    color: '#FFFFFF',
  },
  indicator: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    width: INDICATOR_WIDTH,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#ffffff',
  },

  // States
  empty: {
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 14,
    color: '#626262',
  },
  errorBox: {
    alignItems: 'center',
    paddingTop: 40,
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#626262',
    textAlign: 'center',
  },
  retryText: {
    fontSize: 14,
    color: '#0044FF',
    fontWeight: '500',
  },
})