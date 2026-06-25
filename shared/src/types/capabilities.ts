export type DeviceProfile = 'enterprise' | 'gaming' | 'isp' | 'mesh_node' | 'generic';

export interface DeviceCapabilities {
  wifi7: boolean;
  mesh: boolean;
  usb: boolean;
  sfp: boolean;
  vpn: boolean;
  lte: boolean;
  rgb: boolean;
  pon: boolean;
  tr069: boolean;
  qos: boolean;
  profile: DeviceProfile;
}

export const DEFAULT_CAPABILITIES: DeviceCapabilities = {
  wifi7: false,
  mesh: true,
  usb: false,
  sfp: false,
  vpn: true,
  lte: false,
  rgb: false,
  pon: false,
  tr069: true,
  qos: true,
  profile: 'generic',
};
