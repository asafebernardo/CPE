export type LedState = 'on' | 'off' | 'error' | 'blink';

export interface LedIndicatorDto {
  id: string;
  label: string;
  state: LedState;
}

export interface DeviceInfoPanelDto {
  manufacturer: string;
  modelName: string;
  osName: string;
  softwareVersion: string;
  hardwareVersion: string;
  serialNumber: string;
  uptime: number;
}

export interface TopologyDto {
  internetOnline: boolean;
  wanStatus: 'connected' | 'disconnected';
  lanStatus: 'active' | 'inactive';
  wifi24Status: 'active' | 'disabled';
  wifi5Status: 'active' | 'disabled';
  lanClientCount: number;
  wifi24ClientCount: number;
  wifi5ClientCount: number;
}

export interface OperationalDashboardResponse {
  updatedAt: string;
  internet: { status: 'online' | 'offline' };
  wan: {
    connectionType: string;
    ipAddress: string;
    gateway: string;
    bytesSent: number;
    bytesReceived: number;
    status: 'connected' | 'disconnected';
  };
  lan: {
    ipAddress: string;
    dhcpEnabled: boolean;
    hostCount: number;
    status: 'active';
  };
  wifi: {
    clients24: number;
    clients5: number;
    ssid24: string;
    ssid5: string;
    status24: 'active' | 'disabled';
    status5: 'active' | 'disabled';
  };
  acs: {
    url: string;
    configured: boolean;
    status: string;
    lastInform: string | null;
    nextInform: string | null;
    periodicInformInterval: number;
  };
  system: {
    cpuUsage: number;
    memoryUsage: number;
    uptime: number;
  };
  topology: TopologyDto;
  leds: LedIndicatorDto[];
  device: DeviceInfoPanelDto;
}

export interface Tr069EventDto {
  id: string;
  timestamp: string;
  event: string;
  code: string;
  result: string;
  details?: string;
}

export interface Tr098ParameterNodeDto {
  id: string;
  path: string;
  name: string;
  value: string;
  type: string;
  writable: boolean;
  notification: number;
  description?: string;
  children?: Tr098ParameterNodeDto[];
}

export interface Tr069ManagementDto {
  url: string;
  username: string;
  password: string;
  periodicInformEnabled: boolean;
  periodicInformInterval: number;
  cwmpVersion: string;
  connectionRequestUrl: string;
  connectionRequestUsername: string;
  connectionRequestPassword: string;
  connectionRequestBlocked?: boolean;
  connectionRequestWarning?: string;
  lastInform: string | null;
  nextInform: string | null;
  lastBoot: string | null;
  lastReboot: string | null;
  lastFactoryReset: string | null;
  acsStatus: string;
}

export interface PonStatusDto {
  ponStatus: string;
  oltVendor: string;
  oltModel: string;
  opticalRx: number;
  opticalTx: number;
  distance: number;
  temperature: number;
  voltage: number;
  oltId: string;
}

export interface ConnectedHostExtendedDto {
  id: string;
  hostname: string;
  ipAddress: string;
  macAddress: string;
  interface: string;
  band?: string;
  leaseExpiry?: string;
  vendor: string;
  status: 'online' | 'offline';
  rssi?: number;
}
