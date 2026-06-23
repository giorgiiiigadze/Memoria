import { getMyDrops, type DropWithParticipants } from '@/api/drops.api'
import { MiniDropGrid, MiniDropGridSkeleton } from '@/components/drops/MiniDropCard'
import CalendarHeader, { CALENDAR_TABS, type CalendarTab } from '@/components/ui/CalendarHeader'
import { FULL_MONTHS } from '@/constants/drops'
import { selectUser, useAuthStore } from '@/store/auth.store'
import { selectDropsLoaded, useDropsStore } from '@/store/drops.store'
import { colors, fontSize, fontWeight, spacing } from '@/theme'
import { useFocusEffect } from 'expo-router'
import { useCallback, useRef, useState } from 'react'
import {
  Dimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useShallow } from 'zustand/react/shallow'

const SW = Dimensions.get('window').width

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
}

function CalendarPage({ loaded, error, groups }: PageProps) {
  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={s.content}
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
  const drops = useDropsStore(useShallow(s => s.drops))
  const storeLoaded = useDropsStore(selectDropsLoaded)
  const user = useAuthStore(selectUser)
  const [apiLoaded, setApiLoaded] = useState(false)
  const [error, setError] = useState(false)
  const [activeTab, setActiveTab] = useState<CalendarTab>('All Drops')
  const scrollRef = useRef<ScrollView>(null)

  const loaded = storeLoaded || drops.length > 0 || apiLoaded

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
    <>
      <CalendarHeader activeTab={activeTab} onTabChange={handleTabChange} />
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
          <CalendarPage loaded={loaded} error={error} groups={allGroups} />
        </View>
        <View style={s.page}>
          <CalendarPage loaded={loaded} error={error} groups={myGroups} />
        </View>
      </ScrollView>
    </>
  )
}

const s = StyleSheet.create({
  pager: {
    flex: 1,
  },
  page: {
    width: SW,
    flex: 1,
  },
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingTop: spacing[4],
    paddingBottom: spacing[12],
  },
  group: {
    marginBottom: spacing[8],
  },
  monthLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.strong,
    color: colors.white,
    marginBottom: spacing[3],
    paddingHorizontal: spacing[5],
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
})
