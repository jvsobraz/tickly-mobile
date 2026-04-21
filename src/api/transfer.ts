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
    api.post<TicketTransfer>('/TicketTransfers', { ticketId, toEmail, message }).then(r => r.data),
  getSent: () => api.get<TicketTransfer[]>('/TicketTransfers/sent').then(r => r.data),
  getPending: () => api.get<TicketTransfer[]>('/TicketTransfers/pending').then(r => r.data),
  accept: (token: string) =>
    api.post<TicketTransfer>(`/TicketTransfers/accept/${token}`, {}).then(r => r.data),
  cancel: (transferId: number) =>
    api.delete(`/TicketTransfers/${transferId}`).then(r => r.data),
};
