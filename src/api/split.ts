import { api } from './client';

export interface SplitParticipant {
  id: number; name?: string; email?: string; amount: number;
  status: number; statusLabel: string; stripeClientSecret?: string; paidAt?: string;
}
export interface SplitPayment {
  id: number; token: string; shareUrl: string; eventId: number; eventTitle: string;
  ticketTypeName: string; totalQuantity: number; totalAmount: number; shareAmount: number;
  maxParticipants: number; paidCount: number; status: number; statusLabel: string;
  expiresAt: string; createdAt: string; participants: SplitParticipant[];
}

export const splitApi = {
  create: (ticketTypeId: number, participants: number, quantityPerParticipant: number) =>
    api.post<SplitPayment>('/split', { ticketTypeId, participants, quantityPerParticipant }).then(r => r.data),
  getByToken: (token: string) =>
    api.get<SplitPayment>(`/split/${token}`).then(r => r.data),
  getMy: () => api.get<SplitPayment[]>('/split/my').then(r => r.data),
  joinAndPay: (token: string) =>
    api.post<SplitPayment>(`/split/${token}/join`, {}).then(r => r.data),
};
