import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect'
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
  type ViewStyle,
} from 'react-native'

type Props = {
  heading: string
  footer: React.ReactNode
  children: React.ReactNode
  topStyle?: StyleProp<ViewStyle>
}

const glassAvailable = isGlassEffectAPIAvailable()

export function AuthStepLayout({ heading, footer, children, topStyle }: Props) {
  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableOpacity
        style={styles.backWrap}
        onPress={() => router.back()}
        hitSlop={12}
        activeOpacity={0.8}
      >
        {glassAvailable ? (
          <GlassView style={styles.backGlass}>
            <SymbolView name="chevron.left" size={18} tintColor="#FFFFFF" />
          </GlassView>
        ) : (
          <View style={styles.backFallback}>
            <SymbolView name="chevron.left" size={18} tintColor="#FFFFFF" />
          </View>
        )}
      </TouchableOpacity>

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
    backgroundColor: '#000000',
  },
  backWrap: {
    marginTop: 56,
    marginLeft: 24,
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
    backgroundColor: '#191919',
    borderWidth: 0.5,
    borderColor: '#3B3B3B',
  },
  body: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
    justifyContent: 'space-between',
  },
  top: {
    marginTop: 24,
    alignItems: 'center',
  },
  wordmark: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 32,
  },
  heading: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  footer: {
    gap: 10,
    marginBottom: 20,
  },
})