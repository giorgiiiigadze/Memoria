import { colors, fontWeight, spacing } from '@/theme'
import { StyleSheet, TextInput, type TextInputProps } from 'react-native'

export function BigInput(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor="#474749"
      {...props}
      style={[styles.input, props.style]}
    />
  )
}

const styles = StyleSheet.create({
  input: {
    fontSize: 38,
    fontWeight: fontWeight.strong,
    color: colors.white,
    textAlign: 'center',
    width: '100%',
    paddingVertical: spacing[1],
  },
})
