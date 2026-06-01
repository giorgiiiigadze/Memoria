import type { DropWithParticipants } from '@/api/drops.api'
import type { DropState } from '@/types/database.types'
import { AntDesign } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatDate(iso: string | null | undefined): string | null {
  if (!iso) return null
  const d = new Date(iso)
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

function formatOpenDate(iso: string | null): string {
  return formatDate(iso) ?? 'No open date'
}

export const STATE_META: Record<DropState, { label: string; color: string }> = {
  active:  { label: 'Active',   color: '#0044FF' },
  ready:   { label: 'Ready',    color: '#4CAF7D' },
  open:    { label: 'Open',     color: '#F59E0B' },
  expired: { label: 'Expired',  color: '#626262' },
}

export function DropCard({ drop, showCreator = true }: { drop: DropWithParticipants; showCreator?: boolean }) {
  const { width } = useWindowDimensions()

  const meta = STATE_META[drop.state]
  const participantCount = drop.participants?.length ?? 0
  const creatorName = drop.creator?.display_name ?? drop.creator?.username ?? null
  const creatorAvatar = drop.creator?.avatar_url ?? null
  const initial = creatorName?.charAt(0).toUpperCase() ?? '?'

  const showIdentity = showCreator && !!creatorName
  const primary = showIdentity ? creatorName : drop.title
  const secondary = showIdentity ? drop.title : null

  const showAvatar = !!(creatorAvatar || creatorName)

  const createdDate = formatDate(drop.created_at)

  return (
    <TouchableOpacity
      style={s.post}
      onPress={() =>
        router.push({
          pathname: '/drop/[id]',
          params: { id: drop.id, from: '/(app)/(home)' },
        })
      }
      activeOpacity={0.9}
    >
      <View style={s.header}>
        {showAvatar && (
          creatorAvatar ? (
            <Image source={{ uri: creatorAvatar }} style={s.avatar} contentFit="cover" />
          ) : (
            <View style={[s.avatar, s.avatarFallback]}>
              <Text style={s.avatarInitial}>{initial}</Text>
            </View>
          )
        )}
        <View style={s.headerText}>
          <Text style={s.name} numberOfLines={1}>{primary}</Text>
          {secondary && (
            <Text style={s.subtitle} numberOfLines={1}>{secondary}</Text>
          )}
          {createdDate && (
            <Text style={s.date} numberOfLines={1}>{createdDate}</Text>
          )}
        </View>
      </View>

      {/* ── Photo: the hero, full bleed ─────────────────── */}
      <View style={[s.photoWrap, { width }]}>
        {drop.thumbnail_url ? (
          <Image source={{ uri: drop.thumbnail_url }} style={s.photo} contentFit="cover" />
        ) : (
          <View style={s.photoPlaceholder}>
            <AntDesign name="picture" size={32} color="#3B3B3B" />
          </View>
        )}

        {drop.thumbnail_url && (
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.88)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={s.scrim}
            pointerEvents="none"
          />
        )}
      </View>

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

const SIDE = 8

const s = StyleSheet.create({
  post: {
    marginBottom: 32,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
    paddingHorizontal: SIDE,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2C2C2C',
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C4C4C4',
  },
  headerText: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 13,
    color: '#898989',
    marginTop: 1,
  },
  date: {
    fontSize: 12,
    color: '#626262',
    marginTop: 1,
  },

  photoWrap: {
    aspectRatio: 3 / 4,
    backgroundColor: '#121212',
    overflow: 'hidden',
    borderRadius: 12,
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
  scrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
  },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
    paddingHorizontal: SIDE,
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