import {
  TR098_WAN_DEVICE,
  tr098WanConnectionDevice,
  type CwmpParameterValue,
} from '@routergui/shared';

const DEFAULT_MAC = '00:1A:2B:3C:4D:5E';

export interface WanEntrySource {
  kind: 'primary' | 'extra';
  connDeviceIndex: number;
  name: string;
  serviceType: string;
  connectionType: string;
  enabled: boolean;
  status: string;
  ipAddress: string;
  subnetMask: string;
  gateway: string;
  dnsPrimary: string;
  dnsSecondary: string;
  mtu: number;
  natEnabled: boolean;
  vlanEnabled: boolean;
  vlanId: number;
  pppoeUsername: string | null;
  pppoePassword: string | null;
  pppoeServiceName?: string;
  pppoeAcName?: string;
  extraId?: string;
}

export interface WanStatsSource {
  rxBytes: number;
  txBytes: number;
  linkUp: boolean;
}

function isPppConnection(connectionType: string): boolean {
  return connectionType === 'PPPoE' || connectionType === 'PPP';
}

function connectionStatus(enabled: boolean, status: string): string {
  if (!enabled) return 'Disconnected';
  return status === 'connected' ? 'Connected' : 'Disconnected';
}

function mapAddressingType(connectionType: string): string {
  if (connectionType === 'Static') return 'Static';
  if (connectionType === 'Bridge') return 'Static';
  return 'DHCP';
}

function mapIpConnectionType(connectionType: string): string {
  if (connectionType === 'Bridge') return 'IP_Bridged';
  return 'IP_Routed';
}

export function buildWanTr098Parameters(
  entries: WanEntrySource[],
  stats?: WanStatsSource,
): CwmpParameterValue[] {
  const wanCommon = TR098_WAN_DEVICE.wanCommon();
  const wanEth = TR098_WAN_DEVICE.wanEthernet();

  const params: CwmpParameterValue[] = [
    { name: TR098_WAN_DEVICE.WAN_DEVICE_NUMBER_OF_ENTRIES, value: '1' },
    { name: TR098_WAN_DEVICE.WAN_CONNECTION_NUMBER_OF_ENTRIES(), value: String(entries.length) },
    { name: wanCommon.ENABLED_FOR_INTERNET, value: 'true' },
    { name: wanCommon.WAN_ACCESS_TYPE, value: 'Ethernet' },
    { name: wanCommon.PHYSICAL_LINK_STATUS, value: stats?.linkUp !== false ? 'Up' : 'Down' },
    { name: wanCommon.TOTAL_BYTES_RECEIVED, value: String(stats?.rxBytes ?? 0) },
    { name: wanCommon.TOTAL_BYTES_SENT, value: String(stats?.txBytes ?? 0) },
    { name: wanEth.ENABLE, value: 'true' },
    { name: wanEth.STATUS, value: stats?.linkUp !== false ? 'Up' : 'NoLink' },
    { name: wanEth.MAC_ADDRESS, value: DEFAULT_MAC },
    { name: wanEth.MAX_BIT_RATE, value: '1000' },
    { name: wanEth.DUPLEX_MODE, value: 'Full' },
  ];

  for (const entry of entries) {
    const cd = tr098WanConnectionDevice(entry.connDeviceIndex);
    const ppp = isPppConnection(entry.connectionType);

    if (ppp) {
      const p = cd.ppp(1);
      params.push(
        { name: cd.PPP_NUMBER_OF_ENTRIES, value: '1' },
        { name: cd.IP_NUMBER_OF_ENTRIES, value: '0' },
        { name: p.ENABLE, value: String(entry.enabled) },
        { name: p.NAME, value: entry.name },
        { name: p.CONNECTION_TYPE, value: 'PPPoE' },
        { name: p.USERNAME, value: entry.pppoeUsername ?? '' },
        { name: p.PASSWORD, value: entry.pppoePassword ?? '' },
        { name: p.CONNECTION_STATUS, value: connectionStatus(entry.enabled, entry.status) },
        { name: p.EXTERNAL_IP, value: entry.ipAddress },
        { name: p.DEFAULT_GATEWAY, value: entry.gateway },
        { name: p.DNS_SERVERS, value: `${entry.dnsPrimary},${entry.dnsSecondary}` },
        { name: p.MAC_ADDRESS, value: DEFAULT_MAC },
        { name: p.NAT_ENABLED, value: String(entry.natEnabled) },
        { name: p.PPPoE_SERVICE_NAME, value: entry.pppoeServiceName ?? '' },
        { name: p.PPPoE_AC_NAME, value: entry.pppoeAcName ?? '' },
        { name: p.MAX_MRU_SIZE, value: String(entry.mtu || 1492) },
        { name: p.X_VLAN_ENABLED, value: String(entry.vlanEnabled) },
        { name: p.X_VLAN_ID, value: String(entry.vlanId) },
        { name: p.X_SERVICE_TYPE, value: entry.serviceType },
      );
    } else {
      const p = cd.ip(1);
      params.push(
        { name: cd.PPP_NUMBER_OF_ENTRIES, value: '0' },
        { name: cd.IP_NUMBER_OF_ENTRIES, value: '1' },
        { name: p.ENABLE, value: String(entry.enabled) },
        { name: p.NAME, value: entry.name },
        { name: p.CONNECTION_TYPE, value: mapIpConnectionType(entry.connectionType) },
        { name: p.ADDRESSING_TYPE, value: mapAddressingType(entry.connectionType) },
        { name: p.CONNECTION_STATUS, value: connectionStatus(entry.enabled, entry.status) },
        { name: p.EXTERNAL_IP, value: entry.ipAddress },
        { name: p.SUBNET_MASK, value: entry.subnetMask },
        { name: p.DEFAULT_GATEWAY, value: entry.gateway },
        { name: p.DNS_SERVERS, value: `${entry.dnsPrimary},${entry.dnsSecondary}` },
        { name: p.MAC_ADDRESS, value: DEFAULT_MAC },
        { name: p.NAT_ENABLED, value: String(entry.natEnabled) },
        { name: p.MAX_MTU_SIZE, value: String(entry.mtu || 1500) },
        { name: p.X_VLAN_ENABLED, value: String(entry.vlanEnabled) },
        { name: p.X_VLAN_ID, value: String(entry.vlanId) },
        { name: p.X_SERVICE_TYPE, value: entry.serviceType },
      );
    }
  }

  return params;
}

