export interface VirtualDeviceInfo {
  id: string;
  manufacturer: string;
  modelName: string;
  softwareVersion: string;
  hardwareVersion: string;
  serialNumber: string;
  osName: string;
}

export type WanConnectionType = 'DHCP' | 'PPPoE' | 'Static' | 'Bridge';

export interface WanConfig {
  connectionType: WanConnectionType;
  ipAddress: string;
  subnetMask: string;
  gateway: string;
  dnsPrimary: string;
  dnsSecondary: string;
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
  pppoeConnected?: boolean;
  status?: string;
}

export interface LanConfig {
  ipAddress: string;
  subnetMask: string;
  dhcpEnabled: boolean;
  dhcpRangeStart: string;
  dhcpRangeEnd: string;
}

export interface WlanConfig {
  band: '2.4' | '5';
  enabled: boolean;
  ssid: string;
  channel: number;
  channelWidth: string;
  security: string;
  password: string;
}

export interface SimulatedMetrics {
  cpuUsage: number;
  memoryUsage: number;
  uptime: number;
  bootTime: Date;
}
