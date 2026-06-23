import { InitialAvatar } from '@/components/ui/InitialAvatar'
import { useDropsStore } from '@/store/drops.store'
import { useFriendsStore } from '@/store/friends.store'
import { colors, fontSize, fontWeight, spacing } from '@/theme'
import {
  DatePicker,
  Form,
  Host,
  Section,
  Text,
  TextField,
  useNativeState,
} from '@expo/ui/swift-ui'
import {
  environment,
  foregroundStyle,
  listRowBackground,
  listRowSeparator,
  listSectionSpacing,
  scrollContentBackground,
  scrollDismissesKeyboard,
  tint,
} from '@expo/ui/swift-ui/modifiers'
import * as ImagePicker from 'expo-image-picker'
import { router, Stack } from 'expo-router'
import { SymbolView } from 'expo-symbols'
import { useEffect, useState } from 'react'
import { Alert, Text as RNText, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native'

function addDays(d: Date, n: number) {
  const r = new Date(d); r.setDate(r.getDate() + n); return r
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

const ROW = [listRowBackground(colors.surfaceGroupedElevated), foregroundStyle(colors.white)] as const

export default function CreateScreen() {
  const { draft, setDraftTitle, setDraftOpenDate, setDraftInvitedIds, setDraftThumbnailUri } = useDropsStore()
  const friends = useFriendsStore(s => s.friends)
  const title = useNativeState(draft.title)

  const today = startOfDay(new Date())
  const canNext = draft.title.trim().length > 0 && draft.openDate !== null
  const [opening, setOpening] = useState(false)

  async function handleNext() {
    if (__DEV__) {
      router.push('/create/confirm' as any)
      return
    }
    if (opening) return
    setOpening(true)
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync()
      if (!perm.granted) {
        Alert.alert('Camera access needed', 'Enable camera access in Settings to add a cover photo.')
        return
      }
      const result = await ImagePicker.launchCameraAsync({ quality: 0.8 })
      if (result.canceled) return
      setDraftThumbnailUri(result.assets[0].uri)
      router.push('/create/confirm' as any)
    } finally {
      setOpening(false)
    }
  }

  useEffect(() => {
    if (!draft.openDate) setDraftOpenDate(addDays(today, 1))
  }, [])

  function toggleInvite(id: string) {
    const next = draft.invitedIds.includes(id)
      ? draft.invitedIds.filter(i => i !== id)
      : [...draft.invitedIds, id]
    setDraftInvitedIds(next)
  }

  return (
    <>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          accessibilityLabel="Next"
          disabled={!canNext || opening}
          tintColor={colors.blue}
          onPress={handleNext}
        >
          <Stack.Toolbar.Icon sf="checkmark" />
        </Stack.Toolbar.Button>
      </Stack.Toolbar>

      <View style={s.root}>
        {/* SwiftUI form — title + date only */}
        <Host style={s.formHost}>
          <Form
            modifiers={[
              listSectionSpacing('compact'),
              scrollDismissesKeyboard('interactively'),
              scrollContentBackground('hidden'),
            ]}
          >
            <Section>
              <TextField
                autoFocus
                text={title}
                onTextChange={setDraftTitle}
                modifiers={[listRowSeparator('hidden'), tint('white'), ...ROW]}
              >
                <TextField.Placeholder>
                  <Text modifiers={[foregroundStyle(colors.textPlaceholder)]}>Name this drop</Text>
                </TextField.Placeholder>
              </TextField>
            </Section>

            <DatePicker
              title="Opens"
              displayedComponents={['date']}
              selection={draft.openDate ?? addDays(today, 1)}
              onDateChange={setDraftOpenDate}
              range={{ start: today }}
              modifiers={[tint('white'), environment('colorScheme', 'dark'), ...ROW]}
            />
          </Form>
        </Host>

        <View style={s.friendsSection}>
          <RNText style={s.sectionHeader}>Invite friends</RNText>

          <ScrollView
            style={s.friendsList}
            contentContainerStyle={s.friendsContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {friends.length === 0 ? (
              <RNText style={s.empty}>Add friends to invite them to drops.</RNText>
            ) : friends.map(friend => {
              const selected = draft.invitedIds.includes(friend.id)
              const name = friend.display_name ?? friend.username ?? '?'
              return (
                <TouchableOpacity
                  key={friend.id}
                  style={[s.friendRow, selected && s.friendRowSelected]}
                  onPress={() => toggleInvite(friend.id)}
                  activeOpacity={0.7}
                >
                  <InitialAvatar name={name} avatarUrl={friend.avatar_url} size={40} />
                  <View style={s.friendInfo}>
                    <RNText style={s.friendName}>{name}</RNText>
                    {friend.username && (
                      <RNText style={s.friendHandle}>@{friend.username}</RNText>
                    )}
                  </View>
                  {selected && (
                    <SymbolView
                      name="checkmark.circle.fill"
                      size={22}
                      tintColor={colors.blue}
                    />
                  )}
                </TouchableOpacity>
              )
            })}
          </ScrollView>
        </View>
      </View>
    </>
  )
}

const s = StyleSheet.create({
  root: {
    flex: 1,
  },
  formHost: {
    height: 180,
  },
  friendsSection: {
    flex: 1,
    paddingTop: spacing[5],
    paddingHorizontal: spacing[5],
  },
  sectionHeader: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semiBold,
    color: colors.white,
    marginBottom: spacing[4],
  },
  friendsList: {
    flex: 1,
  },
  friendsContent: {
    paddingBottom: spacing[10],
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[2],
  },
  friendRowSelected: {
    opacity: 1,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 15,
    fontWeight: fontWeight.medium,
    color: colors.white,
  },
  friendHandle: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: 1,
  },
  empty: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    textAlign: 'center',
    paddingTop: spacing[6],
  },
})
