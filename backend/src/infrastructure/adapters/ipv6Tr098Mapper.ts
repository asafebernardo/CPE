import { TR098_IPV6, TR098_X_ROUTERGUI, tr098WanIpv6Leaves, type CwmpParameterValue } from '@aerobrry/shared';
import { prisma } from '../../infrastructure/database/prisma.js';

export interface Ipv6Tr098Source {
  wanEnabled: boolean;
  wanMode: string;
  lanEnabled: boolean;
  lanPrefix: string;
  dhcpv6Enabled: boolean;
  slaacEnabled: boolean;
  prefixDelegation: boolean;
  wanAddress: string;
  wanGateway: string;
  wanDns: string;
  prefixLength: number;
  wanDnsAuto: boolean;
  lanDnsPrimary: string;
  lanDnsSecondary: string;
}

export function buildIpv6Tr098Parameters(source: Ipv6Tr098Source): CwmpParameterValue[] {
  const lanDns = [source.lanDnsPrimary, source.lanDnsSecondary].filter(Boolean).join(',');
  return [
    { name: TR098_X_ROUTERGUI.IPV6_ENABLED, value: String(source.wanEnabled) },
    { name: TR098_IPV6.LAN_ENABLED, value: String(source.lanEnabled) },
    { name: TR098_IPV6.LAN_PREFIX, value: source.lanPrefix },
    { name: TR098_IPV6.LAN_DNS_SERVERS, value: lanDns || source.wanDns },
    { name: TR098_IPV6.LAN_DHCPV6_ENABLED, value: String(source.dhcpv6Enabled) },
    { name: TR098_IPV6.LAN_SLAAC_ENABLED, value: String(source.slaacEnabled) },
    { name: TR098_IPV6.LAN_PREFIX_DELEGATION, value: String(source.prefixDelegation) },
    { name: TR098_IPV6.WAN_MODE, value: source.wanMode },
    { name: TR098_IPV6.WAN_ADDRESS, value: source.wanAddress },
    { name: TR098_IPV6.WAN_GATEWAY, value: source.wanGateway },
    { name: TR098_IPV6.WAN_DNS, value: source.wanDns },
    { name: TR098_IPV6.WAN_PREFIX_LENGTH, value: String(source.prefixLength) },
    { name: TR098_IPV6.WAN_DNS_AUTO, value: String(source.wanDnsAuto) },
  ];
}

export function buildWanConnectionIpv6Parameters(
  connDeviceIndex: number,
  kind: 'ip' | 'ppp',
  source: Ipv6Tr098Source,
  connectionType: string,
): CwmpParameterValue[] {
  const leaves = tr098WanIpv6Leaves(connDeviceIndex, kind);
  const accessMode =
    connectionType === 'PPPoE' || connectionType === 'PPP'
      ? 'PPPoE'
      : connectionType === 'Static'
        ? 'Static'
        : 'IPoE';
  return [
    { name: leaves.ENABLED, value: String(source.wanEnabled) },
    { name: leaves.ADDRESS, value: source.wanAddress },
    { name: leaves.GATEWAY, value: source.wanGateway },
    { name: leaves.DNS_SERVERS, value: source.wanDns },
    { name: leaves.PREFIX_LENGTH, value: String(source.prefixLength) },
    { name: leaves.ACCESS_MODE, value: accessMode },
  ];
}

function parseBool(value: string): boolean {
  return value === 'true' || value === '1';
}

function parseDnsList(value: string): { primary: string; secondary: string } {
  const parts = value.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
  return { primary: parts[0] ?? '', secondary: parts[1] ?? '' };
}

export async function applyIpv6Tr098Parameter(
  deviceId: string,
  path: string,
  value: string,
): Promise<boolean> {
  const data: Record<string, unknown> = {};

  if (path === TR098_X_ROUTERGUI.IPV6_ENABLED) data.wanEnabled = parseBool(value);
  else if (path === TR098_IPV6.LAN_ENABLED) data.lanEnabled = parseBool(value);
  else if (path === TR098_IPV6.LAN_PREFIX) data.lanPrefix = value;
  else if (path === TR098_IPV6.LAN_DNS_SERVERS) {
    const dns = parseDnsList(value);
    await prisma.lanConfig.update({
      where: { deviceId },
      data: { dnsPrimary: dns.primary, dnsSecondary: dns.secondary },
    });
    return true;
  } else if (path === TR098_IPV6.LAN_DHCPV6_ENABLED) data.dhcpv6Enabled = parseBool(value);
  else if (path === TR098_IPV6.LAN_SLAAC_ENABLED) data.slaacEnabled = parseBool(value);
  else if (path === TR098_IPV6.LAN_PREFIX_DELEGATION) data.prefixDelegation = parseBool(value);
  else if (path === TR098_IPV6.WAN_MODE) data.wanMode = value;
  else if (path === TR098_IPV6.WAN_ADDRESS) data.wanAddress = value;
  else if (path === TR098_IPV6.WAN_GATEWAY) data.wanGateway = value;
  else if (path === TR098_IPV6.WAN_DNS) data.wanDns = value;
  else if (path === TR098_IPV6.WAN_PREFIX_LENGTH) data.prefixLength = parseInt(value, 10) || 64;
  else if (path === TR098_IPV6.WAN_DNS_AUTO) {
    await prisma.wanConfig.update({ where: { deviceId }, data: { dnsAuto: parseBool(value) } });
    return true;
  } else {
    const wanMatch = path.match(
      /^InternetGatewayDevice\.WANDevice\.1\.WANConnectionDevice\.(\d+)\.WAN(?:IP|PPP)Connection\.1\.X_RouterGui_(IPv6Enabled|IPv6Address|IPv6Gateway|IPv6DNSServers|IPv6PrefixLength)$/,
    );
    if (!wanMatch) return false;
    const leaf = wanMatch[2];
    if (leaf === 'IPv6Enabled') data.wanEnabled = parseBool(value);
    else if (leaf === 'IPv6Address') data.wanAddress = value;
    else if (leaf === 'IPv6Gateway') data.wanGateway = value;
    else if (leaf === 'IPv6DNSServers') data.wanDns = value;
    else if (leaf === 'IPv6PrefixLength') data.prefixLength = parseInt(value, 10) || 64;
  }

  if (Object.keys(data).length === 0) return false;
  await prisma.ipv6Config.upsert({
    where: { deviceId },
    create: { deviceId, ...data },
    update: data,
  });
  return true;
}
