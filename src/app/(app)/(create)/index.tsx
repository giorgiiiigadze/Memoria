import { useDropsStore } from '@/store/drops.store'
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
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function formatDate(d: Date) {
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

function buildCalendarDays(year: number, month: number) {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const startPad = (first.getDay() + 6) % 7 // Mon=0
  const days: (number | null)[] = Array(startPad).fill(null)
  for (let d = 1; d <= last.getDate(); d++) days.push(d)
  while (days.length % 7 !== 0) days.push(null)
  return days
}

export default function CreateScreen() {
  const { draft, setDraftTitle, setDraftOpenDate } = useDropsStore()

  const [showCalendar, setShowCalendar] = useState(false)
  const [calYear, setCalYear] = useState(() => new Date().getFullYear())
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth())

  const today = startOfDay(new Date())
  const calDays = buildCalendarDays(calYear, calMonth)

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

  const canNext = draft.title.trim().length > 0 && draft.openDate !== null

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">

      <Text style={s.title}>New drop</Text>
      <Text style={s.subtitle}>Name it and set when it opens.</Text>

      {/* ── Title ───────────────────────────────── */}
      <View style={s.section}>
        <Text style={s.label}>Title</Text>
        <TextInput
          style={s.input}
          placeholder="What's the occasion?"
          placeholderTextColor="#626262"
          value={draft.title}
          onChangeText={setDraftTitle}
          maxLength={80}
          returnKeyType="done"
        />
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
            style={[s.preset, draft.openDate && !PRESETS.some(p => isPresetActive(p.days)) && s.presetActive]}
            onPress={() => setShowCalendar(true)}
            activeOpacity={0.7}
          >
            <Text style={[
              s.presetLabel,
              draft.openDate && !PRESETS.some(p => isPresetActive(p.days)) && s.presetLabelActive,
            ]}>
              Custom
            </Text>
          </TouchableOpacity>
        </View>

        {draft.openDate && (
          <Text style={s.datePreview}>Opens {formatDate(draft.openDate)}</Text>
        )}
      </View>

      {/* ── Next ────────────────────────────────── */}
      <TouchableOpacity
        style={[s.btn, !canNext && s.btnDisabled]}
        onPress={() => router.push('/(app)/(create)/invite')}
        disabled={!canNext}
        activeOpacity={0.8}
      >
        <Text style={s.btnLabel}>Next</Text>
      </TouchableOpacity>

      {/* ── Calendar modal ──────────────────────── */}
      <Modal visible={showCalendar} transparent animationType="fade" onRequestClose={() => setShowCalendar(false)}>
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

    </ScrollView>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#121212' },
  content: { paddingHorizontal: 24, paddingTop: 80, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: '600', color: '#FFFFFF', letterSpacing: -0.5, marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#626262', marginBottom: 36 },
  section: { marginBottom: 28 },
  label: { fontSize: 12, fontWeight: '500', color: '#626262', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  input: {
    backgroundColor: '#191919',
    borderWidth: 0.5,
    borderColor: '#3B3B3B',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#FFFFFF',
  },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  preset: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: '#3B3B3B',
  },
  presetActive: { backgroundColor: '#0044FF', borderColor: '#0044FF' },
  presetLabel: { fontSize: 14, color: '#898989' },
  presetLabelActive: { color: '#FFFFFF', fontWeight: '500' },
  datePreview: { fontSize: 13, color: '#4CAF7D', marginTop: 12 },
  btn: {
    backgroundColor: '#0044FF',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  btnDisabled: { opacity: 0.4 },
  btnLabel: { fontSize: 15, fontWeight: '500', color: '#FFFFFF' },
  // Calendar
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  calendar: { backgroundColor: '#1C1C1C', borderRadius: 16, padding: 20, width: 320 },
  calHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  calNav: { padding: 8 },
  calNavText: { fontSize: 24, color: '#FFFFFF', lineHeight: 26 },
  calMonth: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calDayName: { width: `${100 / 7}%`, textAlign: 'center', fontSize: 11, color: '#626262', fontWeight: '500', paddingBottom: 8 },
  calCell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 100 },
  calCellSelected: { backgroundColor: '#0044FF' },
  calDayNum: { fontSize: 14, color: '#FFFFFF' },
  calDayPast: { color: '#3B3B3B' },
  calDaySelected: { color: '#FFFFFF', fontWeight: '600' },
})
