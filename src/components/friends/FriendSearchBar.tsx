import { SearchIcon } from '@/components/icons/SearchIcon'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { colors, fontSize, glass } from '@/theme'
import { SymbolView } from 'expo-symbols'
import { StyleSheet, TextInput, TouchableOpacity } from 'react-native'

interface FriendSearchBarProps {
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
}

export function FriendSearchBar({
  value,
  onChangeText,
  placeholder = 'Search friends',
}: FriendSearchBarProps) {
  const content = (
    <>
      <SearchIcon size={18} color={colors.textTertiary} />
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
          <GlassSurface
            style={s.clearBtn}
            fallbackStyle={s.clearBtnFallback}
            colorScheme="dark"
            tintColor={glass.tint.control}
            isInteractive
            withContainer={false}
          >
            <SymbolView name="xmark" size={10} tintColor={colors.textSecondary} weight="semibold" />
          </GlassSurface>
        </TouchableOpacity>
      )}
    </>
  )

  return (
    <GlassSurface style={s.wrap} fallbackStyle={s.fallback} colorScheme="dark" tintColor={glass.tint.panel}>
      {content}
    </GlassSurface>
  )
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
    backgroundColor: glass.fallback.panel,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: glass.fallback.panelBorder,
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
    backgroundColor: glass.fallback.control,
  },
})
