import { api } from './client';

export interface TicketTransfer {
  id: number; ticketId: number; token: string; toEmail: string;
  status: number; statusLabel: string; message?: string;
  createdAt: string; expiresAt: string; acceptedAt?: string;
  fromUserName: string; toUserName?: string;
  eventTitle: string; ticketTypeName: string;
}

export const transferApi = {
  initiate: (ticketId: number, toEmail: string, message?: string) =>
    api.post<TicketTransfer>('/ticket-transfers', { ticketId, toEmail, message }).then(r => r.data),
  getMy: () => api.get<TicketTransfer[]>('/ticket-transfers/my').then(r => r.data),
  accept: (token: string) =>
    api.post<TicketTransfer>(`/ticket-transfers/${token}/accept`, {}).then(r => r.data),
  cancel: (transferId: number) =>
    api.delete(`/ticket-transfers/${transferId}`).then(r => r.data),
};
