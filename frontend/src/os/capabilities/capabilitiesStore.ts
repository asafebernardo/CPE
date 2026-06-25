import { create } from 'zustand';
import { DEFAULT_CAPABILITIES, type DeviceCapabilities } from '@aerobrry/shared';
import api from '../../services/api';

interface CapabilitiesState {
  capabilities: DeviceCapabilities | null;
  loading: boolean;
  fetch: () => Promise<void>;
  hasCapability: (key: keyof DeviceCapabilities) => boolean;
}

export const useCapabilitiesStore = create<CapabilitiesState>((set, get) => ({
  capabilities: null,
  loading: false,

  fetch: async () => {
    set({ loading: true });
    try {
      const res = await api.get<DeviceCapabilities>('/cpe/capabilities');
      set({ capabilities: res.data, loading: false });
    } catch {
      set({ capabilities: DEFAULT_CAPABILITIES, loading: false });
    }
  },

  hasCapability: (key) => {
    const caps = get().capabilities ?? DEFAULT_CAPABILITIES;
    if (key === 'profile') return true;
    return Boolean(caps[key]);
  },
}));
