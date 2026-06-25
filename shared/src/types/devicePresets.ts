import type { DevicePresetId } from '../constants/devicePresets.js';

export interface ApplyDevicePresetResult {
  presetId: DevicePresetId;
  label: string;
  success: boolean;
  message: string;
}
