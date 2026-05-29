import type { NotificationWithMeta } from '@/api/notifications.api'
import { create } from 'zustand'

interface NotificationsState {
  notifications: NotificationWithMeta[]
  isLoaded: boolean
  setNotifications: (n: NotificationWithMeta[]) => void
  markOneRead: (id: string) => void
  markAllRead: () => void
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  notifications: [],
  isLoaded: false,
  setNotifications: (notifications) => set({ notifications, isLoaded: true }),
  markOneRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    })),
  markAllRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
    })),
}))

export const selectUnreadCount = (s: NotificationsState) =>
  s.notifications.filter((n) => !n.read).length
