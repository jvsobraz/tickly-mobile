import { api } from './client';

export interface TicketType {
  id: number; name: string; description?: string;
  price: number; quantityAvailable: number; isActive: boolean;
}
export interface EventItem {
  id: number; title: string; description?: string;
  dateTime: string; venue: string; city: string; state: string;
  imageUrl?: string; category?: string; status: number;
  organizerName?: string;
  minPrice?: number; totalTicketsAvailable?: number;
  ticketTypes?: TicketType[];
}

export interface PagedResult<T> {
  items: T[]; total: number; page: number; pageSize: number; totalPages: number;
}

export const eventsApi = {
  list: (params?: { search?: string; city?: string; category?: string; page?: number; pageSize?: number }) =>
    api.get<PagedResult<EventItem>>('/events', { params }).then(r => r.data),
  getById: (id: number) => api.get<EventItem>(`/events/${id}`).then(r => r.data),
};