export function parseWanTr098Path(path: string): {
  connDeviceIndex: number;
  kind: 'ppp' | 'ip';
  leaf: string;
} | null {
  const ppp = path.match(/WANConnectionDevice\.(\d+)\.WANPPPConnection\.\d+\.(\w+)$/);
  if (ppp) {
    return { connDeviceIndex: parseInt(ppp[1], 10), kind: 'ppp', leaf: ppp[2] };
  }
  const ip = path.match(/WANConnectionDevice\.(\d+)\.WANIPConnection\.\d+\.(\w+)$/);
  if (ip) {
    return { connDeviceIndex: parseInt(ip[1], 10), kind: 'ip', leaf: ip[2] };
  }
  return null;
}

export function leafToDomainField(kind: 'ppp' | 'ip', leaf: string): string | null {
  const map: Record<string, string> = {
    Enable: 'enabled',
    Name: 'name',
    ConnectionType: 'connectionType',
    Username: 'pppoeUsername',
    Password: 'pppoePassword',
    ExternalIPAddress: 'ipAddress',
    SubnetMask: 'subnetMask',
    DefaultGateway: 'gateway',
    DNSServers: 'dnsServers',
    NATEnabled: 'natEnabled',
    PPPoEServiceName: 'pppoeServiceName',
    PPPoEACName: 'pppoeAcName',
    MaxMRUSize: 'mtu',
    MaxMTUSize: 'mtu',
    AddressingType: 'addressingType',
    ConnectionStatus: 'status',
    X_RouterGui_VLANEnabled: 'vlanEnabled',
    X_RouterGui_VLANID: 'vlanId',
  };
  if (kind === 'ppp' && leaf === 'ConnectionType') return 'connectionType';
  if (kind === 'ip' && leaf === 'AddressingType') return 'addressingType';
  return map[leaf] ?? null;
}

export function domainValueFromTr098(
  field: string,
  value: string,
): string | boolean | number | null {
  switch (field) {
    case 'enabled':
    case 'natEnabled':
    case 'vlanEnabled':
      return value === 'true' || value === '1';
    case 'mtu':
    case 'vlanId':
      return parseInt(value, 10) || 0;
    case 'connectionType':
      if (value === 'PPPoE' || value === 'PPP') return 'PPPoE';
      if (value === 'IP_Bridged') return 'Bridge';
      if (value === 'IP_Routed') return 'DHCP';
      return value;
    case 'addressingType':
      return value === 'Static' ? 'Static' : 'DHCP';
    case 'status':
      return value === 'Connected' ? 'connected' : 'disconnected';
    case 'dnsServers': {
      const [primary, secondary] = value.split(',');
      return JSON.stringify({ dnsPrimary: primary ?? '', dnsSecondary: secondary ?? '' });
    }
    default:
      return value;
  }
}
