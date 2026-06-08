import { colors, fontWeight, radii, spacing } from '@/theme'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

const { width: SW, height: SH } = Dimensions.get('window')
const BLOB_SIZE = SW * 1.3

export default function SuccessScreen() {
  return (
    <View style={s.root}>
      {/* Blob — top 70% */}
      <View style={s.blobWrap}>
        <LinearGradient
          colors={['#0D2B1A', '#0A1F12', '#060F09']}
          start={{ x: 0.3, y: 0 }}
          end={{ x: 0.7, y: 1 }}
          style={s.blob}
        />
        <LinearGradient
          colors={['transparent', colors.background]}
          style={s.blobFade}
          pointerEvents="none"
        />
      </View>

      {/* Content */}
      <View style={s.content}>
        <Text style={s.preText}>congrats you are</Text>
        <Text style={s.inText}>in</Text>

        <TouchableOpacity
          style={s.btn}
          onPress={() => router.replace('/(auth)/onboarding/username')}
          activeOpacity={0.88}
        >
          <Text style={s.btnLabel}>let's set up your profile →</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  blobWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SH * 0.7,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  blob: {
    width: BLOB_SIZE,
    height: BLOB_SIZE,
    borderRadius: BLOB_SIZE / 2,
    marginBottom: -(BLOB_SIZE * 0.1),
  },
  blobFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 140,
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[12],
    paddingTop: spacing[4],
  },
  preText: {
    fontSize: 18,
    color: colors.textMuted,
    fontWeight: fontWeight.regular,
    marginBottom: 4,
  },
  inText: {
    fontSize: 120,
    lineHeight: 120,
    color: colors.success,
    fontWeight: fontWeight.bold,
    letterSpacing: -6,
    marginBottom: spacing[8],
  },
  btn: {
    borderRadius: radii.full,
    paddingVertical: 17,
    paddingHorizontal: spacing[6],
    borderWidth: 1,
    borderColor: colors.borderDefault,
    alignItems: 'center',
  },
  btnLabel: {
    fontSize: 15,
    fontWeight: fontWeight.medium,
    color: colors.textPrimary,
  },
})
