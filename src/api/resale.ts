import { api } from './client';

export interface TicketResale {
  id: number; ticketId: number; sellerId: number; sellerName: string;
  originalPrice: number; askingPrice: number;
  ticketSerialNumber: string; status: number;
  eventTitle: string; ticketTypeName: string;
  stripeClientSecret?: string; createdAt: string; soldAt?: string;
}

export const resaleApi = {
  listByEvent: (eventId: number) =>
    api.get<TicketResale[]>(`/Resale/events/${eventId}`).then(r => r.data),
  create: (ticketId: number, askingPrice: number) =>
    api.post<TicketResale>('/Resale', { ticketId, askingPrice }).then(r => r.data),
  buy: (resaleId: number) =>
    api.post<TicketResale>(`/Resale/${resaleId}/purchase`, {}).then(r => r.data),
  cancel: (resaleId: number) =>
    api.delete(`/Resale/${resaleId}`).then(r => r.data),
};
