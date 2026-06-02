import type { DropState } from '@/types/database.types'

export const STATE_META: Record<DropState, { label: string; color: string }> = {
  active: { label: 'Active', color: '#0044FF' },
  ready: { label: 'Ready', color: '#4CAF7D' },
  open: { label: 'Open', color: '#F59E0B' },
  expired: { label: 'Expired', color: '#626262' },
}
