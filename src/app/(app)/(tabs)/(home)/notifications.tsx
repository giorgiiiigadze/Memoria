import {
  getNotifications,
  markNotificationRead,
  type NotificationWithMeta,
} from '@/api/notifications.api'
import NotificationItem from '@/components/ui/NotificationItem'
import { selectUser, useAuthStore } from '@/store/auth.store'
import { useNotificationsStore } from '@/store/notifications.store'
import { colors } from '@/theme'
import { HEADER_HEIGHT } from '@/utils/notifications'
import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect'
import { router, useFocusEffect } from 'expo-router'
import { SymbolView } from 'expo-symbols'
import { useCallback } from 'react'
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'

const glassAvailable = isGlassEffectAPIAvailable()

function handleTap(n: NotificationWithMeta) {
  markNotificationRead(n.id).catch(console.error)

  const navigate = () => {
    if (n.drop_id) {
      router.push({
        pathname: `/drop/${n.drop_id}`,
        params: { from: '/(app)/(home)' },
      } as any)
    } else if (n.type === 'friend_request' || n.type === 'friend_accepted') {
      router.navigate('/(app)/(friends)' as any)
    }
  }

  if (router.canDismiss()) {
    router.dismiss()
  }
  requestAnimationFrame(navigate)
}

export default function NotificationsScreen() {
  const user = useAuthStore(selectUser)
  const { notifications, setNotifications, markOneRead } = useNotificationsStore()
const translateY = useSharedValue(0)

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) translateY.value = e.translationY
    })
    .onEnd((e) => {
      if (e.translationY > 120 || e.velocityY > 800) {
        runOnJS(router.back)()
      } else {
        translateY.value = withSpring(0, { damping: 20, stiffness: 200 })
      }
    })

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }))

  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return
      getNotifications(user.id).then(setNotifications).catch(console.error)
    }, [user?.id])
  )

return (
    <Animated.View style={[s.root, animStyle]}>
      {glassAvailable ? (
        <GlassView
          style={[StyleSheet.absoluteFill, s.glass]}
          glassEffectStyle="regular"
          colorScheme="dark"
          tintColor="rgba(20,20,20,0.25)"
          collapsable={false}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, s.fallbackPanel]} collapsable={false} />
      )}

      <View style={s.content} collapsable={false}>
        <GestureDetector gesture={pan}>
          <View style={s.header} collapsable={false}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              style={({ pressed }) => pressed && s.pressed}
            >
              <SymbolView name="xmark" size={20} tintColor={colors.white} />
            </Pressable>
            <Text style={s.title}>Notifications</Text>
          </View>
        </GestureDetector>

        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          style={s.flex}
          contentContainerStyle={s.list}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyText}>No notifications yet.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <NotificationItem
              item={item}
              onPress={(it) => {
                if (!it.read) markOneRead(it.id)
                handleTap(it)
              }}
            />
          )}
        />
      </View>
    </Animated.View>
  )
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',

    marginTop: 60,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  glass: {
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
  },
  fallbackPanel: {
    backgroundColor: 'rgba(18,18,18,0.88)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
content: { flex: 1 },
  flex: { flex: 1 },
  pressed: { opacity: 0.6 },
  title: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    color: colors.white,
    fontSize: 17,
    fontWeight: '600',
  },
  header: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 10,
    elevation: 10,
  },
  list: { paddingTop: 8, paddingBottom: 8 },
  empty: { paddingTop: 80, alignItems: 'center' },
  emptyText: { fontSize: 14, color: 'rgba(255,255,255,0.55)' },
})