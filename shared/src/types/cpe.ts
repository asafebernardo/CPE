export interface ConnectedHostDto {
  id: string;
  macAddress: string;
  ipAddress: string;
  hostname: string;
  interface: string;
  band?: string;
  rssi?: number;
  leaseExpiry?: string;
  connectedAt: string;
}

export interface WifiNeighborDto {
  id: string;
  bssid: string;
  ssid: string;
  channel: number;
  rssi: number;
  security: string;
  band: string;
  scannedAt: string;
}

export interface BandSteeringConfigDto {
  enabled: boolean;
  rssiThreshold24: number;
  rssiThreshold5: number;
  prefer5G: boolean;
  clientSteering: boolean;
}

export interface SpeedTestResultDto {
  id: string;
  downloadMbps: number;
  uploadMbps: number;
  latencyMs: number;
  jitterMs: number;
  server: string;
  testedAt: string;
}

export interface Ipv6ConfigDto {
  wanEnabled: boolean;
  wanMode: string;
  lanEnabled: boolean;
  lanPrefix: string;
  dhcpv6Enabled: boolean;
  slaacEnabled?: boolean;
  prefixDelegation?: boolean;
  wanAddress?: string;
  wanGateway?: string;
  wanDns?: string;
  prefixLength?: number;
}

export interface GuestWlanConfigDto {
  enabled: boolean;
  ssid: string;
  password: string;
  security: string;
  isolation: boolean;
  band: string;
}

export interface DhcpReservationDto {
  id?: string;
  macAddress: string;
  ipAddress: string;
  hostname: string;
}

export interface StaticRouteDto {
  id?: string;
  destination: string;
  subnetMask: string;
  gateway: string;
  interface: string;
  enabled: boolean;
}

export interface UpnpConfigDto {
  enabled: boolean;
}

export interface QosRuleDto {
  id?: string;
  name: string;
  priority: number;
  protocol: string;
  srcPort: string;
  destPort: string;
  dscp: number;
  enabled: boolean;
}

export interface VpnConfigDto {
  type: string;
  server: string;
  username: string;
  password: string;
  enabled: boolean;
}

export interface FirmwareInfoDto {
  currentVersion: string;
  pendingVersion?: string;
  lastUpgrade?: string;
  upgradeStatus: string;
}

export interface FirmwareUploadResult {
  status: string;
  message: string;
  fileName: string;
  fileSize: number;
  targetVersion: string;
}

export interface NtpConfigDto {
  server: string;
  timezone: string;
}

export interface OpticalInfoDto {
  rxPowerDbm: number;
  txPowerDbm: number;
  temperature: number;
  ponStatus: string;
  oltId: string;
}

export interface VoipLineDto {
  id: string;
  lineId: number;
  number: string;
  status: string;
}
