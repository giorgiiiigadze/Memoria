import type { PhotoWithUploader } from '@/api/photos.api'
import { MiniPhotoCard } from '@/components/drops/MiniDropCard'
import { colors } from '@/theme'
import { FlatList, RefreshControl, useWindowDimensions, View } from 'react-native'

const COLS = 2
const GAP = 4

type Props = {
  photos: PhotoWithUploader[]
  onSelect: (index: number) => void
  refreshing: boolean
  onRefresh: () => void
  topInset: number
  isLocked?: boolean
  currentUserId?: string
}

export function PhotoGrid({ photos, onSelect, refreshing, onRefresh, topInset, isLocked, currentUserId }: Props) {
  const { width } = useWindowDimensions()
  const tileSize = Math.floor((width - GAP * (COLS - 1)) / COLS)

  return (
    <FlatList
      data={photos}
      numColumns={COLS}
      keyExtractor={p => p.id}
      showsVerticalScrollIndicator={false}
      columnWrapperStyle={{ gap: GAP }}
      ItemSeparatorComponent={() => <View style={{ height: GAP }} />}
      contentContainerStyle={{ paddingTop: topInset }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.bone}
          colors={[colors.bone]}
        />
      }
      renderItem={({ item, index }) => (
        <MiniPhotoCard
          photo={item}
          size={tileSize}
          blurred={isLocked && item.uploader_id !== currentUserId}
          onPress={() => onSelect(index)}
        />
      )}
    />
  )
}
