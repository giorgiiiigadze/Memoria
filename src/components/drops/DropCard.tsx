import type { DropWithParticipants } from '@/api/drops.api'
import { DropStateBadge } from '@/components/drops/DropStateBadge'
import { InitialAvatar } from '@/components/ui/InitialAvatar'
import { formatDate } from '@/utils/date'
import { AntDesign } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native'

function formatOpenDate(iso: string | null): string {
  return formatDate(iso) ?? 'No open date'
}

export function DropCard({ drop, showCreator = true }: { drop: DropWithParticipants; showCreator?: boolean }) {
  const { width } = useWindowDimensions()

  const participantCount = drop.participants?.length ?? 0
  const creatorName = drop.creator?.display_name ?? drop.creator?.username ?? null
  const creatorAvatar = drop.creator?.avatar_url ?? null

  const showIdentity = showCreator && !!creatorName
  const primary = showIdentity ? creatorName : drop.title
  const secondary = showIdentity ? drop.title : null

  const showAvatar = !!(creatorAvatar || creatorName)

  const createdDate = formatDate(drop.created_at)

  return (
    <TouchableOpacity
      style={s.post}
      onPress={() =>
        router.push({ pathname: '/drop/[id]', params: { id: drop.id } } as any)
      }
      activeOpacity={0.9}
    >
      <View style={s.header}>
        {showAvatar && (
          <InitialAvatar name={creatorName ?? '?'} avatarUrl={creatorAvatar} size={32} />
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

      <View style={[s.photoWrap, { width }]}>
        {drop.thumbnail_url ? (
          <Image source={{ uri: drop.thumbnail_url }} style={s.photo} contentFit="cover" />
        ) : (
          <View style={s.photoPlaceholder}>
            <AntDesign name="picture" size={32} color="#3B3B3B" />
          </View>
        )}

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.88)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={s.scrim}
          pointerEvents="none"
        />

        <View style={s.footer}>
          <DropStateBadge state={drop.state} />
          <Text style={s.meta}>{formatOpenDate(drop.open_date)}</Text>
          {participantCount > 0 && (
            <Text style={s.meta}>
              {participantCount} participant{participantCount !== 1 ? 's' : ''}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  )
}

const SIDE = 6

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
    borderRadius: 14,
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

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingBottom: 14,
    zIndex: 1,
  },
  meta: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
  },
})