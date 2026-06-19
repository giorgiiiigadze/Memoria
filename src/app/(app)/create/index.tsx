import { useDropsStore } from '@/store/drops.store'
import { useFriendsStore } from '@/store/friends.store'
import { colors } from '@/theme'
import {
  Button,
  DatePicker,
  Form,
  Host,
  HStack,
  Section,
  Spacer,
  Text,
  TextField,
  useNativeState,
} from '@expo/ui/swift-ui'
import {
  foregroundStyle,
  listRowBackground,
  listRowSeparator,
  listSectionSpacing,
  scrollContentBackground,
  scrollDismissesKeyboard,
  tint,
} from '@expo/ui/swift-ui/modifiers'
import { router, Stack } from 'expo-router'
import { useEffect, useState } from 'react'

function addDays(d: Date, n: number) {
  const r = new Date(d); r.setDate(r.getDate() + n); return r
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

const ROW = [listRowBackground(colors.surfaceGroupedElevated), foregroundStyle(colors.white)] as const

export default function CreateScreen() {
  const { draft, setDraftTitle, setDraftOpenDate, setDraftInvitedIds } = useDropsStore()
  const friends = useFriendsStore(s => s.friends)
  const title = useNativeState(draft.title)
  const searchText = useNativeState('')

  const [query, setQuery] = useState('')

  const today = startOfDay(new Date())
  const canNext = draft.title.trim().length > 0 && draft.openDate !== null

  // Seed default open date so the check button enables as soon as a title is typed
  useEffect(() => {
    if (!draft.openDate) setDraftOpenDate(addDays(today, 1))
  }, [])

  const visible = query.trim()
    ? friends.filter(f =>
        f.username?.toLowerCase().includes(query.toLowerCase()) ||
        f.display_name?.toLowerCase().includes(query.toLowerCase())
      )
    : friends

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
          disabled={!canNext}
          tintColor={colors.blue}
          onPress={() => router.push('/create/confirm' as any)}
        >
          <Stack.Toolbar.Icon sf="checkmark" />
        </Stack.Toolbar.Button>
      </Stack.Toolbar>

      <Host style={{ flex: 1 }}>
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
            modifiers={[...ROW]}
          />

          <Section header={<Text modifiers={[foregroundStyle(colors.white)]}>Invite friends</Text>}>
            <TextField
              text={searchText}
              onTextChange={setQuery}
              modifiers={[listRowSeparator('hidden'), tint('white'), ...ROW]}
            >
              <TextField.Placeholder>
                <Text modifiers={[foregroundStyle(colors.textPlaceholder)]}>Search friends</Text>
              </TextField.Placeholder>
            </TextField>
            {visible.map(friend => {
              const selected = draft.invitedIds.includes(friend.id)
              return (
                <Button
                  key={friend.id}
                  onPress={() => toggleInvite(friend.id)}
                  modifiers={[...ROW]}
                >
                  <HStack>
                    <Text>{friend.display_name ?? friend.username ?? ''}</Text>
                    <Spacer />
                    {selected && (
                      <Text modifiers={[foregroundStyle(colors.blue)]}>✓</Text>
                    )}
                  </HStack>
                </Button>
              )
            })}
          </Section>
        </Form>
      </Host>
    </>
  )
}
