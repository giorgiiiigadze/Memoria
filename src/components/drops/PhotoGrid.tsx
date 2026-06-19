import type { PhotoWithUploader } from '@/api/photos.api'
import { MiniPhotoCard } from '@/components/drops/MiniDropCard'
import { colors } from '@/theme'
import { FlatList, RefreshControl, useWindowDimensions, View } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'

const COLS = 3
const GAP = 4

type Props = {
  photos: PhotoWithUploader[]
  onSelect: (index: number) => void
  refreshing: boolean
  onRefresh: () => void
  topInset: number
}

type TileProps = {
  photo: PhotoWithUploader
  size: number
  index: number
  onPress: () => void
}

function Tile({ photo, size, index, onPress }: TileProps) {
  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index * 20, 200)).duration(280)}>
      <MiniPhotoCard photo={photo} size={size} onPress={onPress} />
    </Animated.View>
  )
}

export function PhotoGrid({ photos, onSelect, refreshing, onRefresh, topInset }: Props) {
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
        <Tile
          photo={item}
          size={tileSize}
          index={index}
          onPress={() => onSelect(index)}
        />
      )}
    />
  )
}
