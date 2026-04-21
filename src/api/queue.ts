import { api } from './client';

export interface QueueStatus {
  entryId: number; position: number; totalInQueue: number;
  status: number; statusLabel: string; accessToken?: string;
  expiresAt?: string; secondsUntilExpiry?: number;
  eventId: number; eventTitle: string; requestedQuantity: number;
}

export const queueApi = {
  join: (eventId: number, quantity: number) =>
    api.post<QueueStatus>(`/queue/${eventId}/join`, { quantity }).then(r => r.data),
  getStatus: (eventId: number) =>
    api.get<QueueStatus>(`/queue/${eventId}/status`).then(r => r.data),
  leave: (eventId: number) =>
    api.delete(`/queue/${eventId}/leave`).then(r => r.data),
  validateToken: (token: string) =>
    api.get<QueueStatus>(`/queue/validate/${token}`).then(r => r.data),
};
