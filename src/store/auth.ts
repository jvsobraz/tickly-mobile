import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { AuthResponse } from '../api/auth';

interface AuthState {
  user: AuthResponse | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: AuthResponse, token: string) => void;
  logout: () => void;
  loadToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  setAuth: async (user, token) => {
    await SecureStore.setItemAsync('jwt', token);
    set({ user, token, isAuthenticated: true });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('jwt');
    set({ user: null, token: null, isAuthenticated: false });
  },

  loadToken: async () => {
    const token = await SecureStore.getItemAsync('jwt');
    if (token) set({ token, isAuthenticated: true });
  },
}));
