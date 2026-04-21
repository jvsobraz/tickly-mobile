import { api } from './client';

export interface SeatSection {
  id: number; name: string; color: string; ticketTypeId: number;
  ticketTypeName: string; price: number; availableCount: number;
}
export interface SeatDto {
  id: number; row: string; number: number; seatCode: string;
  status: number; isAvailable: boolean; sectionId: number;
  sectionName: string; sectionColor: string; ticketTypeId: number; price: number;
}
export interface SeatRow { row: string; seats: SeatDto[]; }
export interface SeatMap {
  id: number; eventId: number; name: string; sections: SeatSection[];
  rows: SeatRow[]; totalSeats: number; availableSeats: number; soldSeats: number;
}
export interface SeatReservation {
  reservedSeats: SeatDto[]; expiresAt: string; secondsUntilExpiry: number;
}

export const seatMapApi = {
  getByEvent: (eventId: number) =>
    api.get<SeatMap>(`/seat-maps/events/${eventId}`).then(r => r.data),
  reserve: (eventId: number, seatIds: number[]) =>
    api.post<SeatReservation>(`/seat-maps/events/${eventId}/reserve`, { seatIds }).then(r => r.data),
  release: (eventId: number) =>
    api.delete(`/seat-maps/events/${eventId}/reserve`).then(r => r.data),
};
