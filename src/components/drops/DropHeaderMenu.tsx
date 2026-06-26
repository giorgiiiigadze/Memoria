import { deleteDrop } from '@/api/drops.api'
import { selectUser, useAuthStore } from '@/store/auth.store'
import { useDropsStore } from '@/store/drops.store'
import { colors } from '@/theme'
import { shareDrop } from '@/utils/share'
import { MenuView } from '@expo/ui/community/menu'
import { GlassContainer, GlassView } from 'expo-glass-effect'
import { router } from 'expo-router'
import { SymbolView } from 'expo-symbols'
import { Alert, StyleSheet, View } from 'react-native'

export function DropHeaderMenu({ id, plain }: { id: string; plain?: boolean }) {
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
    ...(drop ? [{ id: 'share', title: 'Share', image: 'square.and.arrow.up' as const }] : []),
    { id: 'report', title: 'Report', image: 'exclamationmark.bubble' as const },
    ...(isCreator ? [{ id: 'delete', title: 'Delete', image: 'trash' as const, attributes: { destructive: true } }] : []),
  ]

  return (
    <MenuView
      actions={actions}
      onPressAction={({ nativeEvent }) => {
        if (nativeEvent.event === 'share' && drop) shareDrop(drop.title, drop.id)
        if (nativeEvent.event === 'report') Alert.alert('Coming soon', 'Reporting will be available in a future update.')
        if (nativeEvent.event === 'delete') handleDelete()
      }}
    >
      {plain ? (
        <View style={s.plainBtn}>
          <SymbolView name="ellipsis" size={20} tintColor={colors.white} resizeMode="scaleAspectFit" />
        </View>
      ) : (
        <GlassContainer>
          <GlassView isInteractive colorScheme="light" style={s.btn}>
            <SymbolView name="ellipsis" size={20} tintColor={colors.white} resizeMode="scaleAspectFit" />
          </GlassView>
        </GlassContainer>
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
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
