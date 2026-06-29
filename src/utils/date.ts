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

function duration(seconds: number): string {
  if (seconds < 3600)    { const m = Math.floor(seconds / 60);    return m <= 1 ? 'a minute' : `${m} minutes` }
  if (seconds < 86400)   { const h = Math.floor(seconds / 3600);  return h === 1 ? '1 hour' : `${h} hours` }
  if (seconds < 604800)  { const d = Math.floor(seconds / 86400); return d === 1 ? '1 day' : `${d} days` }
  if (seconds < 2592000) { const w = Math.floor(seconds / 604800);return w === 1 ? '1 week' : `${w} weeks` }
  if (seconds < 31536000){ const mo = Math.floor(seconds / 2592000); return mo === 1 ? '1 month' : `${mo} months` }
  const y = Math.floor(seconds / 31536000); return y === 1 ? '1 year' : `${y} years`
}

export function dropTimeLabel(state: 'active' | 'ready' | 'open' | 'expired', iso: string | null): string {
  if (!iso) return ''
  const now = Date.now()
  const target = new Date(iso).getTime()
  if (state === 'open' || state === 'expired') {
    const s = Math.floor((now - target) / 1000)
    return s < 60 ? 'just opened' : `opened for ${duration(s)}`
  } else {
    const s = Math.floor((target - now) / 1000)
    if (s <= 0) return 'opens today'
    return `opens in ${duration(s)}`
  }
}

export function friendDuration(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  return s < 60 ? 'just now' : duration(s)
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
