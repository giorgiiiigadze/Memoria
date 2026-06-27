const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return ''
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60)   return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  const d = new Date(iso)
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`
}

export function formatDate(value: Date | string | null | undefined): string | null {
  if (!value) return null
  const d = value instanceof Date ? value : new Date(value)
  if (isNaN(d.getTime())) return null
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

export function fmtDropDate(state: 'active' | 'ready' | 'open' | 'expired', iso: string | null): string {
  if (!iso) return ''
  const now = Date.now()
  const target = new Date(iso).getTime()
  const d = new Date(iso)
  const dateStr = `${MONTHS[d.getMonth()]} ${d.getDate()}`
  const isOpen = state === 'open' || state === 'expired'

  if (isOpen) {
    const pastDays = Math.floor((now - target) / 86400000)
    if (pastDays === 0) return 'today'
    if (pastDays === 1) return 'yesterday'
    if (pastDays < 7)  return `${pastDays}d ago`
    return dateStr
  } else {
    const futureDays = Math.floor((target - now) / 86400000)
    if (futureDays <= 0) return 'today'
    if (futureDays === 1) return 'tomorrow'
    if (futureDays < 7)  return `in ${futureDays}d`
    return dateStr
  }
}
