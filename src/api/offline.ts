import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './client';
import NetInfo from '@react-native-community/netinfo';

export interface CachedTicket {
  qrCodeHash: string; serialNumber: string; holderName: string;
  ticketTypeName: string; isUsed: boolean; usedAt?: string;
}

const CACHE_KEY = (eventId: number) => `checkin_cache_event_${eventId}`;
const QUEUE_KEY = 'checkin_offline_queue';

export const offlineApi = {
  prefetch: async (eventId: number): Promise<number> => {
    const { data } = await api.get<CachedTicket[]>(`/Tickets/event/${eventId}/checkin-cache`);
    await AsyncStorage.setItem(CACHE_KEY(eventId), JSON.stringify(data));
    return data.length;
  },

  validateOffline: async (hash: string, eventId: number): Promise<{ isValid: boolean; message: string; ticket?: CachedTicket }> => {
    const raw = await AsyncStorage.getItem(CACHE_KEY(eventId));
    if (!raw) return { isValid: false, message: 'Cache não encontrado. Faça o pré-carregamento primeiro.' };
    const tickets: CachedTicket[] = JSON.parse(raw);
    const ticket = tickets.find(t => t.qrCodeHash === hash);
    if (!ticket) return { isValid: false, message: 'Ingresso não encontrado.' };
    if (ticket.isUsed) return { isValid: false, message: 'Ingresso já utilizado.', ticket };
    ticket.isUsed = true;
    ticket.usedAt = new Date().toISOString();
    await AsyncStorage.setItem(CACHE_KEY(eventId), JSON.stringify(tickets));
    const queue = JSON.parse((await AsyncStorage.getItem(QUEUE_KEY)) || '[]');
    queue.push({ hash, eventId, validatedAt: ticket.usedAt });
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    return { isValid: true, message: `Check-in offline: ${ticket.holderName}`, ticket };
  },

  syncQueue: async (): Promise<number> => {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (!raw) return 0;
    const queue: { hash: string; eventId: number; validatedAt: string }[] = JSON.parse(raw);
    if (!queue.length) return 0;
    let synced = 0;
    const remaining = [];
    for (const item of queue) {
      try {
        await api.post('/Tickets/validate', { qrCodeHash: item.hash });
        synced++;
      } catch {
        remaining.push(item);
      }
    }
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
    return synced;
  },

  getCacheInfo: async (eventId: number): Promise<{ count: number; usedCount: number } | null> => {
    const raw = await AsyncStorage.getItem(CACHE_KEY(eventId));
    if (!raw) return null;
    const tickets: CachedTicket[] = JSON.parse(raw);
    return { count: tickets.length, usedCount: tickets.filter(t => t.isUsed).length };
  },

  getQueueSize: async (): Promise<number> => {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (!raw) return 0;
    return JSON.parse(raw).length;
  },
};
