import { GlassBackButton } from '@/components/ui/GlassBackButton'
import { colors, spacing } from '@/theme'
import { router } from 'expo-router'
import { StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface DropDetailHeaderProps {
  title: string
}

export function DropDetailHeader({ title }: DropDetailHeaderProps) {
  const insets = useSafeAreaInsets()

  return (
    <View style={[s.header, { top: insets.top }]}>
      <GlassBackButton onPress={() => router.back()} />
      <Text style={s.title} numberOfLines={1}>{title}</Text>
      <View style={s.spacer} />
    </View>
  )
}

const s = StyleSheet.create({
  header: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[2.5],
    paddingVertical: spacing[2],
    zIndex: 10,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  spacer: {
    width: spacing[10],
  },
})
