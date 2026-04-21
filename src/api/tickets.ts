import { api } from './client';

export interface Ticket {
  id: number; serialNumber: string; qrCodeBase64: string;
  isUsed: boolean; usedAt?: string;
  ticketTypeName: string; eventTitle: string; eventId: number;
  eventDateTime: string; eventVenue: string; eventCity: string;
  unitPrice: number;
}
export interface ValidateResult {
  isValid: boolean; message: string;
  ticket?: {
    ticketId: number; serialNumber: string; eventTitle: string;
    ticketTypeName: string; holderName: string;
    wasAlreadyUsed: boolean; usedAt?: string;
  };
}
export interface OrderItem { ticketTypeId: number; quantity: number; }
export interface CreateOrderRequest { items: OrderItem[]; paymentMethod: number; }
export interface OrderResponse {
  id: number; totalAmount: number; status: number;
  stripeClientSecret?: string; stripePaymentIntentId?: string;
  items: { ticketTypeId: number; quantity: number; unitPrice: number }[];
}

export const ticketsApi = {
  getMyTickets: () => api.get<Ticket[]>('/tickets/my-tickets').then(r => r.data),
  validate: (qrCodeHash: string) =>
    api.post<ValidateResult>('/tickets/validate', { qrCodeHash }).then(r => r.data),
  createOrder: (data: CreateOrderRequest) =>
    api.post<OrderResponse>('/orders', data).then(r => r.data),
};
