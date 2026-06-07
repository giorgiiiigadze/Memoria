import { GlassBackButton } from '@/components/ui/GlassBackButton'
import { colors, fontWeight, spacing } from '@/theme'
import { router } from 'expo-router'
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
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
        <GlassBackButton onPress={() => router.back()} />
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
  backGlass: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceInput,
    borderWidth: 0.5,
    borderColor: colors.borderDefault,
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
