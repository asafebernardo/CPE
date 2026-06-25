import { create } from 'zustand';
import type { WanConfigDto, LanConfigDto } from '@aerobrry/shared';

interface DeviceState {
  wan: WanConfigDto | null;
  lan: LanConfigDto | null;
  setWan: (wan: WanConfigDto) => void;
  setLan: (lan: LanConfigDto) => void;
}

export const useDeviceStore = create<DeviceState>((set) => ({
  wan: null,
  lan: null,
  setWan: (wan) => set({ wan }),
  setLan: (lan) => set({ lan }),
}));
