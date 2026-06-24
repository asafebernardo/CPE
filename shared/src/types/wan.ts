/** WAN connection types supported in simulation. */
import type { WanConnectionType } from './device.js';

export type { WanConnectionType };

/** Reserved for future WAN modes (UI placeholders). */
export type WanConnectionTypeFuture =
  | 'L2TP'
  | 'PPTP'
  | 'IPoE'
  | 'DS-Lite'
  | 'MAP-T'
  | 'MAP-E';

export type WanLinkStatus = 'connected' | 'disconnected';
export type WanPppoeAuthStatus = 'authenticated' | 'failed' | 'disconnected' | 'connecting';

export interface WanStatusPanelDto {
  status: WanLinkStatus;
  connectionType: WanConnectionType;
  uptimeSeconds: number;
  lastReconnect: string | null;
  connectedSince: string | null;
}

export interface WanPhysicalLinkDto {
  interface: string;
  linkStatus: WanLinkStatus;
  speedMbps: number;
  duplex: 'Full' | 'Half';
}

export interface WanStatisticsDto {
  rxBytes: number;
  txBytes: number;
  rxPackets: number;
  txPackets: number;
  rxErrors: number;
  txErrors: number;
  rxDrops: number;
  txDrops: number;
  updatedAt: string;
}

export interface WanQualityDto {
  latencyMs: number;
  jitterMs: number;
  packetLossPercent: number;
}

export interface WanIpv6PanelDto {
  enabled: boolean;
  slaac: boolean;
  dhcpv6: boolean;
  prefixDelegation: boolean;
  wanAddress: string;
  gateway: string;
  dns: string;
  prefixLength: number;
}

export interface WanVlanDto {
  enabled: boolean;
  vlanId: number;
  priority: number;
  status: 'active' | 'inactive';
}

export interface WanNatDto {
  enabled: boolean;
  type: string;
}

export interface WanDnsDto {
  auto: boolean;
  primary: string;
  secondary: string;
}

export interface WanIpv4Dto {
  ipAddress: string;
  subnetMask: string;
  gateway: string;
  mtu: number;
}

export interface WanPppoeDto {
  username: string;
  password: string;
  serviceName: string;
  acName: string;
  mtu: number;
  connected: boolean;
  sessionTimeSeconds: number;
  authStatus: WanPppoeAuthStatus;
}

export interface WanRouteEntryDto {
  destination: string;
  gateway: string;
  interface: string;
  metric: number;
}

export interface WanAcsConnectivityDto {
  reachable: boolean;
  lastInform: string | null;
  nextInform: string | null;
  connectionStatus: string;
}

export interface WanHistoryEventDto {
  id: string;
  timestamp: string;
  event: string;
  details?: string;
}

export interface WanConfigExtendedDto {
  connectionType: WanConnectionType;
  ipv4: WanIpv4Dto;
  dns: WanDnsDto;
  pppoe: WanPppoeDto;
  ipv6: WanIpv6PanelDto;
  vlan: WanVlanDto;
  nat: WanNatDto;
}

export interface WanDashboardDto {
  status: WanStatusPanelDto;
  physicalLink: WanPhysicalLinkDto;
  statistics: WanStatisticsDto;
  quality: WanQualityDto;
  config: WanConfigExtendedDto;
  routes: WanRouteEntryDto[];
  acs: WanAcsConnectivityDto;
  history: WanHistoryEventDto[];
  futureConnectionTypes: WanConnectionTypeFuture[];
  updatedAt: string;
}

/**
 * Service profile of a WAN interface. Real CPEs (Huawei, ZTE, Nokia, Intelbras)
 * expose both single-purpose service modes and combined modes where one WAN
 * interface carries several services at once (e.g. TR069_INTERNET).
 */
export type WanServiceType =
  // Single-purpose service modes
  | 'INTERNET'
  | 'VOIP'
  | 'TR069'
  | 'IPTV'
  | 'OTHER'
  | 'BRIDGE'
  // Combined / mixed service modes
  | 'INTERNET_TR069'
  | 'INTERNET_VOIP'
  | 'INTERNET_IPTV'
  | 'TR069_VOIP'
  | 'INTERNET_TR069_VOIP';

export const WAN_SERVICE_TYPES: WanServiceType[] = [
  'INTERNET', 'VOIP', 'TR069', 'IPTV', 'OTHER', 'BRIDGE',
  'INTERNET_TR069', 'INTERNET_VOIP', 'INTERNET_IPTV', 'TR069_VOIP', 'INTERNET_TR069_VOIP',
];

/** Combined service modes (a single WAN carrying multiple services). */
export const WAN_SERVICE_TYPES_COMBINED: WanServiceType[] = [
  'INTERNET_TR069', 'INTERNET_VOIP', 'INTERNET_IPTV', 'TR069_VOIP', 'INTERNET_TR069_VOIP',
];

/** Human-friendly labels for each service mode. */
export const WAN_SERVICE_TYPE_LABELS: Record<WanServiceType, string> = {
  INTERNET: 'Internet',
  VOIP: 'VoIP (Voice)',
  TR069: 'TR-069 Management',
  IPTV: 'IPTV',
  OTHER: 'Other',
  BRIDGE: 'Bridge',
  INTERNET_TR069: 'Internet + TR-069',
  INTERNET_VOIP: 'Internet + VoIP',
  INTERNET_IPTV: 'Internet + IPTV',
  TR069_VOIP: 'TR-069 + VoIP',
  INTERNET_TR069_VOIP: 'Internet + TR-069 + VoIP',
};

/** Decomposes a (possibly combined) service mode into its component services. */
export function wanServiceComponents(type: WanServiceType): Array<'INTERNET' | 'VOIP' | 'TR069' | 'IPTV' | 'OTHER' | 'BRIDGE'> {
  switch (type) {
    case 'INTERNET_TR069': return ['INTERNET', 'TR069'];
    case 'INTERNET_VOIP': return ['INTERNET', 'VOIP'];
    case 'INTERNET_IPTV': return ['INTERNET', 'IPTV'];
    case 'TR069_VOIP': return ['TR069', 'VOIP'];
    case 'INTERNET_TR069_VOIP': return ['INTERNET', 'TR069', 'VOIP'];
    default: return [type];
  }
}

/** A single WAN interface / service profile on the CPE. */
export interface WanInterfaceDto {
  id: string;
  name: string;
  serviceType: WanServiceType;
  connectionType: WanConnectionType;
  enabled: boolean;
  /** The primary internet WAN (backed by the main WAN config). Cannot be deleted. */
  isDefault: boolean;
  ipAddress: string;
  subnetMask: string;
  gateway: string;
  dnsPrimary: string;
  dnsSecondary: string;
  mtu: number;
  vlanEnabled: boolean;
  vlanId: number;
  natEnabled: boolean;
  pppoeUsername: string;
  status: WanLinkStatus;
}

/** Payload to create or update an additional WAN interface. */
export interface WanInterfaceInput {
  name: string;
  serviceType: WanServiceType;
  connectionType: WanConnectionType;
  enabled: boolean;
  ipAddress: string;
  subnetMask: string;
  gateway: string;
  dnsPrimary: string;
  dnsSecondary: string;
  mtu: number;
  vlanEnabled: boolean;
  vlanId: number;
  natEnabled: boolean;
  pppoeUsername: string;
  pppoePassword: string;
}