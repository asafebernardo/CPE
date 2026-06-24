import { create } from 'zustand';
import type { DashboardResponse } from '@routergui/shared';

interface DashboardState {
  data: DashboardResponse | null;
  loading: boolean;
  setData: (data: DashboardResponse) => void;
  updateMetrics: (cpu: number, memory: number, uptime: number) => void;
  setLoading: (loading: boolean) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  data: null,
  loading: false,
  setData: (data) => set({ data }),
  updateMetrics: (cpuUsage, memoryUsage, uptime) =>
    set((state) => ({
      data: state.data
        ? { ...state.data, cpuUsage, memoryUsage, uptime }
        : null,
    })),
  setLoading: (loading) => set({ loading }),
}));
