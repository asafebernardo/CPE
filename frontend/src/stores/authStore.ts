import { create } from 'zustand';
import api from '../services/api';
import type { LoginResponse, UserRole } from '@routergui/shared';

interface AuthUser {
  id: string;
  username: string;
  role: UserRole;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  mustChangePassword: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  init: () => void;
  clearMustChange: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  mustChangePassword: false,

  init: () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      const user = JSON.parse(userStr) as AuthUser;
      if (!user.role) {
        user.role = user.username === 'admin' ? 'ADMIN' : user.username === 'tech' ? 'TECHNICIAN' : 'USER';
        localStorage.setItem('user', JSON.stringify(user));
      }
      set({ token, user, isAuthenticated: true, mustChangePassword: localStorage.getItem('mustChangePassword') === '1' });
    }
  },

  login: async (username, password) => {
    try {
      const { data } = await api.post<LoginResponse>('/auth/login', { username, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      const must = Boolean(data.mustChangePassword);
      localStorage.setItem('mustChangePassword', must ? '1' : '0');
      set({ token: data.token, user: data.user, isAuthenticated: true, mustChangePassword: must });
      return true;
    } catch {
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('mustChangePassword');
    set({ token: null, user: null, isAuthenticated: false, mustChangePassword: false });
  },

  clearMustChange: () => {
    localStorage.setItem('mustChangePassword', '0');
    set({ mustChangePassword: false });
  },
}));
