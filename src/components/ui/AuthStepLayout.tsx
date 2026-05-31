import { AntDesign } from '@expo/vector-icons'
import { router } from 'expo-router'
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewStyle,
  type StyleProp,
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
      <TouchableOpacity style={styles.back} onPress={() => router.back()} hitSlop={12}>
        <AntDesign name="left" size={20} color="#FFFFFF" />
      </TouchableOpacity>

      <View style={styles.body}>
        <View style={[styles.top, topStyle]}>
          <Text style={styles.wordmark}>memoria.</Text>
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
  back: {
    marginTop: 56,
    marginLeft: 24,
    width: 40,
    height: 40,
    justifyContent: 'center',
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
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  footer: {
    gap: 10,
  },
})
