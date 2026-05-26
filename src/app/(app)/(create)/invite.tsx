import { StyleSheet, Text, View } from 'react-native';

export default function Invite() {
  return (
    <View style={s.root}>
      <Text style={s.text}>Invite</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#121212', alignItems: 'center', justifyContent: 'center' },
  text: { color: '#FFFFFF', fontSize: 18 },
});
