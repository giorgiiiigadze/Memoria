import { getMyCreatedDrops, type DropWithParticipants } from '@/api/drops.api'
import { MiniDropGrid, MiniDropGridSkeleton } from '@/components/drops/MiniDropCard'
import { FULL_MONTHS } from '@/constants/drops'
import { selectUser, useAuthStore } from '@/store/auth.store'
import { useDropsStore } from '@/store/drops.store'
import { useShallow } from 'zustand/react/shallow'
import { colors, fontSize, fontWeight, spacing } from '@/theme'
import { useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'

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

export default function CalendarScreen() {
  const user = useAuthStore(selectUser)
  const cachedDrops = useDropsStore(useShallow(s => s.drops.filter(d => d.creator_id === user?.id)))
  const [drops, setDrops] = useState<DropWithParticipants[]>(cachedDrops)
  const [loaded, setLoaded] = useState(cachedDrops.length > 0)
  const [error, setError] = useState(false)

  useFocusEffect(
    useCallback(() => {
      setError(false)
      getMyCreatedDrops()
        .then(d => { setDrops(d); setLoaded(true) })
        .catch(() => { setError(true); setLoaded(true) })
    }, [])
  )

  const groups = groupByMonth(drops)

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

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingTop: spacing[2],
    paddingBottom: spacing[12],
  },
  group: {
    marginBottom: spacing[8],
  },
  monthLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semiBold,
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
