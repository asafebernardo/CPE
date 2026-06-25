/** Wireless interface role — enforced server-side for Band Steering eligibility. */
export type WirelessInterfaceType = 'primary' | 'secondary' | 'guest' | 'mesh_backhaul' | 'iot';

export type WirelessBand = '2.4' | '5' | '6';

export type MeshBackhaulMode = 'wired' | 'wireless';

export type WirelessLinkStatus = 'connected' | 'disconnected';

export interface WirelessInterfaceDto {
  id: string;
  interfaceId: string;
  name: string;
  interfaceType: WirelessInterfaceType;
  band: WirelessBand;
  enabled: boolean;
  hidden: boolean;
  ssid: string;
  channel: number;
  channelWidth: string;
  security: string;
  password: string;
  isolated: boolean;
  vlanId: number | null;
  bandwidthLimitMbps: number | null;
  captivePortal: boolean;
  scheduleEnabled: boolean;
  scheduleStart: string | null;
  scheduleEnd: string | null;
  ipv4Enabled: boolean;
  ipv6Enabled: boolean;
  backhaulMode: MeshBackhaulMode | null;
  linkQuality: number | null;
  linkStatus: WirelessLinkStatus | null;
  bandSteeringEligible: boolean;
  bandSteeringWarning: string | null;
  updatedAt: string;
}

export interface GuestWirelessInput {
  name: string;
  ssid: string;
  band: WirelessBand;
  enabled?: boolean;
  security: string;
  password: string;
  isolated?: boolean;
  vlanId?: number;
  bandwidthLimitMbps?: number;
  captivePortal?: boolean;
  scheduleEnabled?: boolean;
  scheduleStart?: string;
  scheduleEnd?: string;
  ipv4Enabled?: boolean;
  ipv6Enabled?: boolean;
}

export interface MeshBackhaulInput {
  name?: string;
  band: WirelessBand;
  enabled?: boolean;
  channel: number;
  channelWidth: string;
  backhaulMode: MeshBackhaulMode;
}

export interface WirelessInterfaceUpdate {
  name?: string;
  enabled?: boolean;
  hidden?: boolean;
  ssid?: string;
  channel?: number;
  channelWidth?: string;
  security?: string;
  password?: string;
  isolated?: boolean;
  vlanId?: number | null;
  bandwidthLimitMbps?: number | null;
  captivePortal?: boolean;
  scheduleEnabled?: boolean;
  scheduleStart?: string | null;
  scheduleEnd?: string | null;
  ipv4Enabled?: boolean;
  ipv6Enabled?: boolean;
  backhaulMode?: MeshBackhaulMode;
}

export const BAND_STEERING_ELIGIBLE_TYPES: WirelessInterfaceType[] = ['primary'];

/** Home network SSIDs (primary + secondary) sharing radio plan per band. */
export const NETWORK_WLAN_INTERFACE_TYPES: WirelessInterfaceType[] = ['primary', 'secondary'];

export const BAND_STEERING_EXCLUDED_TYPES: WirelessInterfaceType[] = ['secondary', 'guest', 'mesh_backhaul', 'iot'];

export function isBandSteeringEligible(type: WirelessInterfaceType): boolean {
  return type === 'primary';
}

export function getBandSteeringWarning(type: WirelessInterfaceType): string | null {
  if (type === 'secondary') return 'Secondary networks cannot participate in Band Steering';
  if (type === 'guest') return 'Guest networks cannot participate in Band Steering';
  if (type === 'mesh_backhaul') return 'Reserved Mesh Interface';
  if (type === 'iot') return 'IoT interfaces cannot participate in Band Steering';
  return null;
}

export function validateBandSteeringMembership(type: WirelessInterfaceType): { valid: boolean; error?: string } {
  if (type === 'secondary') {
    return { valid: false, error: 'Secondary WiFi interfaces are not eligible for Band Steering' };
  }
  if (type === 'guest') {
    return { valid: false, error: 'Guest WiFi interfaces are not eligible for Band Steering' };
  }
  if (type === 'mesh_backhaul') {
    return { valid: false, error: 'Mesh Backhaul interfaces are reserved and cannot join Band Steering' };
  }
  if (type === 'iot') {
    return { valid: false, error: 'IoT interfaces are not eligible for Band Steering' };
  }
  return { valid: true };
}

export const WIRELESS_INTERFACE_TYPE_LABELS: Record<WirelessInterfaceType, string> = {
  primary: 'Primary',
  secondary: 'Secondary',
  guest: 'Guest',
  mesh_backhaul: 'Mesh',
  iot: 'IoT',
};
