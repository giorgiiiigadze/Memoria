import { CreateFlowHeader } from '@/components/ui/CreateFlowHeader'
import { InfoRow } from '@/components/ui/InfoRow'
import { useDrops } from '@/hooks/useDrops'
import { useFriendsStore } from '@/store/friends.store'
import { colors, fontSize, fontWeight, radii, spacing } from '@/theme'
import { formatDate } from '@/utils/date'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { useState } from 'react'
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

export default function ConfirmScreen() {
  const { draft, submitDrop } = useDrops()
  const friends = useFriendsStore(s => s.friends)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const invitedFriends = friends.filter(f => draft.invitedIds.includes(f.id))

  async function handleCreate() {
    setSubmitting(true)
    setError(null)
    try {
      await submitDrop()
      router.replace('/(app)/(home)' as any)
    } catch (e) {
      console.error('[confirm] submitDrop:', e)
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View style={s.root}>
      <CreateFlowHeader variant="back" />
      <ScrollView style={s.scroll} contentContainerStyle={s.content}>

        <Text style={s.title}>Looks good?</Text>
        <Text style={s.subtitle}>Review your drop before creating it.</Text>

        <View style={s.card}>
          {draft.thumbnailUri && (
            <Image
              source={{ uri: draft.thumbnailUri }}
              style={s.thumbPreview}
              contentFit="cover"
            />
          )}
          <InfoRow label="Title" value={draft.title} />
          <InfoRow label="Opens" value={formatDate(draft.openDate) ?? 'No date set'} />
          <InfoRow
            label="Invited"
            value={
              invitedFriends.length === 0
                ? 'Just you'
                : invitedFriends.map(f => f.display_name ?? f.username).join(', ')
            }
          />
        </View>

        {error && <Text style={s.error}>{error}</Text>}

        <TouchableOpacity
          style={[s.btn, submitting && s.btnDisabled]}
          onPress={handleCreate}
          disabled={submitting}
          activeOpacity={0.8}
        >
          {submitting
            ? <ActivityIndicator color={colors.white} size="small" />
            : <Text style={s.btnLabel}>Create drop</Text>}
        </TouchableOpacity>

      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
    paddingBottom: spacing[10],
  },
  title: {
    fontSize: 26,
    fontWeight: fontWeight.semiBold,
    color: colors.white,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: { fontSize: fontSize.sm, color: colors.textTertiary, marginBottom: 28 },
  card: {
    backgroundColor: colors.surfaceInput,
    borderWidth: 0.5,
    borderColor: colors.borderDefault,
    borderRadius: radii.md,
    overflow: 'hidden',
    marginBottom: spacing[6],
  },
  thumbPreview: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  error: { fontSize: fontSize.xs, color: colors.error, marginBottom: spacing[3] },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: radii.sm,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  btnLabel: { fontSize: 15, fontWeight: fontWeight.medium, color: colors.white },
})
