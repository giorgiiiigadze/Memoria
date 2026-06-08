import { GlassIconButton } from '@/components/ui/GlassIconButton'

type Props = {
  onPress: () => void
  iconColor?: string
}

export function GlassCloseButton({ onPress, iconColor }: Props) {
  return (
    <GlassIconButton
      onPress={onPress}
      iconName="xmark"
      iconWeight="semibold"
      iconColor={iconColor}
    />
  )
}
