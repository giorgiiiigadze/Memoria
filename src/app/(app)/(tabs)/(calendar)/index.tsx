import { getMyDrops, type DropWithParticipants } from '@/api/drops.api'
import { MiniDropGrid, MiniDropGridSkeleton } from '@/components/drops/MiniDropCard'
import CalendarHeader, { CALENDAR_TABS, type CalendarTab } from '@/components/ui/CalendarHeader'
import { FULL_MONTHS } from '@/constants/drops'
import { selectUser, useAuthStore } from '@/store/auth.store'
import { selectDropsLoaded, useDropsStore } from '@/store/drops.store'
import { colors, fontSize, fontWeight, spacing } from '@/theme'
import { LinearGradient } from 'expo-linear-gradient'
import { Stack, useFocusEffect } from 'expo-router'
import { useCallback, useRef, useState } from 'react'
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useShallow } from 'zustand/react/shallow'

const { width: SW, height: SH } = Dimensions.get('window')

function monthLabel(iso: string) {
  const d = new Date(iso)
  return `${FULL_MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

function groupByMonth(drops: DropWithParticipants[]) {
  const withDate = [...drops.filter(d => d.open_date)].sort(
    (a, b) => new Date(a.open_date!).getTime() - new Date(b.open_date!).getTime()
  )

  const groups: { label: string; items: DropWithParticipants[] }[] = []
  for (const drop of withDate) {
    const label = monthLabel(drop.open_date!)
    const last = groups[groups.length - 1]
    if (last && last.label === label) {
      last.items.push(drop)
    } else {
      groups.push({ label, items: [drop] })
    }
  }

  const noDate = drops.filter(d => !d.open_date)
  if (noDate.length > 0) {
    groups.push({ label: 'No date', items: noDate })
  }

  return groups
}

type PageProps = {
  loaded: boolean
  error: boolean
  groups: { label: string; items: DropWithParticipants[] }[]
  topInset: number
}

function CalendarPage({ loaded, error, groups, topInset }: PageProps) {
  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={[s.content, { paddingTop: topInset }]}
      showsVerticalScrollIndicator={false}
    >
      {!loaded && (
        <View style={s.group}>
          <View style={s.skeletonLabel} />
          <MiniDropGridSkeleton count={6} hPad={0} />
        </View>
      )}

      {loaded && error && (
        <View style={s.empty}>
          <Text style={s.emptyTitle}>Something went wrong</Text>
          <Text style={s.emptySub}>Pull to refresh and try again.</Text>
        </View>
      )}

      {loaded && !error && groups.length === 0 && (
        <View style={s.empty}>
          <Text style={s.emptyTitle}>No drops yet</Text>
          <Text style={s.emptySub}>Create a drop to see it here.</Text>
        </View>
      )}

      {groups.map(group => (
        <View key={group.label} style={s.group}>
          <Text style={s.monthLabel}>{group.label}</Text>
          <MiniDropGrid drops={group.items} hPad={0} backTitle="Calendar" />
        </View>
      ))}

    </ScrollView>
  )
}

export default function CalendarScreen() {
  const insets = useSafeAreaInsets()
  const drops = useDropsStore(useShallow(s => s.drops))
  const storeLoaded = useDropsStore(selectDropsLoaded)
  const user = useAuthStore(selectUser)
  const [apiLoaded, setApiLoaded] = useState(false)
  const [error, setError] = useState(false)
  const [activeTab, setActiveTab] = useState<CalendarTab>('All Drops')
  const scrollRef = useRef<ScrollView>(null)

  const loaded = storeLoaded || drops.length > 0 || apiLoaded
  const topInset = insets.top + 44 + spacing[2]

  useFocusEffect(
    useCallback(() => {
      setError(false)
      getMyDrops()
        .then(d => {
          useDropsStore.getState().upsertDrops(d)
          setApiLoaded(true)
        })
        .catch(() => { setError(true); setApiLoaded(true) })
    }, [])
  )

  const allGroups = groupByMonth(drops)
  const myGroups = groupByMonth(drops.filter(d => d.creator_id === user?.id))

  function handleTabChange(tab: CalendarTab) {
    setActiveTab(tab)
    scrollRef.current?.scrollTo({ x: CALENDAR_TABS.indexOf(tab) * SW, animated: true })
  }

  function handleMomentumScrollEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const page = Math.round(e.nativeEvent.contentOffset.x / SW)
    setActiveTab(CALENDAR_TABS[page])
  }

  return (
    <View style={s.screen}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        style={s.pager}
      >
        <View style={s.page}>
          <CalendarPage loaded={loaded} error={error} groups={allGroups} topInset={topInset} />
        </View>
        <View style={s.page}>
          <CalendarPage loaded={loaded} error={error} groups={myGroups} topInset={topInset} />
        </View>
      </ScrollView>

      <LinearGradient
        colors={['rgba(0,0,0,0.6)', 'transparent']}
        style={s.topScrim}
        pointerEvents="none"
      />

      <CalendarHeader activeTab={activeTab} onTabChange={handleTabChange} />
    </View>
  )
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  topScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 160,
    zIndex: 5,
  },
  pager: {
    flex: 1,
  },
  page: {
    width: SW,
    height: SH,
  },
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: spacing[12],
  },
  group: {
    marginBottom: spacing[5],
  },
  monthLabel: {
    fontSize: 18,
    fontWeight: fontWeight.semiBold,
    color: colors.white,
    marginBottom: spacing[3],
    paddingLeft: spacing[4],
  },
  footer: {
    fontSize: 13,
    color: colors.textTertiary,
    textAlign: 'center',
    paddingHorizontal: spacing[8],
    paddingTop: spacing[4],
    paddingBottom: spacing[2],
  },
  skeletonLabel: {
    height: 13,
    width: 100,
    borderRadius: 6,
    backgroundColor: colors.surfaceRaised,
    marginBottom: spacing[3],
    marginHorizontal: spacing[5],
  },
  empty: {
    alignItems: 'center',
    paddingTop: spacing[10],
    paddingHorizontal: spacing[8],
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: fontWeight.semiBold,
    color: colors.textPrimary,
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 14,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 20,
  },
})
