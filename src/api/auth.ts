import { api } from './client';

export interface LoginRequest { email: string; password: string; }
export interface RegisterRequest { name: string; email: string; password: string; phone?: string; }
export interface AuthResponse { token: string; userId: number; name: string; email: string; role: string; }

export const authApi = {
  login: (data: LoginRequest) => api.post<AuthResponse>('/auth/login', data).then(r => r.data),
  register: (data: RegisterRequest) => api.post<AuthResponse>('/auth/register', data).then(r => r.data),
  me: () => api.get<AuthResponse>('/auth/me').then(r => r.data),
};
