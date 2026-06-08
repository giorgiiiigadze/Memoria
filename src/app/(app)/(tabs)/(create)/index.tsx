import { CreateFlowHeader } from '@/components/ui/CreateFlowHeader'
import { useDropsStore } from '@/store/drops.store'
import { colors, fontSize, fontWeight, radii, spacing } from '@/theme'
import { formatDate } from '@/utils/date'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import { router } from 'expo-router'
import { useState } from 'react'
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

const PRESETS = [
  { label: 'Tomorrow', days: 1 },
  { label: '3 days', days: 3 },
  { label: '1 week', days: 7 },
  { label: '1 month', days: 30 },
]

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function addDays(d: Date, n: number) {
  const r = new Date(d); r.setDate(r.getDate() + n); return r
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function buildCalendarDays(year: number, month: number) {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const startPad = (first.getDay() + 6) % 7
  const days: (number | null)[] = Array(startPad).fill(null)
  for (let d = 1; d <= last.getDate(); d++) days.push(d)
  while (days.length % 7 !== 0) days.push(null)
  return days
}

export default function CreateScreen() {
  const { draft, setDraftTitle, setDraftOpenDate, setDraftThumbnailUri } = useDropsStore()

  const [showCalendar, setShowCalendar] = useState(false)
  const [calYear, setCalYear] = useState(() => new Date().getFullYear())
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth())

  const today = startOfDay(new Date())
  const calDays = buildCalendarDays(calYear, calMonth)

  async function pickThumbnail() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
    })
    if (!result.canceled) setDraftThumbnailUri(result.assets[0].uri)
  }

  function selectPreset(days: number) {
    setDraftOpenDate(addDays(today, days))
  }

  function isPresetActive(days: number) {
    if (!draft.openDate) return false
    return isSameDay(draft.openDate, addDays(today, days))
  }

  function prevMonth() {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11) }
    else setCalMonth(m => m - 1)
  }

  function nextMonth() {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0) }
    else setCalMonth(m => m + 1)
  }

  function selectDay(day: number) {
    const picked = startOfDay(new Date(calYear, calMonth, day))
    if (picked < today) return
    setDraftOpenDate(picked)
    setShowCalendar(false)
  }

  const isCustomActive = !!draft.openDate && !PRESETS.some(p => isPresetActive(p.days))
  const canNext = draft.title.trim().length > 0 && draft.openDate !== null

  return (
    <View style={s.root}>
      <CreateFlowHeader variant="close" />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.title}>New drop</Text>
        <Text style={s.subtitle}>Name it and set when it opens.</Text>

        {/* ── Title ───────────────────────────────── */}
        <View style={s.section}>
          <Text style={s.label}>Title</Text>
          <TextInput
            style={s.input}
            placeholder="What's the occasion?"
            placeholderTextColor={colors.textTertiary}
            value={draft.title}
            onChangeText={setDraftTitle}
            maxLength={80}
            returnKeyType="done"
          />
        </View>

        {/* ── Cover photo ─────────────────────────── */}
        <View style={s.section}>
          <Text style={s.label}>
            Cover photo{' '}
            <Text style={s.labelOptional}>(optional)</Text>
          </Text>
          <TouchableOpacity style={s.thumbPicker} onPress={pickThumbnail} activeOpacity={0.8}>
            {draft.thumbnailUri ? (
              <>
                <Image
                  source={{ uri: draft.thumbnailUri }}
                  style={s.thumbPreview}
                  contentFit="cover"
                />
                <TouchableOpacity
                  style={s.thumbRemove}
                  onPress={() => setDraftThumbnailUri(null)}
                  hitSlop={8}
                >
                  <Text style={s.thumbRemoveLabel}>✕</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={s.thumbPlaceholder}>
                <Text style={s.thumbIcon}>📷</Text>
                <Text style={s.thumbPlaceholderLabel}>Add cover photo</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Open date ───────────────────────────── */}
        <View style={s.section}>
          <Text style={s.label}>Opens in</Text>
          <View style={s.presets}>
            {PRESETS.map(p => (
              <TouchableOpacity
                key={p.days}
                style={[s.preset, isPresetActive(p.days) && s.presetActive]}
                onPress={() => selectPreset(p.days)}
                activeOpacity={0.7}
              >
                <Text style={[s.presetLabel, isPresetActive(p.days) && s.presetLabelActive]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[s.preset, isCustomActive && s.presetActive]}
              onPress={() => setShowCalendar(true)}
              activeOpacity={0.7}
            >
              <Text style={[s.presetLabel, isCustomActive && s.presetLabelActive]}>
                Custom
              </Text>
            </TouchableOpacity>
          </View>
          {draft.openDate && (
            <Text style={s.datePreview}>Opens {formatDate(draft.openDate) ?? ''}</Text>
          )}
        </View>

        {/* ── Next ────────────────────────────────── */}
        <TouchableOpacity
          style={[s.btn, !canNext && s.btnDisabled]}
          onPress={() => router.push('/(app)/(create)/invite' as any)}
          disabled={!canNext}
          activeOpacity={0.8}
        >
          <Text style={s.btnLabel}>Next</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Calendar modal ──────────────────────── */}
      <Modal
        visible={showCalendar}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCalendar(false)}
      >
        <Pressable style={s.overlay} onPress={() => setShowCalendar(false)}>
          <Pressable style={s.calendar} onPress={() => {}}>

            <View style={s.calHeader}>
              <TouchableOpacity onPress={prevMonth} style={s.calNav}>
                <Text style={s.calNavText}>‹</Text>
              </TouchableOpacity>
              <Text style={s.calMonth}>{MONTHS[calMonth]} {calYear}</Text>
              <TouchableOpacity onPress={nextMonth} style={s.calNav}>
                <Text style={s.calNavText}>›</Text>
              </TouchableOpacity>
            </View>

            <View style={s.calGrid}>
              {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => (
                <Text key={d} style={s.calDayName}>{d}</Text>
              ))}
              {calDays.map((day, i) => {
                if (!day) return <View key={`pad-${i}`} style={s.calCell} />
                const date = startOfDay(new Date(calYear, calMonth, day))
                const past = date < today
                const selected = draft.openDate ? isSameDay(date, draft.openDate) : false
                return (
                  <TouchableOpacity
                    key={`${calYear}-${calMonth}-${day}`}
                    style={[s.calCell, selected && s.calCellSelected]}
                    onPress={() => !past && selectDay(day)}
                    activeOpacity={past ? 1 : 0.7}
                    disabled={past}
                  >
                    <Text style={[s.calDayNum, past && s.calDayPast, selected && s.calDaySelected]}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>

          </Pressable>
        </Pressable>
      </Modal>

    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 10,
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
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    marginBottom: 36,
  },

  section: { marginBottom: 28 },
  label: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  labelOptional: {
    fontWeight: fontWeight.regular,
    color: colors.borderDefault,
    textTransform: 'none',
    letterSpacing: 0,
  },

  // ── Input
  input: {
    backgroundColor: colors.surfaceInput,
    borderWidth: 0.5,
    borderColor: colors.borderDefault,
    borderRadius: radii.sm,
    paddingHorizontal: 14,
    paddingVertical: spacing[3],
    fontSize: 15,
    color: colors.white,
  },

  // ── Presets
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  preset: {
    paddingHorizontal: 14,
    paddingVertical: spacing[2],
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: colors.borderDefault,
  },
  presetActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  presetLabel: { fontSize: fontSize.sm, color: colors.textMuted },
  presetLabelActive: { color: colors.white, fontWeight: fontWeight.medium },
  datePreview: { fontSize: 13, color: colors.success, marginTop: spacing[3] },

  // ── Thumbnail
  thumbPicker: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.surfaceInput,
    borderWidth: 0.5,
    borderColor: colors.borderDefault,
  },
  thumbPreview: { width: '100%', height: '100%' },
  thumbRemove: {
    position: 'absolute',
    top: spacing[2],
    right: spacing[2],
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbRemoveLabel: { fontSize: 13, color: colors.white, fontWeight: fontWeight.semiBold },
  thumbPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[2] },
  thumbIcon: { fontSize: 28 },
  thumbPlaceholderLabel: { fontSize: 13, color: colors.textTertiary },

  // ── CTA
  btn: {
    backgroundColor: colors.primary,
    borderRadius: radii.sm,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing[3],
  },
  btnDisabled: { opacity: 0.4 },
  btnLabel: { fontSize: 15, fontWeight: fontWeight.medium, color: colors.white },

  // ── Calendar modal
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendar: {
    backgroundColor: '#1C1C1C',
    borderRadius: radii.lg,
    padding: spacing[5],
    width: 320,
  },
  calHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[4],
  },
  calNav: { padding: spacing[2] },
  calNavText: { fontSize: 24, color: colors.white, lineHeight: 26 },
  calMonth: { fontSize: fontSize.md, fontWeight: fontWeight.semiBold, color: colors.white },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calDayName: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontSize: 11,
    color: colors.textTertiary,
    fontWeight: fontWeight.medium,
    paddingBottom: spacing[2],
  },
  calCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.full,
  },
  calCellSelected: { backgroundColor: colors.primary },
  calDayNum: { fontSize: fontSize.sm, color: colors.white },
  calDayPast: { color: colors.borderDefault },
  calDaySelected: { color: colors.white, fontWeight: fontWeight.semiBold },
})