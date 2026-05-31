import { StyleSheet, TextInput, type TextInputProps } from 'react-native'

export function BigInput(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor="#444444"
      {...props}
      style={[styles.input, props.style]}
    />
  )
}

const styles = StyleSheet.create({
  input: {
    fontSize: 42,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    width: '100%',
    paddingVertical: 4,
  },
})
