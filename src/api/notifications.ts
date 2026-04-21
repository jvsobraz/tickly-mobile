import { api } from './client';

export interface AppNotification {
  id: number; title: string; message: string; type: string;
  isRead: boolean; actionUrl?: string; createdAt: string;
}

export const notificationsApi = {
  getAll: () => api.get<AppNotification[]>('/AppNotifications').then(r => r.data),
  getUnreadCount: () => api.get<{ count: number }>('/AppNotifications/unread-count').then(r => r.data),
  markRead: (id: number) => api.post(`/AppNotifications/${id}/read`, {}).then(r => r.data),
  markAllRead: () => api.post('/AppNotifications/read-all', {}).then(r => r.data),
};
