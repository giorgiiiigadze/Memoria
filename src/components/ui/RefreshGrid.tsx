import { colors } from '@/theme'
import { StyleSheet, View } from 'react-native'
import type { SharedValue } from 'react-native-reanimated'
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
} from 'react-native-reanimated'

const COLS = 3
const ROWS = 2
const TOTAL = COLS * ROWS
const GAP = 2
const ASPECT = 3 / 4
const DEFAULT_COLOR = colors.white

function easeInOut(t: number): number {
  'worklet'
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2
}

type TileProps = {
  index: number
  width: number
  color: string
  progress: SharedValue<number>
}

function Tile({ index, width, color, progress }: TileProps) {
  const height = Math.round(width / ASPECT)

  const derived = useDerivedValue(() => {
    'worklet'
    const tileP = Math.max(0, Math.min(1, progress.value * TOTAL - index))
    const t = easeInOut(tileP)
    return {
      opacity: t,
      scale: 0.85 + 0.15 * t,
    }
  })

  const style = useAnimatedStyle(() => ({
    opacity: derived.value.opacity,
    transform: [{ scale: derived.value.scale }],
  }))

  return (
    <Animated.View
      style={[s.tile, { width, height, backgroundColor: color }, style]}
    />
  )
}

type Props = {
  progress: SharedValue<number>
  size?: number
  color?: string
}

export function RefreshGrid({ progress, size = 8, color = DEFAULT_COLOR }: Props) {
  return (
    <View style={s.grid}>
      {Array.from({ length: ROWS }, (_, row) => (
        <View key={row} style={s.row}>
          {Array.from({ length: COLS }, (_, col) => (
            <Tile
              key={col}
              index={row * COLS + col}
              width={size}
              color={color}
              progress={progress}
            />
          ))}
        </View>
      ))}
    </View>
  )
}

const s = StyleSheet.create({
  grid: {
    gap: GAP,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: GAP,
  },
  tile: {
    borderRadius: 1,
  },
})
