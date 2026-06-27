import type { DropState } from '@/types/database.types';

export const CARD_RADIUS = 16

export const FULL_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const

export const STATE_META: Record<DropState, { label: string; color: string }> = {
  active: { label: 'Collecting', color: '#0044FF' },
  ready: { label: 'Ready', color: '#4CAF7D' },
  open: { label: 'Open', color: '#F59E0B' },
  expired: { label: 'Expired', color: '#626262' },
}
