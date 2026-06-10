import type { DropWithParticipants } from '@/api/drops.api'
import { ParticipantAvatars } from '@/components/drops/ParticipantAvatars'
import { InitialAvatar } from '@/components/ui/InitialAvatar'
import { colors, fontSize, spacing } from '@/theme'
import { formatDate } from '@/utils/date'
import { Button, Host, Menu } from '@expo/ui/swift-ui'
import { labelStyle, tint } from '@expo/ui/swift-ui/modifiers'
import { AntDesign } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native'

const AVATAR_SIZE = 34

export function DropCard({ drop, showCreator = true }: { drop: DropWithParticipants; showCreator?: boolean }) {
  const { width } = useWindowDimensions()

  const creatorName = drop.creator?.display_name ?? drop.creator?.username ?? null
  const creatorAvatar = drop.creator?.avatar_url ?? null

  const showIdentity = showCreator && !!creatorName
  const primary = showIdentity ? creatorName : drop.title
  const secondary = showIdentity ? drop.title : null

  const dateLabel = formatDate(drop.open_date)

  const showAvatar = !!(creatorAvatar || creatorName)

  const handleNavigation = () => {
    router.push({ pathname: '/drop/[id]', params: { id: drop.id } } as any)
  }

  return (
    <View style={s.post}>
      <View style={s.header}>
        {showAvatar && (
          <TouchableOpacity onPress={handleNavigation} activeOpacity={0.9}>
            <InitialAvatar name={creatorName ?? '?'} avatarUrl={creatorAvatar} size={AVATAR_SIZE} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={s.headerText}
          onPress={handleNavigation}
          activeOpacity={0.9}
        >
          <Text style={s.name} numberOfLines={1}>{primary}</Text>
          {secondary && (
            <Text style={s.subtitle} numberOfLines={1}>{secondary}</Text>
          )}
          {dateLabel && (
            <Text style={s.date} numberOfLines={1}>{dateLabel}</Text>
          )}
        </TouchableOpacity>

        <Host matchContents>
          <Menu
            label="Drop options"
            systemImage="ellipsis"
            modifiers={[labelStyle('iconOnly'), tint(colors.white)]}
          >
            <Button
              label="Share"
              systemImage="square.and.arrow.up"
              onPress={() => {
                // TODO: share drop
              }}
            />
            <Button
              label="Report"
              systemImage="exclamationmark.bubble"
              onPress={() => {
                // TODO: report drop
              }}
            />
            <Button
              label="Delete"
              role="destructive"
              systemImage="trash"
              onPress={() => {
                // TODO: delete drop
              }}
            />
          </Menu>
        </Host>
      </View>

      <TouchableOpacity
        style={[s.photoWrap, { width }]}
        onPress={handleNavigation}
        activeOpacity={0.9}
      >
        {drop.thumbnail_url ? (
          <Image source={{ uri: drop.thumbnail_url }} style={s.photo} contentFit="cover" />
        ) : (
          <View style={s.photoPlaceholder}>
            <AntDesign name="picture" size={32} color={colors.borderDefault} />
          </View>
        )}

        <View style={s.footer}>
          <ParticipantAvatars participants={drop.participants} />
        </View>
      </TouchableOpacity>
    </View>
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
    marginTop: 2,
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
    paddingHorizontal: spacing[3],
    paddingBottom: 14,
    zIndex: 1,
  },
})