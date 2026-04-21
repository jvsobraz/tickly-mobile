import { api } from './client';

export interface LoyaltyBalance { points: number; redeemableValue: number; }
export interface LoyaltyTransaction {
  id: number; points: number; description: string;
  transactionType: number; createdAt: string; orderId?: number;
}

export const loyaltyApi = {
  getBalance: () => api.get<LoyaltyBalance>('/loyalty/balance').then(r => r.data),
  getHistory: () => api.get<LoyaltyTransaction[]>('/loyalty/history').then(r => r.data),
};
