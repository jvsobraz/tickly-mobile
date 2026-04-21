import { api } from './client';
import { EventItem } from './events';

export interface CreateEventRequest {
  title: string; description: string; dateTime: string;
  venue: string; address: string; city: string; state: string;
  category: string; imageUrl?: string;
}
export interface CreateTicketTypeRequest {
  name: string; description?: string; price: number; quantity: number;
}
export interface Coupon {
  id: number; code: string; discountType: number; discountValue: number;
  maxUses?: number; usedCount: number; isActive: boolean; expiresAt?: string;
  eventId?: number; eventTitle?: string;
}
export interface FlashSale {
  id: number; ticketTypeId: number; ticketTypeName: string; eventTitle: string;
  discountType: number; discountValue: number; flashPrice: number;
  startAt: string; endAt: string; maxQuantity?: number; isRunning: boolean;
}
export interface Analytics {
  totalRevenue: number; totalOrders: number; totalTicketsSold: number;
  revenueByType: { name: string; revenue: number; sold: number }[];
  ordersByDay: { date: string; orders: number }[];
}

export const adminApi = {
  getMyEvents: () => api.get<EventItem[]>('/events/my').then(r => r.data),
  createEvent: (data: CreateEventRequest) =>
    api.post<EventItem>('/events', data).then(r => r.data),
  updateEvent: (id: number, data: Partial<CreateEventRequest>) =>
    api.put<EventItem>(`/events/${id}`, data).then(r => r.data),
  addTicketType: (eventId: number, data: CreateTicketTypeRequest) =>
    api.post(`/events/${eventId}/ticket-types`, data).then(r => r.data),

  // Coupons
  getCoupons: (eventId?: number) =>
    api.get<Coupon[]>('/coupons', { params: { eventId } }).then(r => r.data),
  createCoupon: (data: Partial<Coupon>) =>
    api.post<Coupon>('/coupons', data).then(r => r.data),
  deleteCoupon: (id: number) => api.delete(`/coupons/${id}`).then(r => r.data),

  // Flash Sales
  getFlashSales: (eventId: number) =>
    api.get<FlashSale[]>(`/flash-sales/event/${eventId}`).then(r => r.data),
  createFlashSale: (data: Partial<FlashSale>) =>
    api.post<FlashSale>('/flash-sales', data).then(r => r.data),
  deleteFlashSale: (id: number) => api.delete(`/flash-sales/${id}`).then(r => r.data),

  // Analytics
  getAnalytics: (eventId: number) =>
    api.get<Analytics>(`/analytics/event/${eventId}`).then(r => r.data),

  // Payment Links
  getPaymentLinks: () => api.get('/payment-links/my').then(r => r.data),
  createPaymentLink: (data: any) => api.post('/payment-links', data).then(r => r.data),
};
