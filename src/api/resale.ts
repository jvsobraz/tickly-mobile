import { api } from './client';

export interface TicketResale {
  id: number; ticketId: number; sellerId: number; sellerName: string;
  originalPrice: number; askingPrice: number; status: number; statusLabel: string;
  eventTitle: string; eventDateTime: string; ticketTypeName: string;
  stripeClientSecret?: string; createdAt: string;
}

export const resaleApi = {
  list: () => api.get<TicketResale[]>('/resale').then(r => r.data),
  getMy: () => api.get<TicketResale[]>('/resale/my').then(r => r.data),
  create: (ticketId: number, askingPrice: number) =>
    api.post<TicketResale>('/resale', { ticketId, askingPrice }).then(r => r.data),
  buy: (resaleId: number) =>
    api.post<TicketResale>(`/resale/${resaleId}/buy`, {}).then(r => r.data),
  cancel: (resaleId: number) =>
    api.delete(`/resale/${resaleId}`).then(r => r.data),
};
