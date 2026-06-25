import type { UserRole } from './auth.js';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: { id: string; username: string; role: UserRole };
  mustChangePassword?: boolean;
}

export interface DashboardResponse {
  wan: WanStatus;
  lan: LanStatus;
  wifi: WifiStatus[];
  uptime: number;
  cpuUsage: number;
  memoryUsage: number;
  acs: AcsStatus;
  lastInform: string | null;
}

export interface WanStatus {
  connectionType: string;
  ipAddress: string;
  subnetMask: string;
  gateway: string;
  dnsPrimary: string;
  dnsSecondary: string;
  status: 'connected' | 'disconnected';
}

export interface LanStatus {
  ipAddress: string;
  subnetMask: string;
  dhcpEnabled: boolean;
  dhcpRangeStart: string;
  dhcpRangeEnd: string;
  status: 'active';
}

export interface WifiStatus {
  band: '2.4' | '5';
  ssid: string;
  channel: number;
  channelWidth: string;
  security: string;
  enabled: boolean;
  status: 'active' | 'disabled';
}

export interface AcsStatus {
  url: string;
  configured: boolean;
  periodicInformEnabled: boolean;
  periodicInformInterval: number;
  lastSessionState: string;
}

export interface WanConfigDto {
  connectionType: 'DHCP' | 'PPPoE' | 'Static' | 'Bridge';
  ipAddress?: string;
  subnetMask?: string;
  gateway?: string;
  dnsPrimary?: string;
  dnsSecondary?: string;
  pppoeUsername?: string;
  pppoePassword?: string;
  mtu?: number;
  dnsAuto?: boolean;
  pppoeServiceName?: string;
  pppoeAcName?: string;
  pppoeMtu?: number;
  vlanEnabled?: boolean;
  vlanId?: number;
  vlanPriority?: number;
  natEnabled?: boolean;
  natType?: string;
}

export interface LanConfigDto {
  ipAddress: string;
  subnetMask: string;
  dhcpEnabled: boolean;
  dhcpRangeStart: string;
  dhcpRangeEnd: string;
}

export interface WlanConfigDto {
  band: '2.4' | '5';
  enabled: boolean;
  ssid: string;
  channel: number;
  channelWidth: string;
  security: string;
  password: string;
}

export interface FirewallRuleDto {
  id?: string;
  name: string;
  direction: 'inbound' | 'outbound';
  protocol: 'TCP' | 'UDP' | 'BOTH' | 'ICMP' | 'ANY';
  sourceIp: string;
  destIp: string;
  sourcePort: string;
  destPort: string;
  action: 'allow' | 'deny';
  enabled: boolean;
}

export interface PortForwardDto {
  id?: string;
  name: string;
  externalPort: number;
  internalIp: string;
  internalPort: number;
  protocol: 'TCP' | 'UDP' | 'BOTH';
  enabled: boolean;
}

export interface DmzConfigDto {
  enabled: boolean;
  hostIp: string;
}

export interface LogEntryDto {
  id: string;
  type: string;
  message: string;
  details?: string;
  createdAt: string;
}

export interface PingRequest {
  target: string;
  count?: number;
}

export interface PingResponse {
  target: string;
  packetsSent: number;
  packetsReceived: number;
  minMs: number;
  avgMs: number;
  maxMs: number;
  results: PingResult[];
}

export interface PingResult {
  seq: number;
  timeMs: number;
  ttl: number;
  success: boolean;
}

export interface TracerouteRequest {
  target: string;
  maxHops?: number;
}

export interface TracerouteResponse {
  target: string;
  hops: TracerouteHop[];
}

export interface TracerouteHop {
  hop: number;
  ip: string;
  hostname: string;
  timeMs: number;
}

export interface BackupResponse {
  id: string;
  createdAt: string;
  label: string;
}

export interface AcsConfigDto {
  url: string;
  username?: string;
  password?: string;
  periodicInformEnabled: boolean;
  periodicInformInterval: number;
}

export interface AcsStatusResponse {
  url: string;
  configured: boolean;
  lastInform: string | null;
  lastEventCodes: string[];
  sessionState: string;
  periodicInformEnabled: boolean;
  periodicInformInterval: number;
}

export interface ApiError {
  error: string;
  message: string;
}
