import { selectUnreadCount, useNotificationsStore } from '@/store/notifications.store'
import { colors, fontWeight, spacing } from '@/theme'
import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect'
import { router } from 'expo-router'
import { SymbolView } from 'expo-symbols'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const glassAvailable = isGlassEffectAPIAvailable()

type GlassStyle = 'regular' | 'clear'
type Scheme = 'light' | 'dark'

type Props = {
  onSendPress?: () => void
  onBellPress?: () => void

  glassStyle?: GlassStyle
  scheme?: Scheme
  tintColor?: string
  iconColor?: string
}

export default function HomeHeader({
  onSendPress,
  onBellPress = () => router.push('/(app)/(tabs)/(home)/notifications' as any),
  glassStyle = 'regular',
  scheme = 'dark',
  tintColor = 'rgba(0,0,0,0.18)',
  iconColor = colors.white,
}: Props) {
  const insets = useSafeAreaInsets()
  const count = useNotificationsStore(selectUnreadCount)

  const pill = glassAvailable ? (
    <GlassView
      key={scheme}
      style={styles.pill}
      glassEffectStyle={glassStyle}
      colorScheme={scheme}
      tintColor={tintColor}
    >
      <Buttons
        count={count}
        iconColor={iconColor}
        onSendPress={onSendPress}
        onBellPress={onBellPress}
      />
    </GlassView>
  ) : (
    <View style={[styles.pill, styles.pillFallback]}>
      <Buttons
        count={count}
        iconColor={iconColor}
        onSendPress={onSendPress}
        onBellPress={onBellPress}
      />
    </View>
  )

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* left spacer balances the right pill so the brand stays centered */}
      <View style={styles.side} />
      <Text style={styles.brand}>Memoria</Text>
      <View style={styles.side}>{pill}</View>
    </View>
  )
}

function Buttons({
  count,
  iconColor,
  onSendPress,
  onBellPress,
}: {
  count: number
  iconColor: string
  onSendPress?: () => void
  onBellPress?: () => void
}) {
  return (
    <>
      <TouchableOpacity style={styles.iconBtn} onPress={onSendPress} hitSlop={12} activeOpacity={0.7}>
        <SymbolView name="paperplane.fill" size={26} tintColor={iconColor} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.iconBtn} onPress={onBellPress} hitSlop={12} activeOpacity={0.7}>
        <SymbolView name="bell.fill" size={26} tintColor={iconColor} />
        {count > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
          </View>
        )}
      </TouchableOpacity>
    </>
  )
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[2.5],
    paddingBottom: spacing[3],
  },
  side: {
    flex: 1,
    alignItems: 'flex-end',
  },
  brand: {
    fontSize: 18,
    fontWeight: fontWeight.bold,
    color: colors.white,
    letterSpacing: -0.4,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[6],
    borderRadius: 999,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2.5],
  },
  pillFallback: {
    backgroundColor: colors.surfaceInput,
    borderWidth: 0.5,
    borderColor: colors.borderDefault,
  },
  iconBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.error ?? '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
})