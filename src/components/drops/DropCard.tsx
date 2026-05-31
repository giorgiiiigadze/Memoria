import type { DropWithParticipants } from '@/api/drops.api'
import type { DropState } from '@/types/database.types'
import { AntDesign } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatOpenDate(iso: string | null): string {
  if (!iso) return 'No open date'
  const d = new Date(iso)
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

export const STATE_META: Record<DropState, { label: string; color: string }> = {
  active:  { label: 'Active',   color: '#0044FF' },
  ready:   { label: 'Ready',    color: '#4CAF7D' },
  open:    { label: 'Open',     color: '#F59E0B' },
  expired: { label: 'Expired',  color: '#626262' },
}

export function DropCard({ drop, showCreator = false }: { drop: DropWithParticipants; showCreator?: boolean }) {
  const meta = STATE_META[drop.state]
  const participantCount = drop.participants?.length ?? 0
  const creatorName = drop.creator?.display_name ?? drop.creator?.username ?? null
  const creatorAvatar = drop.creator?.avatar_url ?? null
  const initial = creatorName?.charAt(0).toUpperCase() ?? '?'

  return (
    <TouchableOpacity
      style={s.card} 
      //  Fix this later
      onPress={() =>
        router.push({
          pathname: '/drop/[id]',
          params: { id: drop.id, from: '/(app)/(home)' },
        })
      }
      activeOpacity={0.85}
    >
      {/* ── Header: identity ───────────────────────────── */}
      <View style={s.header}>
        {showCreator && (
          creatorAvatar ? (
            <Image source={{ uri: creatorAvatar }} style={s.avatar} contentFit="cover" />
          ) : (
            <View style={[s.avatar, s.avatarFallback]}>
              <Text style={s.avatarInitial}>{initial}</Text>
            </View>
          )
        )}
        <View style={s.headerText}>
          <Text style={s.title} numberOfLines={1}>{drop.title}</Text>
          {showCreator && creatorName && (
            <Text style={s.subtitle} numberOfLines={1}>by {creatorName}</Text>
          )}
        </View>
      </View>

      {/* ── Photo: the hero ────────────────────────────── */}
      <View style={s.photoWrap}>
        {drop.thumbnail_url ? (
          <Image source={{ uri: drop.thumbnail_url }} style={s.photo} contentFit="cover" />
        ) : (
          <View style={s.photoPlaceholder}>
            <AntDesign name="picture" size={28} color="#3B3B3B" />
          </View>
        )}
      </View>

      {/* ── Footer: status + meta ──────────────────────── */}
      <View style={s.footer}>
        <View style={[s.badge, { borderColor: meta.color }]}>
          <Text style={[s.badgeLabel, { color: meta.color }]}>{meta.label}</Text>
        </View>
        <Text style={s.meta}>{formatOpenDate(drop.open_date)}</Text>
        {participantCount > 0 && (
          <Text style={s.meta}>
            {participantCount} participant{participantCount !== 1 ? 's' : ''}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  card: {
    backgroundColor: '#191919',
    borderWidth: 0.5,
    borderColor: '#3B3B3B',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2C2C2C',
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 15,
    fontWeight: '600',
    color: '#C4C4C4',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 13,
    color: '#898989',
    marginTop: 1,
  },

  // Photo
  photoWrap: {
    aspectRatio: 3 / 4,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: '#3B3B3B',
    backgroundColor: '#121212',
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
    paddingHorizontal: 2,
  },
  badge: {
    borderWidth: 0.5,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  meta: {
    fontSize: 12,
    color: '#626262',
  },
})