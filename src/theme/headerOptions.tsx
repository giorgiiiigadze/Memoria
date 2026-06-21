import { colors } from './colors'
import { fontWeight } from './typography'
import { View } from 'react-native'

export const transparentHeaderOptions = {
  headerShown: true,
  headerTransparent: true,
  headerShadowVisible: false,
  headerStyle: { backgroundColor: 'transparent' },
  headerBackground: () => <View style={{ flex: 1, backgroundColor: 'transparent' }} />,
  headerTitleStyle: { color: colors.white, fontWeight: fontWeight.semiBold, fontSize: 18 },
  headerTintColor: colors.white,
} as const
