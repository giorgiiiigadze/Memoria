import { getMyDrops, type DropWithParticipants } from '@/api/drops.api'
import type { DropState } from '@/types/database.types'
import { router, useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function fmtDate(iso: string) {
  const d = new Date(iso)
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

function daysUntil(iso: string): number {
  const now = new Date()
  const target = new Date(iso)
  return Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

function monthKey(iso: string) {
  const d = new Date(iso)
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

function sortAndGroup(drops: DropWithParticipants[]) {
  const withDate = [...drops.filter(d => d.open_date)].sort(
    (a, b) => new Date(a.open_date!).getTime() - new Date(b.open_date!).getTime()
  )
  const noDate = drops.filter(d => !d.open_date)

  const groups: { month: string; items: DropWithParticipants[] }[] = []
  for (const drop of withDate) {
    const key = monthKey(drop.open_date!)
    const last = groups[groups.length - 1]
    if (last && last.month === key) {
      last.items.push(drop)
    } else {
      groups.push({ month: key, items: [drop] })
    }
  }
  if (noDate.length > 0) {
    groups.push({ month: 'No date', items: noDate })
  }
  return groups
}

const STATE_META: Record<DropState, { label: string; color: string }> = {
  active:  { label: 'Active',   color: '#0044FF' },
  ready:   { label: 'Ready',    color: '#4CAF7D' },
  open:    { label: 'Open',     color: '#F59E0B' },
  expired: { label: 'Expired',  color: '#626262' },
}

export default function CalendarScreen() {
  const [drops, setDrops] = useState<DropWithParticipants[]>([])
  const [loaded, setLoaded] = useState(false)

  useFocusEffect(
    useCallback(() => {
      getMyDrops()
        .then(d => { setDrops(d); setLoaded(true) })
        .catch(console.error)
    }, [])
  )

  const groups = sortAndGroup(drops)

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content}>
      <Text style={s.heading}>Timeline</Text>

      {loaded && groups.length === 0 && (
        <View style={s.empty}>
          <Text style={s.emptyTitle}>No drops yet</Text>
          <Text style={s.emptySub}>Create a drop to see it here.</Text>
        </View>
      )}

      {groups.map(group => (
        <View key={group.month} style={s.group}>
          <Text style={s.monthLabel}>{group.month}</Text>
          {group.items.map(drop => {
            const meta = STATE_META[drop.state]
            const days = drop.open_date ? daysUntil(drop.open_date) : null
            let daysLabel = ''
            if (days !== null) {
              if (days > 1) daysLabel = `in ${days} days`
              else if (days === 1) daysLabel = 'tomorrow'
              else if (days === 0) daysLabel = 'today'
              else daysLabel = `${Math.abs(days)}d ago`
            }
            const participantCount = drop.participants?.length ?? 0

            return (
              <TouchableOpacity
                key={drop.id}
                style={s.row}
                onPress={() => router.push({ pathname: `/drop/${drop.id}`, params: { from: '/(app)/(calendar)' } } as any)}
                activeOpacity={0.75}
              >
                <View style={s.rowLeft}>
                  <Text style={s.rowDate}>{drop.open_date ? fmtDate(drop.open_date) : '—'}</Text>
                  {daysLabel ? <Text style={[s.rowDays, days !== null && days <= 0 ? s.rowDaysPast : null]}>{daysLabel}</Text> : null}
                </View>
                <View style={s.rowRight}>
                  <Text style={s.rowTitle} numberOfLines={1}>{drop.title}</Text>
                  <View style={s.rowMeta}>
                    <View style={[s.badge, { borderColor: meta.color }]}>
                      <Text style={[s.badgeLabel, { color: meta.color }]}>{meta.label}</Text>
                    </View>
                    {participantCount > 0 && (
                      <Text style={s.rowParticipants}>{participantCount} participant{participantCount !== 1 ? 's' : ''}</Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            )
          })}
        </View>
      ))}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#121212' },
  content: { paddingHorizontal: 24, paddingTop: 72, paddingBottom: 48 },
  heading: { fontSize: 22, fontWeight: '600', color: '#FFFFFF', letterSpacing: -0.5, marginBottom: 28 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 17, fontWeight: '500', color: '#FFFFFF', marginBottom: 6 },
  emptySub: { fontSize: 14, color: '#626262' },
  group: { marginBottom: 28 },
  monthLabel: { fontSize: 12, fontWeight: '600', color: '#626262', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  row: {
    flexDirection: 'row',
    gap: 14,
    paddingVertical: 13,
    borderBottomWidth: 0.5,
    borderBottomColor: '#252525',
  },
  rowLeft: { width: 80, gap: 3 },
  rowDate: { fontSize: 11, color: '#626262', lineHeight: 15 },
  rowDays: { fontSize: 11, color: '#4CAF7D', fontWeight: '500' },
  rowDaysPast: { color: '#626262' },
  rowRight: { flex: 1, gap: 6 },
  rowTitle: { fontSize: 15, fontWeight: '500', color: '#FFFFFF' },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  badge: { borderWidth: 0.5, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  badgeLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  rowParticipants: { fontSize: 11, color: '#626262' },
})
