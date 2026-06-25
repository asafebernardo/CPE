import { create } from 'zustand';
import type { WanDashboardDto, WanInterfaceDto, WanInterfaceInput } from '@aerobrry/shared';
import api from '../services/api';

interface WanState {
  data: WanDashboardDto | null;
  loading: boolean;
  error: string | null;
  actionLoading: boolean;
  interfaces: WanInterfaceDto[];
  interfacesLoading: boolean;
  fetch: () => Promise<void>;
  setFromPayload: (partial: Partial<WanDashboardDto>) => void;
  saveConfig: (payload: Record<string, unknown>) => Promise<void>;
  runAction: (action: string) => Promise<void>;
  fetchInterfaces: () => Promise<void>;
  createInterface: (input: WanInterfaceInput) => Promise<void>;
  updateInterface: (id: string, input: WanInterfaceInput) => Promise<void>;
  deleteInterface: (id: string) => Promise<void>;
  toggleInterfaceEnabled: (id: string, enabled: boolean) => Promise<void>;
}

export const useWanStore = create<WanState>((set, get) => ({
  data: null,
  loading: false,
  error: null,
  actionLoading: false,
  interfaces: [],
  interfacesLoading: false,

  fetch: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.get<WanDashboardDto>('/wan/dashboard');
      set({ data: res.data, loading: false });
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : 'Failed to load WAN dashboard',
      });
    }
  },

  fetchInterfaces: async () => {
    set({ interfacesLoading: true });
    try {
      const res = await api.get<WanInterfaceDto[]>('/wan/interfaces');
      set({ interfaces: res.data, interfacesLoading: false });
    } catch (e) {
      set({ interfacesLoading: false, error: e instanceof Error ? e.message : 'Failed to load interfaces' });
    }
  },

  createInterface: async (input) => {
    await api.post('/wan/interfaces', input);
    await get().fetchInterfaces();
  },

  updateInterface: async (id, input) => {
    await api.put(`/wan/interfaces/${id}`, input);
    await get().fetchInterfaces();
  },

  deleteInterface: async (id) => {
    await api.delete(`/wan/interfaces/${id}`);
    await get().fetchInterfaces();
  },

  toggleInterfaceEnabled: async (id, enabled) => {
    await api.patch(`/wan/interfaces/${id}`, { enabled });
    await get().fetchInterfaces();
    if (id === 'primary') await get().fetch();
  },

  setFromPayload: (partial) => {
    const current = get().data;
    if (!current) return;
    set({ data: { ...current, ...partial } });
  },

  saveConfig: async (payload) => {
    set({ actionLoading: true });
    try {
      const res = await api.put<WanDashboardDto>('/wan', payload);
      set({ data: res.data, actionLoading: false });
    } catch (e) {
      set({ actionLoading: false, error: e instanceof Error ? e.message : 'Save failed' });
      throw e;
    }
  },

  runAction: async (action) => {
    set({ actionLoading: true });
    try {
      const res = await api.post(`/wan/actions/${action}`);
      const dashboard = res.data.dashboard ?? res.data;
      if (dashboard.status) set({ data: dashboard as WanDashboardDto, actionLoading: false });
      else set({ actionLoading: false });
    } catch (e) {
      set({ actionLoading: false, error: e instanceof Error ? e.message : 'Action failed' });
      throw e;
    }
  },
}));
