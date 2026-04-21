import { api } from './client';

export interface Ticket {
  id: number; serialNumber: string; qrCodeHash: string; qrCodeDataUrl?: string;
  isUsed: boolean; usedAt?: string; holderName: string;
  ticketTypeName: string; eventTitle: string; eventDateTime: string;
  eventVenue: string; price: number;
}
export interface ValidateResult {
  isValid: boolean; message: string;
  holderName?: string; ticketTypeName?: string; eventTitle?: string;
  wasAlreadyUsed?: boolean; usedAt?: string;
}
export interface OrderItem { ticketTypeId: number; quantity: number; }
export interface CreateOrderRequest { items: OrderItem[]; paymentMethod: number; }
export interface OrderResponse {
  id: number; totalAmount: number; status: number;
  stripeClientSecret?: string; stripePaymentIntentId?: string;
  items: { ticketTypeId: number; quantity: number; unitPrice: number }[];
}

export const ticketsApi = {
  getMyTickets: () => api.get<Ticket[]>('/Tickets/my').then(r => r.data),
  validate: (hash: string) =>
    api.post<ValidateResult>('/Tickets/validate', { qrCodeHash: hash }).then(r => r.data),
  createOrder: (data: CreateOrderRequest) =>
    api.post<OrderResponse>('/orders', data).then(r => r.data),
};
