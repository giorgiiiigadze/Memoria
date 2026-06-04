import type { DropWithParticipants } from '@/api/drops.api'
import { DropCard } from '@/components/drops/DropCard'
import { useDrops } from '@/hooks/useDrops'
import { selectUser, useAuthStore } from '@/store/auth.store'
import { colors } from '@/theme'
import { useFocusEffect } from 'expo-router'
import { useCallback } from 'react'
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

type ListItem =
  | { kind: 'section-header'; label: string; key: string }
  | { kind: 'drop'; drop: DropWithParticipants; showCreator: boolean; key: string }

function buildItems(
  myDrops: DropWithParticipants[],
  invitedDrops: DropWithParticipants[]
): ListItem[] {
  const items: ListItem[] = []
  if (myDrops.length > 0) {
    if (invitedDrops.length > 0) {
      items.push({ kind: 'section-header', label: 'Your Drops', key: 'header-my' })
    }
    myDrops.forEach(d => items.push({ kind: 'drop', drop: d, showCreator: false, key: d.id }))
  }
  if (invitedDrops.length > 0) {
    items.push({ kind: 'section-header', label: 'Invited', key: 'header-invited' })
    invitedDrops.forEach(d => items.push({ kind: 'drop', drop: d, showCreator: true, key: `invited-${d.id}` }))
  }
  return items
}

export default function HomeScreen() {
  const user = useAuthStore(selectUser)
  const { drops, isLoaded, error, refresh, retry } = useDrops()

  useFocusEffect(useCallback(() => { if (isLoaded) refresh() }, [isLoaded]))

  const myDrops = drops.filter(d => d.creator_id === user?.id)
  const invitedDrops = drops.filter(d => d.creator_id !== user?.id)
  const items = buildItems(myDrops, invitedDrops)

  const ListEmpty = isLoaded ? (
    error ? (
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
  ) : null

  return (
    <FlatList
      style={s.root}
      contentContainerStyle={s.content}
      data={items}
      keyExtractor={item => item.key}
      ListEmptyComponent={ListEmpty}
      renderItem={({ item }) => {
        if (item.kind === 'section-header') {
          return <Text style={s.sectionLabel}>{item.label}</Text>
        }
        return (
          <View style={s.cardWrapper}>
            <DropCard drop={item.drop} showCreator={item.showCreator} />
          </View>
        )
      }}
    />
  )
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: 40,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
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
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#626262',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 8,
  },
  cardWrapper: {
    marginBottom: 8,
  },
  errorBox: {
    alignItems: 'center',
    paddingTop: 60,
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
