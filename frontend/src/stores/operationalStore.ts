import { create } from 'zustand';
import type { OperationalDashboardResponse } from '@routergui/shared';
import api from '../services/api';

interface OperationalState {
  data: OperationalDashboardResponse | null;
  loading: boolean;
  fetch: () => Promise<void>;
  setData: (data: OperationalDashboardResponse) => void;
}

export const useOperationalStore = create<OperationalState>((set) => ({
  data: null,
  loading: false,
  fetch: async () => {
    set({ loading: true });
    try {
      const res = await api.get<OperationalDashboardResponse>('/operational/dashboard');
      set({ data: res.data });
    } finally {
      set({ loading: false });
    }
  },
  setData: (data) => set({ data }),
}));
