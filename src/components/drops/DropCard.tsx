import type { DropWithParticipants } from '@/api/drops.api'
import { DropStateBadge } from '@/components/drops/DropStateBadge'
import { InitialAvatar } from '@/components/ui/InitialAvatar'
import { colors, fontSize, spacing } from '@/theme'
import { formatDate } from '@/utils/date'
import { AntDesign } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native'

function formatOpenDate(iso: string | null): string {
  return formatDate(iso) ?? 'No open date'
}

const AVATAR_SIZE = 34

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
          <InitialAvatar name={creatorName ?? '?'} avatarUrl={creatorAvatar} size={AVATAR_SIZE} />
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
            <AntDesign name="picture" size={32} color={colors.borderDefault} />
          </View>
        )}

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

const SIDE = 10

const s = StyleSheet.create({
  post: {
    marginBottom: spacing[8],
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
    color: colors.white,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 1,
  },
  date: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: 1,
  },

  photoWrap: {
    aspectRatio: 3 / 4,
    backgroundColor: colors.surfaceDeep,
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

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[3],
    paddingBottom: 14,
    zIndex: 1,
  },
  meta: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.65)',
  },
})
