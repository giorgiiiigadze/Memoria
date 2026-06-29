import { deleteDrop, type DropWithParticipants } from '@/api/drops.api'
import { ParticipantAvatars } from '@/components/drops/ParticipantAvatars'
import { InitialAvatar } from '@/components/ui/InitialAvatar'
import { CARD_RADIUS } from '@/constants/drops'
import { selectUser, useAuthStore } from '@/store/auth.store'
import { useDropsStore } from '@/store/drops.store'
import { colors, fontWeight, spacing } from '@/theme'
import { dropTimeLabel } from '@/utils/date'
import { shareDrop } from '@/utils/share'
import { Button, Host, Menu } from '@expo/ui/swift-ui'
import { labelStyle, tint } from '@expo/ui/swift-ui/modifiers'
import { AntDesign } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

const AVATAR_SIZE = 34

export function DropCard({ drop, showCreator = true }: { drop: DropWithParticipants; showCreator?: boolean }) {
  const user = useAuthStore(selectUser)

  const creatorName = drop.creator?.display_name ?? drop.creator?.username ?? null
  const creatorAvatar = drop.creator?.avatar_url ?? null

  const showIdentity = showCreator && !!creatorName
  const primary = showIdentity ? creatorName : drop.title

  const dateLabel = dropTimeLabel(drop.state, drop.open_date)
  const showAvatar = !!(creatorAvatar || creatorName)
  const isCreator = user?.id === drop.creator?.id

  const handleNavigation = () => {
    router.push({ pathname: '/drop/[id]', params: { id: drop.id, backTitle: 'Home' } } as any)
  }

  function handleDelete() {
    Alert.alert(
      'Delete Drop',
      `"${drop.title}" will be permanently deleted for everyone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { drops, setDrops } = useDropsStore.getState()
            setDrops(drops.filter(d => d.id !== drop.id))
            try {
              await deleteDrop(drop.id)
            } catch {
              setDrops(drops)
              Alert.alert('Delete Failed', 'Could not delete the drop. Please try again.')
            }
          },
        },
      ],
    )
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
          {dateLabel && (
            <Text style={s.date} numberOfLines={1}>{dateLabel}</Text>
          )}
        </TouchableOpacity>

        <Host style={s.menuHost}>
          <Menu
            label="Drop options"
            systemImage="ellipsis"
            modifiers={[labelStyle('iconOnly'), tint(colors.white)]}
          >
            <Button
              label="Share"
              systemImage="square.and.arrow.up"
              modifiers={[tint(colors.ink)]}
              onPress={() => shareDrop(drop.title, drop.id)}
            />
            <Button
              label="Report"
              systemImage="exclamationmark.bubble"
              modifiers={[tint(colors.ink)]}
              onPress={() => Alert.alert('Coming soon', 'Reporting will be available in a future update.')}
            />
            {isCreator && (
              <Button
                label="Delete"
                role="destructive"
                systemImage="trash"
                modifiers={[tint(colors.error)]}
                onPress={handleDelete}
              />
            )}
          </Menu>
        </Host>
      </View>

      <TouchableOpacity
        style={s.photoWrap}
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

        {drop.participants.length > 0 && (
          <View style={s.footer}>
            <ParticipantAvatars participants={drop.participants} />
          </View>
        )}
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
    marginBottom: 8,
    paddingHorizontal: SIDE,
  },
  headerText: {
    flex: 1,
  },
  menuHost: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 15,
    fontWeight: fontWeight.medium,
    color: colors.white,
  },
  date: {
    fontSize: 15,
    fontWeight: fontWeight.regular,
    color: colors.textTertiary,
  },
  photoWrap: {
    aspectRatio: 3 / 4,
    backgroundColor: colors.surfaceDeep,
    overflow: 'hidden',
    borderRadius: CARD_RADIUS,
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
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
  },
})