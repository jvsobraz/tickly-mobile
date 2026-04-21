import { api } from './client';

export interface FinancialSummary {
  grossRevenue: number; totalDiscounts: number; totalRefunds: number;
  netRevenue: number; platformFee: number; netAfterFees: number;
  availableBalance: number; totalOrders: number; totalTicketsSold: number;
}
export interface RevenueByPeriod { period: string; revenue: number; orders: number; }
export interface Payout {
  id: number; amount: number; status: number; statusLabel: string;
  requestedAt: string; processedAt?: string; notes?: string;
  eventTitle?: string; stripeTransferId?: string;
}

export const financialApi = {
  getSummary: (params?: { from?: string; to?: string; eventId?: number }) =>
    api.get<FinancialSummary>('/financial/summary', { params }).then(r => r.data),
  getRevenue: (period = 'daily') =>
    api.get<RevenueByPeriod[]>('/financial/revenue', { params: { period } }).then(r => r.data),
  getPayouts: () => api.get<Payout[]>('/financial/payouts').then(r => r.data),
  requestPayout: (amount: number, eventId?: number, notes?: string) =>
    api.post<Payout>('/financial/payouts', { amount, eventId, notes }).then(r => r.data),
};
