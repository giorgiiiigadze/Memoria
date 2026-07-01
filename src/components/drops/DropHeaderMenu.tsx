import { deleteDrop } from '@/api/drops.api'
import type { PhotoWithUploader } from '@/api/photos.api'
import { GlassIconButton } from '@/components/ui/GlassIconButton'
import { selectUser, useAuthStore } from '@/store/auth.store'
import { useDropsStore } from '@/store/drops.store'
import { colors } from '@/theme'
import { shareDrop } from '@/utils/share'
import { MenuView } from '@expo/ui/community/menu'
import { router } from 'expo-router'
import { SymbolView } from 'expo-symbols'
import { Alert, StyleSheet, View } from 'react-native'

interface DropHeaderMenuProps {
  id: string
  plain?: boolean
  photo?: PhotoWithUploader
  onPin?: () => void
  onSave?: () => void
}

export function DropHeaderMenu({ id, plain, photo, onPin, onSave }: DropHeaderMenuProps) {
  const user = useAuthStore(selectUser)
  const drop = useDropsStore(s => s.drops.find(d => d.id === id))
  const isCreator = !!drop && drop.creator_id === user?.id

  function handleDelete() {
    if (!drop) return
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
            setDrops(drops.filter(d => d.id !== id))
            router.back()
            try {
              await deleteDrop(id)
            } catch {
              useDropsStore.getState().setDrops(drops)
              Alert.alert('Delete Failed', 'Could not delete the drop. Please try again.')
            }
          },
        },
      ],
    )
  }

  const actions = [
    ...(onSave ? [{ id: 'save', title: 'Save to Camera Roll', image: 'photo.badge.arrow.down' as const }] : []),
    ...(onPin && photo ? [{ id: 'pin', title: photo.is_pinned ? 'Unpin Photo' : 'Pin Photo', image: photo.is_pinned ? 'pin.slash' as const : 'pin' as const }] : []),
    ...(drop ? [{ id: 'share', title: 'Share', image: 'square.and.arrow.up' as const }] : []),
    { id: 'report', title: 'Report', image: 'exclamationmark.bubble' as const },
    ...(isCreator ? [{ id: 'delete', title: 'Delete', image: 'trash' as const, attributes: { destructive: true } }] : []),
  ]

  return (
    <MenuView
      actions={actions}
      onPressAction={({ nativeEvent }) => {
        if (nativeEvent.event === 'save') onSave?.()
        if (nativeEvent.event === 'pin') onPin?.()
        if (nativeEvent.event === 'share' && drop) shareDrop(drop.title, drop.id)
        if (nativeEvent.event === 'report') Alert.alert('Coming soon', 'Reporting will be available in a future update.')
        if (nativeEvent.event === 'delete') handleDelete()
      }}
    >
      {plain ? (
        <View style={s.plainBtn}>
          <SymbolView name="ellipsis" size={18} tintColor={colors.white} weight="semibold" resizeMode="scaleAspectFit" />
        </View>
      ) : (
        <GlassIconButton>
          <SymbolView name="ellipsis" size={18} tintColor={colors.white} weight="semibold" resizeMode="scaleAspectFit" />
        </GlassIconButton>
      )}
    </MenuView>
  )
}

const s = StyleSheet.create({
  btn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plainBtn: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
