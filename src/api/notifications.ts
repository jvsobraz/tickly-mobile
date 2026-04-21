import { api } from './client';

export interface AppNotification {
  id: number; title: string; message: string; type: string;
  isRead: boolean; actionUrl?: string; createdAt: string;
}

export const notificationsApi = {
  getAll: () => api.get<AppNotification[]>('/notifications').then(r => r.data),
  getUnreadCount: () => api.get<{ count: number }>('/notifications/unread-count').then(r => r.data),
  markRead: (id: number) => api.put(`/notifications/${id}/read`, {}).then(r => r.data),
  markAllRead: () => api.put('/notifications/read-all', {}).then(r => r.data),
};
