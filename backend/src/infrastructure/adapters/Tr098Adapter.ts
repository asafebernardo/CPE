import {
  TR098_ROOT,
  TR098_DEVICE_INFO,
  TR098_MANAGEMENT_SERVER,
  TR098_WAN,
  TR098_LAN,
  TR098_WLAN,
  TR098_WLAN_24_INDEX,
  TR098_WLAN_5_INDEX,
} from '@routergui/shared';
import type { IDataModelAdapter } from '../../domain/adapters/IDataModelAdapter.js';
import type { CwmpParameterValue } from '@routergui/shared';
import { prisma } from '../../infrastructure/database/prisma.js';

export class Tr098Adapter implements IDataModelAdapter {
  readonly modelName = 'TR-098' as const;

  getRootPath(): string {
    return TR098_ROOT;
  }

  async mapDomainToParameters(deviceId: string): Promise<CwmpParameterValue[]> {
    const device = await prisma.virtualDevice.findUnique({
      where: { id: deviceId },
      include: { wanConfig: true, lanConfig: true, wlanConfigs: true, cwmpSession: true },
    });
    if (!device) return [];

    const wlan24 = device.wlanConfigs.find((w) => w.band === '2.4');
    const wlan5 = device.wlanConfigs.find((w) => w.band === '5');
    const session = device.cwmpSession;

    const params: CwmpParameterValue[] = [
      { name: TR098_DEVICE_INFO.MANUFACTURER, value: device.manufacturer },
      { name: TR098_DEVICE_INFO.MODEL_NAME, value: device.modelName },
      { name: TR098_DEVICE_INFO.SOFTWARE_VERSION, value: device.softwareVersion },
      { name: TR098_DEVICE_INFO.HARDWARE_VERSION, value: device.hardwareVersion },
      { name: TR098_DEVICE_INFO.SERIAL_NUMBER, value: device.serialNumber },
    ];

    if (session) {
      params.push(
        { name: TR098_MANAGEMENT_SERVER.URL, value: session.acsUrl },
        { name: TR098_MANAGEMENT_SERVER.USERNAME, value: session.acsUsername },
        { name: TR098_MANAGEMENT_SERVER.PASSWORD, value: session.acsPassword },
        { name: TR098_MANAGEMENT_SERVER.PERIODIC_INFORM_ENABLE, value: String(session.periodicInformEnabled) },
        { name: TR098_MANAGEMENT_SERVER.PERIODIC_INFORM_INTERVAL, value: String(session.periodicInformInterval) },
      );
    }

    if (device.wanConfig) {
      params.push(
        { name: TR098_WAN.CONNECTION_TYPE, value: device.wanConfig.connectionType },
        { name: TR098_WAN.EXTERNAL_IP, value: device.wanConfig.ipAddress },
        { name: TR098_WAN.SUBNET_MASK, value: device.wanConfig.subnetMask },
        { name: TR098_WAN.DEFAULT_GATEWAY, value: device.wanConfig.gateway },
        { name: TR098_WAN.DNS_SERVERS, value: `${device.wanConfig.dnsPrimary},${device.wanConfig.dnsSecondary}` },
      );
    }

    if (device.lanConfig) {
      params.push(
        { name: TR098_LAN.IP_ADDRESS, value: device.lanConfig.ipAddress },
        { name: TR098_LAN.SUBNET_MASK, value: device.lanConfig.subnetMask },
        { name: TR098_LAN.DHCP_ENABLE, value: String(device.lanConfig.dhcpEnabled) },
        { name: TR098_LAN.MIN_ADDRESS, value: device.lanConfig.dhcpRangeStart },
        { name: TR098_LAN.MAX_ADDRESS, value: device.lanConfig.dhcpRangeEnd },
      );
    }

    if (wlan24) {
      const p = TR098_WLAN.wlan24(TR098_WLAN_24_INDEX);
      params.push(
        { name: p.ENABLE, value: String(wlan24.enabled) },
        { name: p.SSID, value: wlan24.ssid },
        { name: p.CHANNEL, value: String(wlan24.channel) },
        { name: p.BEACON_TYPE, value: wlan24.security },
        { name: p.KEY_PASSPHRASE, value: wlan24.password },
      );
    }

    if (wlan5) {
      const p = TR098_WLAN.wlan24(TR098_WLAN_5_INDEX);
      params.push(
        { name: p.ENABLE, value: String(wlan5.enabled) },
        { name: p.SSID, value: wlan5.ssid },
        { name: p.CHANNEL, value: String(wlan5.channel) },
        { name: p.BEACON_TYPE, value: wlan5.security },
        { name: p.KEY_PASSPHRASE, value: wlan5.password },
      );
    }

    return params;
  }

  async applyParameterChanges(deviceId: string, paths: string[]): Promise<void> {
    const params = await prisma.tr098Parameter.findMany({
      where: { deviceId, path: { in: paths } },
    });

    for (const param of params) {
      if (param.path === TR098_WAN.CONNECTION_TYPE) {
        await prisma.wanConfig.update({ where: { deviceId }, data: { connectionType: param.value } });
      } else if (param.path === TR098_WAN.EXTERNAL_IP) {
        await prisma.wanConfig.update({ where: { deviceId }, data: { ipAddress: param.value } });
      } else if (param.path === TR098_WAN.SUBNET_MASK) {
        await prisma.wanConfig.update({ where: { deviceId }, data: { subnetMask: param.value } });
      } else if (param.path === TR098_WAN.DEFAULT_GATEWAY) {
        await prisma.wanConfig.update({ where: { deviceId }, data: { gateway: param.value } });
      } else if (param.path === TR098_LAN.IP_ADDRESS) {
        await prisma.lanConfig.update({ where: { deviceId }, data: { ipAddress: param.value } });
      } else if (param.path === TR098_LAN.SUBNET_MASK) {
        await prisma.lanConfig.update({ where: { deviceId }, data: { subnetMask: param.value } });
      } else if (param.path === TR098_MANAGEMENT_SERVER.URL) {
        await prisma.cwmpSession.update({ where: { deviceId }, data: { acsUrl: param.value } });
      }
    }
  }
}

/** Stub for future TR-181 implementation */
export class Tr181Adapter implements IDataModelAdapter {
  readonly modelName = 'TR-181' as const;

  getRootPath(): string {
    return 'Device';
  }

  async mapDomainToParameters(_deviceId: string): Promise<CwmpParameterValue[]> {
    return [];
  }

  async applyParameterChanges(_deviceId: string, _paths: string[]): Promise<void> {
    // TR-181 not implemented in v1
  }
}
