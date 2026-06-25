import { TR098_LAN, TR098_WLAN, type CwmpParameterValue } from '@routergui/shared';

export interface WirelessIfaceSource {
  index: number;
  interfaceId: string;
  name: string;
  interfaceType: string;
  band: string;
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
  linkStatus: string | null;
  linkQuality: number | null;
}

function mapStandard(band: string): string {
  return band === '5' ? '802.11ac' : '802.11n';
}

function mapBeaconType(security: string): string {
  const s = security.toLowerCase();
  if (s.includes('wpa3')) return 'WPA3';
  if (s.includes('wpa2')) return 'WPA2';
  if (s.includes('wpa')) return 'WPA';
  return 'WPA2';
}

function mapChannelWidth(width: string): string {
  return width.replace(/MHz$/i, '').trim();
}

function mapMaxBitRate(iface: WirelessIfaceSource): string {
  if (iface.bandwidthLimitMbps) return String(iface.bandwidthLimitMbps);
  if (iface.band === '5') return '1200';
  return '300';
}

export function buildWlanTr098Parameters(interfaces: WirelessIfaceSource[]): CwmpParameterValue[] {
  const params: CwmpParameterValue[] = [
    { name: TR098_WLAN.NUMBER_OF_ENTRIES, value: String(interfaces.length) },
  ];

  for (const iface of interfaces) {
    const p = TR098_WLAN.wlan(iface.index);
    params.push(
      { name: p.ENABLE, value: String(iface.enabled) },
      { name: p.RADIO_ENABLED, value: String(iface.enabled) },
      { name: p.SSID, value: iface.ssid },
      { name: p.CHANNEL, value: String(iface.channel) },
      { name: p.STANDARD, value: mapStandard(iface.band) },
      { name: p.BEACON_TYPE, value: mapBeaconType(iface.security) },
      { name: p.WPA_ENCRYPTION, value: 'TKIPandAESEncryption' },
      { name: p.KEY_PASSPHRASE, value: iface.password },
      { name: p.KEY_PASSPHRASE_SHORT, value: iface.password },
      { name: p.SSID_ADVERTISEMENT, value: String(!iface.hidden) },
      { name: p.MAX_BIT_RATE, value: mapMaxBitRate(iface) },
      { name: p.X_BAND, value: iface.band },
      { name: p.X_CHANNEL_WIDTH, value: mapChannelWidth(iface.channelWidth) },
      { name: p.X_INTERFACE_TYPE, value: iface.interfaceType },
      { name: p.X_INTERFACE_ID, value: iface.interfaceId },
      { name: p.X_ISOLATION, value: String(iface.isolated) },
      { name: p.X_VLAN_ID, value: iface.vlanId != null ? String(iface.vlanId) : '' },
      { name: p.X_BANDWIDTH_LIMIT, value: iface.bandwidthLimitMbps != null ? String(iface.bandwidthLimitMbps) : '' },
      { name: p.X_MESH_LINK_STATUS, value: iface.linkStatus ?? '' },
      { name: p.X_MESH_LINK_QUALITY, value: iface.linkQuality != null ? String(iface.linkQuality) : '' },
    );
  }

  return params;
}

export interface LanConfigSource {
  ipAddress: string;
  subnetMask: string;
  dhcpEnabled: boolean;
  dhcpRangeStart: string;
  dhcpRangeEnd: string;
  dnsPrimary?: string;
  dnsSecondary?: string;
  dnsAuto?: boolean;
  fallbackDnsPrimary?: string;
  fallbackDnsSecondary?: string;
}

export function buildLanTr098Parameters(lan: LanConfigSource): CwmpParameterValue[] {
  const useAuto = lan.dnsAuto !== false;
  const dnsPrimary = useAuto ? (lan.fallbackDnsPrimary ?? lan.ipAddress) : (lan.dnsPrimary ?? lan.ipAddress);
  const dnsSecondary = useAuto ? (lan.fallbackDnsSecondary ?? '') : (lan.dnsSecondary ?? '');
  const dns = [dnsPrimary, dnsSecondary].filter(Boolean).join(',');
  return [
    { name: TR098_LAN.IP_ADDRESS, value: lan.ipAddress },
    { name: TR098_LAN.SUBNET_MASK, value: lan.subnetMask },
    { name: TR098_LAN.LAN_SUBNET_MASK, value: lan.subnetMask },
    { name: TR098_LAN.DHCP_ENABLE, value: String(lan.dhcpEnabled) },
    { name: TR098_LAN.MIN_ADDRESS, value: lan.dhcpRangeStart },
    { name: TR098_LAN.MAX_ADDRESS, value: lan.dhcpRangeEnd },
    { name: TR098_LAN.DHCP_SERVER_CONFIGURABLE, value: 'true' },
    { name: TR098_LAN.DHCP_LEASE_TIME, value: '86400' },
    { name: TR098_LAN.DNS_SERVERS, value: dns },
    { name: TR098_LAN.DOMAIN_NAME, value: 'routergui.local' },
    { name: TR098_LAN.IP_Routers, value: lan.ipAddress },
  ];
}
