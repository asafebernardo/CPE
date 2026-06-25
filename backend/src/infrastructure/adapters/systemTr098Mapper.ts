import {
  TR098_TIME,
  TR098_X_ROUTERGUI,
  TR098_MANAGEMENT_SERVER,
  TR098_LAN,
  clampPeriodicInformInterval,
  type CwmpParameterValue,
} from '@routergui/shared';
import { prisma } from '../../infrastructure/database/prisma.js';

export interface SystemTr098Source {
  ntpServer1: string;
  ntpServer2: string;
  timezone: string;
  wanDnsAuto: boolean;
  lanDnsAuto: boolean;
}

export function buildSystemTr098Parameters(source: SystemTr098Source): CwmpParameterValue[] {
  return [
    { name: TR098_TIME.ENABLE, value: 'true' },
    { name: TR098_TIME.NTP_SERVER_1, value: source.ntpServer1 },
    { name: TR098_TIME.NTP_SERVER_2, value: source.ntpServer2 },
    { name: TR098_TIME.LOCAL_TIME_ZONE, value: source.timezone },
    { name: TR098_TIME.STATUS, value: 'Synchronized' },
    { name: TR098_TIME.CURRENT_LOCAL_TIME, value: new Date().toISOString() },
    { name: TR098_X_ROUTERGUI.WAN_DNS_AUTO, value: String(source.wanDnsAuto) },
    { name: TR098_X_ROUTERGUI.LAN_DNS_AUTO, value: String(source.lanDnsAuto) },
  ];
}

function parseBool(value: string): boolean {
  return value === 'true' || value === '1';
}

function parseDnsServers(value: string): { primary: string; secondary: string } {
  const parts = value.split(',').map((s) => s.trim()).filter(Boolean);
  return { primary: parts[0] ?? '', secondary: parts[1] ?? '' };
}

/** Apply ACS SetParameterValues for management, time, DNS mode, IPv6 and web management paths. */
export async function applySystemTr098Parameter(
  deviceId: string,
  path: string,
  value: string,
): Promise<'handled' | 'periodic-inform' | 'unhandled'> {
  if (path === TR098_MANAGEMENT_SERVER.URL) {
    await prisma.cwmpSession.update({ where: { deviceId }, data: { acsUrl: value } });
    return 'handled';
  }
  if (path === TR098_MANAGEMENT_SERVER.USERNAME) {
    await prisma.cwmpSession.update({ where: { deviceId }, data: { acsUsername: value } });
    return 'handled';
  }
  if (path === TR098_MANAGEMENT_SERVER.PASSWORD) {
    await prisma.cwmpSession.update({ where: { deviceId }, data: { acsPassword: value } });
    return 'handled';
  }
  if (path === TR098_MANAGEMENT_SERVER.PERIODIC_INFORM_INTERVAL) {
    await prisma.cwmpSession.update({
      where: { deviceId },
      data: { periodicInformInterval: clampPeriodicInformInterval(parseInt(value, 10) || 300) },
    });
    return 'periodic-inform';
  }
  if (path === TR098_MANAGEMENT_SERVER.PERIODIC_INFORM_ENABLE) {
    await prisma.cwmpSession.update({
      where: { deviceId },
      data: { periodicInformEnabled: parseBool(value) },
    });
    return 'periodic-inform';
  }

  if (path === TR098_TIME.NTP_SERVER_1) {
    await prisma.ntpConfig.upsert({
      where: { deviceId },
      create: { deviceId, server: value },
      update: { server: value },
    });
    return 'handled';
  }
  if (path === TR098_TIME.NTP_SERVER_2) {
    await prisma.ntpConfig.upsert({
      where: { deviceId },
      create: { deviceId, serverSecondary: value },
      update: { serverSecondary: value },
    });
    return 'handled';
  }
  if (path === TR098_TIME.LOCAL_TIME_ZONE) {
    await prisma.ntpConfig.upsert({
      where: { deviceId },
      create: { deviceId, timezone: value },
      update: { timezone: value },
    });
    return 'handled';
  }

  if (path === TR098_LAN.DNS_SERVERS) {
    const dns = parseDnsServers(value);
    await prisma.lanConfig.update({
      where: { deviceId },
      data: { dnsPrimary: dns.primary, dnsSecondary: dns.secondary, dnsAuto: false },
    });
    return 'handled';
  }
  if (path === TR098_X_ROUTERGUI.LAN_DNS_AUTO) {
    await prisma.lanConfig.update({
      where: { deviceId },
      data: { dnsAuto: parseBool(value) },
    });
    return 'handled';
  }
  if (path === TR098_X_ROUTERGUI.WAN_DNS_AUTO) {
    await prisma.wanConfig.update({
      where: { deviceId },
      data: { dnsAuto: parseBool(value) },
    });
    return 'handled';
  }

  if (path === TR098_X_ROUTERGUI.IPV6_ENABLED) {
    await prisma.ipv6Config.upsert({
      where: { deviceId },
      create: { deviceId, wanEnabled: parseBool(value) },
      update: { wanEnabled: parseBool(value) },
    });
    return 'handled';
  }

  return 'unhandled';
}
