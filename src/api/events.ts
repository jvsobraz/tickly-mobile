import { api } from './client';

export interface TicketType {
  id: number; name: string; description?: string;
  price: number; quantityAvailable: number; isActive: boolean;
}
export interface EventItem {
  id: number; title: string; description?: string;
  dateTime: string; venue: string; city: string; state: string;
  imageUrl?: string; category?: string; status: number;
  organizerName: string; ticketTypes: TicketType[];
}

export const eventsApi = {
  list: (params?: { city?: string; category?: string; page?: number; pageSize?: number }) =>
    api.get<EventItem[]>('/events', { params }).then(r => r.data),
  getById: (id: number) => api.get<EventItem>(`/events/${id}`).then(r => r.data),
};
