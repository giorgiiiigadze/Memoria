import { useDrops } from '@/hooks/useDrops'
import { useFriendsStore } from '@/store/friends.store'
import { InfoRow } from '@/components/ui/InfoRow'
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

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatDate(d: Date) {
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

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
      router.replace('/(app)/(home)')
    } catch (e) {
      console.error('[confirm] submitDrop:', e)
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content}>

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
        <InfoRow label="Opens" value={draft.openDate ? formatDate(draft.openDate) : 'No date set'} />
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
          ? <ActivityIndicator color="#fff" size="small" />
          : <Text style={s.btnLabel}>Create drop</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={s.back} onPress={() => router.back()} disabled={submitting}>
        <Text style={s.backLabel}>Go back</Text>
      </TouchableOpacity>

    </ScrollView>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000000' },
  content: { paddingHorizontal: 24, paddingTop: 80, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: '600', color: '#FFFFFF', letterSpacing: -0.5, marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#626262', marginBottom: 28 },
  card: {
    backgroundColor: '#191919',
    borderWidth: 0.5,
    borderColor: '#3B3B3B',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
  },
  thumbPreview: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  error: { fontSize: 13, color: '#EA4942', marginBottom: 12 },
  btn: {
    backgroundColor: '#0044FF',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  btnDisabled: { opacity: 0.5 },
  btnLabel: { fontSize: 15, fontWeight: '500', color: '#FFFFFF' },
  back: { alignItems: 'center', paddingVertical: 10 },
  backLabel: { fontSize: 14, color: '#626262' },
})
