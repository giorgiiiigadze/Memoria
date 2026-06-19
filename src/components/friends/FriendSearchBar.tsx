import { colors, fontSize } from '@/theme'
import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect'
import { SymbolView } from 'expo-symbols'
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native'

interface FriendSearchBarProps {
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
}

const glassAvailable = isGlassEffectAPIAvailable()

export function FriendSearchBar({
  value,
  onChangeText,
  placeholder = 'Search friends',
}: FriendSearchBarProps) {
  const content = (
    <>
      <SymbolView name="magnifyingglass" size={20} tintColor={colors.textTertiary} />
      <TextInput
        style={s.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        selectionColor={colors.white}
        cursorColor={colors.white}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText('')} hitSlop={10} activeOpacity={0.8}>
          {glassAvailable ? (
            <GlassView
              style={s.clearBtn}
              glassEffectStyle="regular"
              colorScheme="dark"
              tintColor="rgba(0,0,0,0.25)"
              isInteractive
            >
              <SymbolView name="xmark" size={10} tintColor={colors.textSecondary} weight="semibold" />
            </GlassView>
          ) : (
            <View style={[s.clearBtn, s.clearBtnFallback]}>
              <SymbolView name="xmark" size={10} tintColor={colors.textSecondary} weight="semibold" />
            </View>
          )}
        </TouchableOpacity>
      )}
    </>
  )

  if (glassAvailable) {
    return (
      <GlassView
        style={s.wrap}
        glassEffectStyle="regular"
        colorScheme="dark"
        tintColor="rgba(0,0,0,0.18)"
      >
        {content}
      </GlassView>
    )
  }

  return <View style={[s.wrap, s.fallback]}>{content}</View>
}

const s = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 44,
    borderRadius: 999,
    paddingLeft: 14,
    paddingRight: 12,
  },
  fallback: {
    backgroundColor: colors.surfaceInput,
    borderWidth: 0.5,
    borderColor: colors.borderDefault,
  },
  input: {
    flex: 1,
    color: colors.white,
    fontSize: fontSize.sm,
    padding: 0,
  },
  clearBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnFallback: {
    backgroundColor: colors.surfaceRaised,
  },
})