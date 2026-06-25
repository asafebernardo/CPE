export type DevicePresetId = 'factory-default' | 'isp-home' | 'bridge-mode' | 'secure-guest';

export interface DevicePresetDto {
  id: DevicePresetId;
  label: string;
  description: string;
}

export const DEVICE_PRESETS: DevicePresetDto[] = [
  {
    id: 'factory-default',
    label: 'Factory Default',
    description: 'Restore WAN, LAN and Wi-Fi to factory credentials and defaults.',
  },
  {
    id: 'isp-home',
    label: 'ISP Home',
    description: 'DHCP WAN, standard LAN and dual-band Wi-Fi with band steering enabled.',
  },
  {
    id: 'bridge-mode',
    label: 'Bridge Mode',
    description: 'Bridge WAN and disable LAN DHCP for use behind another router.',
  },
  {
    id: 'secure-guest',
    label: 'Secure Guest',
    description: 'ISP Home preset plus isolated guest network on 2.4 GHz.',
  },
];

export function getDevicePreset(id: string): DevicePresetDto | undefined {
  return DEVICE_PRESETS.find((p) => p.id === id);
}
