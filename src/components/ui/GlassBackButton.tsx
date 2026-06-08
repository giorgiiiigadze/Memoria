import { GlassIconButton } from '@/components/ui/GlassIconButton'

type Props = {
  onPress: () => void
  iconColor?: string
}

export function GlassBackButton({ onPress, iconColor }: Props) {
  return (
    <GlassIconButton
      onPress={onPress}
      iconName="chevron.left"
      iconColor={iconColor}
    />
  )
}

