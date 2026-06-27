import { getMyCreatedDrops } from '@/api/drops.api'
import { MiniDropGrid, MiniDropGridSkeleton } from '@/components/drops/MiniDropCard'
import { InitialAvatar } from '@/components/ui/InitialAvatar'
import { selectProfile, selectUser, useAuthStore } from '@/store/auth.store'
import { selectDropsLoaded, useDropsStore } from '@/store/drops.store'
import { colors, fontWeight, spacing } from '@/theme'
import { router, Stack, useFocusEffect } from 'expo-router'
import { SymbolView } from 'expo-symbols'
import { useCallback, useState } from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useShallow } from 'zustand/react/shallow'

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <View style={s.stat}>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  )
}

export default function ProfileScreen() {
  const user = useAuthStore(selectUser)
  const profile = useAuthStore(selectProfile)
  const signOut = useAuthStore(s => s.signOut)

  const storeLoaded = useDropsStore(selectDropsLoaded)
  const drops = useDropsStore(useShallow(s =>
    [...s.drops.filter(d => d.creator_id === user?.id)]
      .sort((a, b) => {
        if (!a.open_date && !b.open_date) return 0
        if (!a.open_date) return 1
        if (!b.open_date) return -1
        return a.open_date.localeCompare(b.open_date)
      })
  ))
  const [apiLoaded, setApiLoaded] = useState(false)
  const loadingDrops = !storeLoaded && !apiLoaded && drops.length === 0

  useFocusEffect(
    useCallback(() => {
      getMyCreatedDrops()
        .then(d => { useDropsStore.getState().upsertDrops(d); setApiLoaded(true) })
        .catch(console.error)
    }, [])
  )

  const displayedName = profile?.display_name ?? profile?.username ?? ''
  const avatarUrl = profile?.avatar_url ?? null

  const activeCount = drops.filter(d => d.state === 'active').length
  const readyCount = drops.filter(d => d.state === 'ready').length
  const openCount = drops.filter(d => d.state === 'open').length

  return (
    <View style={s.root}>
      <Stack.Screen options={{
        headerShown: true,
        headerTitle: '',
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerLeft: () => (
          <TouchableOpacity onPress={signOut} activeOpacity={0.7}>
            <Text style={s.headerBtnMuted}>Sign out</Text>
          </TouchableOpacity>
        ),
        headerRight: () => (
          <TouchableOpacity onPress={() => router.push('/(app)/(tabs)/(profile)/settings' as any)} activeOpacity={0.7}>
            <SymbolView name="gearshape.fill" size={20} tintColor={colors.white} resizeMode="scaleAspectFit" />
          </TouchableOpacity>
        ),
      }} />
      <ScrollView contentContainerStyle={s.content}>

        <View style={s.avatarWrap}>
          <InitialAvatar name={displayedName || '?'} avatarUrl={avatarUrl} size={88} />
        </View>

        <View style={s.identity}>
          <Text style={s.name}>{displayedName}</Text>
          <Text style={s.metaLine}>
            @{profile?.username}
            {profile?.bio ? `  •  ${profile.bio}` : ''}
          </Text>

          <View style={s.statsRow}>
            <Stat value={drops.length} label="Drops" />
            <Stat value={activeCount} label="Active" />
            <Stat value={readyCount} label="Ready" />
            <Stat value={openCount} label="Open" />
          </View>
        </View>

        {loadingDrops ? (
          <MiniDropGridSkeleton count={6} hPad={0} />
        ) : drops.length === 0 ? (
          <View style={s.emptyDrops}>
            <Text style={s.emptyTitle}>No drops yet</Text>
            <Text style={s.emptyText}>Tap + to create your first drop.</Text>
          </View>
        ) : (
          <MiniDropGrid drops={drops} hPad={0} backTitle="Profile" />
        )}

        {__DEV__ && (
          <TouchableOpacity style={s.devBtn} onPress={() => router.replace('/(onboarding)' as any)}>
            <Text style={s.devBtnLabel}>Dev: back to onboarding</Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingTop: spacing[6], paddingBottom: spacing[12] },

  headerBtnMuted: { fontSize: 14, color: colors.textTertiary },

  avatarWrap: { alignItems: 'center', marginBottom: spacing[5] },

  identity: { alignItems: 'center', paddingHorizontal: 20 },
  name: { fontSize: 28, fontWeight: fontWeight.semiBold, color: colors.white, letterSpacing: -0.5, textAlign: 'center', marginBottom: spacing[2] },
  metaLine: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20, paddingHorizontal: spacing[2] },

  statsRow: { flexDirection: 'row', alignSelf: 'stretch', marginTop: spacing[6], marginBottom: spacing[8] },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: fontWeight.semiBold, color: colors.white },
  statLabel: { fontSize: 13, color: colors.textMuted, marginTop: 2 },

  emptyDrops: { paddingVertical: spacing[10], alignItems: 'center', paddingHorizontal: spacing[8] },
  emptyTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '600', marginBottom: spacing[2], textAlign: 'center' },
  emptyText: { color: colors.textPrimary, fontSize: 14, textAlign: 'center', lineHeight: 20 },

  devBtn: { marginTop: spacing[10], alignItems: 'center' },
  devBtnLabel: { fontSize: 12, color: colors.textTertiary },
})
