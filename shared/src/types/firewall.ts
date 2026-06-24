export type FirewallDirection = 'inbound' | 'outbound';
export type FirewallProtocol = 'TCP' | 'UDP' | 'ICMP' | 'ANY';
export type FirewallAction = 'allow' | 'deny';

export interface FirewallRule {
  id: string;
  deviceId: string;
  name: string;
  direction: FirewallDirection;
  protocol: FirewallProtocol;
  sourceIp: string;
  destIp: string;
  sourcePort: string;
  destPort: string;
  action: FirewallAction;
  enabled: boolean;
}

export interface PortForward {
  id: string;
  deviceId: string;
  name: string;
  externalPort: number;
  internalIp: string;
  internalPort: number;
  protocol: 'TCP' | 'UDP' | 'BOTH';
  enabled: boolean;
}

export interface DmzConfig {
  deviceId: string;
  enabled: boolean;
  hostIp: string;
}
