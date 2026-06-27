import { selectProfile, useAuthStore } from '@/store/auth.store'
import { spacing } from '@/theme'
import SegmentedControl from '@expo/ui/community/segmented-control'
import { StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export const CALENDAR_TABS = ['All Drops', 'My Drops'] as const
export type CalendarTab = typeof CALENDAR_TABS[number]

interface Props {
  activeTab: CalendarTab
  onTabChange: (tab: CalendarTab) => void
}

export default function CalendarHeader({ activeTab, onTabChange }: Props) {
  const insets = useSafeAreaInsets()
  const profile = useAuthStore(selectProfile)

  const firstName = profile?.display_name?.split(' ')[0] ?? profile?.username ?? 'My'
  const displayLabels = ['All Drops', `${firstName}'s Drops`]

  return (
    <View style={[s.container, { paddingTop: insets.top, height: insets.top + 44 }]}>
      <View style={s.segmentedWrap}>
        <SegmentedControl
          values={displayLabels}
          selectedIndex={CALENDAR_TABS.indexOf(activeTab)}
          onChange={e => onTabChange(CALENDAR_TABS[e.nativeEvent.selectedSegmentIndex])}
          appearance="dark"
        />
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: spacing[5],
    justifyContent: 'center',
    zIndex: 10,
  },
  segmentedWrap: {
    alignSelf: 'flex-start',
    minWidth: 220,
  },
})
