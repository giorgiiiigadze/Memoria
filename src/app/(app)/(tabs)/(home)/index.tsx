import type { DropWithParticipants } from '@/api/drops.api'
import { DropCard } from '@/components/drops/DropCard'
import { useDrops } from '@/hooks/useDrops'
import { selectUser, useAuthStore } from '@/store/auth.store'
import { colors, fontSize, fontWeight, spacing } from '@/theme'
import { useFocusEffect } from 'expo-router'
import { useCallback } from 'react'
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const HEADER_HEIGHT = 66

export default function HomeScreen() {
  const insets = useSafeAreaInsets()
  const user = useAuthStore(selectUser)
  const { drops, isLoaded, error, refresh, retry } = useDrops()

  useFocusEffect(useCallback(() => { if (isLoaded) refresh() }, [isLoaded]))

  const ListEmpty = !isLoaded ? null : error ? (
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
      <FlatList<DropWithParticipants>
        data={drops}
        keyExtractor={d => d.id}
        showsVerticalScrollIndicator={false}
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
    marginBottom: spacing[2],
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
})