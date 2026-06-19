import { colors, fontWeight, spacing } from '@/theme'
import { router } from 'expo-router'
import { SymbolView } from 'expo-symbols'
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle
} from 'react-native'

type Props = {
  heading: string
  footer: React.ReactNode
  children: React.ReactNode
  topStyle?: StyleProp<ViewStyle>
}

export function AuthStepLayout({ heading, footer, children, topStyle }: Props) {
  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.backWrap}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} activeOpacity={0.7}>
          <SymbolView name="chevron.left" size={22} tintColor={colors.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <View style={[styles.top, topStyle]}>
          <Text style={styles.heading}>{heading}</Text>
          {children}
        </View>

        <View style={styles.footer}>{footer}</View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backWrap: {
    marginTop: 56,
    marginLeft: spacing[6],
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[5],
    justifyContent: 'space-between',
  },
  top: {
    marginTop: spacing[6],
    alignItems: 'center',
  },
  heading: {
    fontSize: 16,
    fontWeight: fontWeight.strong,
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing[4],
  },
  footer: {
    gap: 10,
    marginBottom: spacing[5],
  },
})
