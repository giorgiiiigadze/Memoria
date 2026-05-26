import { StyleSheet, Text, View } from 'react-native';

export default function Profile() {
  return (
    <View style={s.root}>
      <Text style={s.text}>Profile</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#121212', alignItems: 'center', justifyContent: 'center' },
  text: { color: '#FFFFFF', fontSize: 18 },
});
