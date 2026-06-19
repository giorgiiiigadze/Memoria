import type { NotificationWithMeta } from '@/api/notifications.api'

export const HEADER_HEIGHT = 44

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

export function notifText(n: NotificationWithMeta): string {
  const actor =
    n.actor?.display_name ?? (n.actor?.username ? `@${n.actor.username}` : 'Someone')
  const drop = n.drop?.title ? `"${n.drop.title}"` : 'a drop'
  switch (n.type) {
    case 'drop_invited':
      return `${actor} invited you to ${drop}`
    case 'drop_opened':
      return `${drop} is now open — see the photos`
    case 'drop_ready':
      return `${drop} is ready to open`
    case 'friend_request':
      return `${actor} sent you a friend request`
    case 'friend_accepted':
      return `${actor} accepted your friend request`
    case 'participant_uploaded':
      return `${actor} uploaded photos to ${drop}`
    case 'drop_opening_soon':
      return `${drop} opens soon`
    case 'drop_expired':
      return `${drop} has expired`
    default:
      return 'New notification'
  }
}
