import { api } from './client';

export interface WaitlistEntry {
  id: number; ticketTypeId: number; ticketTypeName: string; eventTitle: string;
  quantity: number; status: number; statusLabel: string; createdAt: string;
}

export const waitlistApi = {
  join: (ticketTypeId: number, quantity: number) =>
    api.post<WaitlistEntry>('/waitlist', { ticketTypeId, quantity }).then(r => r.data),
  getMy: () => api.get<WaitlistEntry[]>('/waitlist/my').then(r => r.data),
  leave: (entryId: number) => api.delete(`/waitlist/${entryId}`).then(r => r.data),
};
