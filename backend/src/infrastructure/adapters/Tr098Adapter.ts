import {
  TR098_ROOT,
  TR098_DEVICE_INFO,
  TR098_MANAGEMENT_SERVER,
  TR098_LAN,
} from '@aerobrry/shared';
import type { IDataModelAdapter } from '../../domain/adapters/IDataModelAdapter.js';
import type { CwmpParameterValue } from '@aerobrry/shared';
import { prisma } from '../../infrastructure/database/prisma.js';
import { env, connectionRequestUrl } from '../../config/env.js';
import {
  buildWanTr098Parameters,
  domainValueFromTr098,
  leafToDomainField,
  parseWanTr098Path,
  type WanEntrySource,
  type WanStatsSource,
} from './wanTr098Mapper.js';
import { buildLanTr098Parameters, buildWlanTr098Parameters, type WirelessIfaceSource } from './lanTr098Mapper.js';
import { buildHostsTr098Parameters } from './hostsTr098Mapper.js';
import { buildEthernetTr098Parameters } from './ethernetTr098Mapper.js';
import { buildDiagnosticsTr098Parameters } from './diagnosticsTr098Mapper.js';
import { buildSystemTr098Parameters, applySystemTr098Parameter } from './systemTr098Mapper.js';
import { buildIpv6Tr098Parameters, buildWanConnectionIpv6Parameters, applyIpv6Tr098Parameter } from './ipv6Tr098Mapper.js';
import {
  buildWebManagementTr098Parameters,
  loadWebManagementTr098Source,
  applyWebManagementTr098Parameter,
} from './webManagementTr098Mapper.js';
import { buildOpticalTr098Parameters } from './opticalTr098Mapper.js';
import { parseWlanTr098Path, applyWlanTr098Parameter } from './wlanTr098Mapper.js';
import type { CwmpDiagnosticsService } from '../../application/services/CwmpDiagnosticsService.js';

export class Tr098Adapter implements IDataModelAdapter {
  readonly modelName = 'TR-098' as const;

  constructor(private readonly diagnostics?: CwmpDiagnosticsService) {}

  getRootPath(): string {
    return TR098_ROOT;
  }

  async mapDomainToParameters(deviceId: string): Promise<CwmpParameterValue[]> {
    const device = await prisma.virtualDevice.findUnique({
      where: { id: deviceId },
      include: {
        wanConfig: true,
        lanConfig: true,
        wlanConfigs: true,
        cwmpSession: true,
        metrics: true,
      },
    });
    if (!device) return [];

    const [extraInterfaces, wirelessInterfaces, connectedHosts, ntpConfig, ipv6Config, opticalInfo, webTr098] =
      await Promise.all([
      prisma.wanInterface.findMany({ where: { deviceId }, orderBy: { createdAt: 'asc' } }),
      prisma.wirelessInterface.findMany({
        where: { deviceId },
        orderBy: [{ interfaceType: 'asc' }, { band: 'asc' }, { interfaceId: 'asc' }],
      }),
      prisma.connectedHost.findMany({ where: { deviceId }, orderBy: { connectedAt: 'asc' } }),
      prisma.ntpConfig.findUnique({ where: { deviceId } }),
      prisma.ipv6Config.findUnique({ where: { deviceId } }),
      prisma.opticalInfo.findUnique({ where: { deviceId } }),
      loadWebManagementTr098Source(deviceId),
    ]);

    const session = device.cwmpSession;
    const uptime = device.metrics
      ? String(Math.floor((Date.now() - device.metrics.bootTime.getTime()) / 1000))
      : '0';

    const params: CwmpParameterValue[] = [
      { name: TR098_DEVICE_INFO.MANUFACTURER, value: device.manufacturer },
      { name: TR098_DEVICE_INFO.MODEL_NAME, value: device.modelName },
      { name: TR098_DEVICE_INFO.SOFTWARE_VERSION, value: device.softwareVersion },
      { name: TR098_DEVICE_INFO.HARDWARE_VERSION, value: device.hardwareVersion },
      { name: TR098_DEVICE_INFO.SERIAL_NUMBER, value: device.serialNumber },
      { name: TR098_DEVICE_INFO.UPTIME, value: uptime },
    ];

    if (session) {
      params.push(
        { name: TR098_MANAGEMENT_SERVER.URL, value: session.acsUrl },
        { name: TR098_MANAGEMENT_SERVER.USERNAME, value: session.acsUsername },
        { name: TR098_MANAGEMENT_SERVER.PASSWORD, value: session.acsPassword },
        { name: TR098_MANAGEMENT_SERVER.PERIODIC_INFORM_ENABLE, value: String(session.periodicInformEnabled) },
        { name: TR098_MANAGEMENT_SERVER.PERIODIC_INFORM_INTERVAL, value: String(session.periodicInformInterval) },
        { name: TR098_MANAGEMENT_SERVER.CONNECTION_REQUEST_URL, value: connectionRequestUrl },
        { name: TR098_MANAGEMENT_SERVER.CONNECTION_REQUEST_USERNAME, value: env.connectionRequestUsername },
      );
    }

    const wanStats: WanStatsSource = {
      rxBytes: 2_400_000_000,
      txBytes: 890_000_000,
      linkUp: device.wanConfig?.status === 'connected',
    };

    const wanEntries: WanEntrySource[] = [];
    if (device.wanConfig) {
      wanEntries.push({
        kind: 'primary',
        connDeviceIndex: 1,
        name: 'Internet',
        serviceType: 'INTERNET',
        connectionType: device.wanConfig.connectionType,
        enabled: device.wanConfig.enabled,
        status: device.wanConfig.status,
        ipAddress: device.wanConfig.ipAddress,
        subnetMask: device.wanConfig.subnetMask,
        gateway: device.wanConfig.gateway,
        dnsPrimary: device.wanConfig.dnsPrimary,
        dnsSecondary: device.wanConfig.dnsSecondary,
        mtu: device.wanConfig.connectionType === 'PPPoE' ? device.wanConfig.pppoeMtu : device.wanConfig.mtu,
        natEnabled: device.wanConfig.natEnabled,
        vlanEnabled: device.wanConfig.vlanEnabled,
        vlanId: device.wanConfig.vlanId,
        pppoeUsername: device.wanConfig.pppoeUsername,
        pppoePassword: device.wanConfig.pppoePassword,
        pppoeServiceName: device.wanConfig.pppoeServiceName,
        pppoeAcName: device.wanConfig.pppoeAcName,
      });
    }

    extraInterfaces.forEach((iface, idx) => {
      wanEntries.push({
        kind: 'extra',
        connDeviceIndex: idx + 2,
        extraId: iface.id,
        name: iface.name,
        serviceType: iface.serviceType,
        connectionType: iface.connectionType,
        enabled: iface.enabled,
        status: iface.status,
        ipAddress: iface.ipAddress,
        subnetMask: iface.subnetMask,
        gateway: iface.gateway,
        dnsPrimary: iface.dnsPrimary,
        dnsSecondary: iface.dnsSecondary,
        mtu: iface.mtu,
        natEnabled: iface.natEnabled,
        vlanEnabled: iface.vlanEnabled,
        vlanId: iface.vlanId,
        pppoeUsername: iface.pppoeUsername,
        pppoePassword: iface.pppoePassword,
      });
    });

    params.push(...buildWanTr098Parameters(wanEntries, wanStats));

    const ipv6Source = {
      wanEnabled: ipv6Config?.wanEnabled ?? false,
      wanMode: ipv6Config?.wanMode ?? 'auto',
      lanEnabled: ipv6Config?.lanEnabled ?? true,
      lanPrefix: ipv6Config?.lanPrefix ?? 'fd00::/64',
      dhcpv6Enabled: ipv6Config?.dhcpv6Enabled ?? true,
      slaacEnabled: ipv6Config?.slaacEnabled ?? true,
      prefixDelegation: ipv6Config?.prefixDelegation ?? true,
      wanAddress: ipv6Config?.wanAddress ?? '2001:db8:1::2',
      wanGateway: ipv6Config?.wanGateway ?? '2001:db8:1::1',
      wanDns: ipv6Config?.wanDns ?? '2001:db8:1::53',
      prefixLength: ipv6Config?.prefixLength ?? 64,
      wanDnsAuto: device.wanConfig?.dnsAuto ?? true,
      lanDnsPrimary: device.lanConfig?.dnsPrimary ?? '',
      lanDnsSecondary: device.lanConfig?.dnsSecondary ?? '',
    };
    params.push(...buildIpv6Tr098Parameters(ipv6Source));
    for (const entry of wanEntries) {
      const kind = entry.connectionType === 'PPPoE' || entry.connectionType === 'PPP' ? 'ppp' : 'ip';
      params.push(...buildWanConnectionIpv6Parameters(entry.connDeviceIndex, kind, ipv6Source, entry.connectionType));
    }

    if (device.lanConfig) {
      params.push(
        ...buildLanTr098Parameters({
          ipAddress: device.lanConfig.ipAddress,
          subnetMask: device.lanConfig.subnetMask,
          dhcpEnabled: device.lanConfig.dhcpEnabled,
          dhcpRangeStart: device.lanConfig.dhcpRangeStart,
          dhcpRangeEnd: device.lanConfig.dhcpRangeEnd,
          dnsPrimary: device.lanConfig.dnsPrimary,
          dnsSecondary: device.lanConfig.dnsSecondary,
          dnsAuto: device.lanConfig.dnsAuto,
          fallbackDnsPrimary: device.wanConfig?.dnsPrimary,
          fallbackDnsSecondary: device.wanConfig?.dnsSecondary,
        }),
      );
    }

    params.push(
      ...buildSystemTr098Parameters({
        ntpServer1: ntpConfig?.server ?? 'pool.ntp.org',
        ntpServer2: ntpConfig?.serverSecondary ?? 'time.google.com',
        timezone: ntpConfig?.timezone ?? 'UTC',
        wanDnsAuto: device.wanConfig?.dnsAuto ?? true,
        lanDnsAuto: device.lanConfig?.dnsAuto ?? true,
      }),
      ...buildWebManagementTr098Parameters(webTr098),
    );

    if (opticalInfo) {
      params.push(
        ...buildOpticalTr098Parameters({
          rxPowerDbm: opticalInfo.rxPowerDbm,
          txPowerDbm: opticalInfo.txPowerDbm,
          temperature: opticalInfo.temperature,
          ponStatus: opticalInfo.ponStatus,
          oltId: opticalInfo.oltId,
        }),
      );
    }

    const wlanSources: WirelessIfaceSource[] = wirelessInterfaces.map((w, idx) => ({
      index: idx + 1,
      interfaceId: w.interfaceId,
      name: w.name,
      interfaceType: w.interfaceType,
      band: w.band,
      enabled: w.enabled,
      hidden: w.hidden,
      ssid: w.ssid,
      channel: w.channel,
      channelWidth: w.channelWidth,
      security: w.security,
      password: w.password,
      isolated: w.isolated,
      vlanId: w.vlanId,
      bandwidthLimitMbps: w.bandwidthLimitMbps,
      linkStatus: w.linkStatus,
      linkQuality: w.linkQuality,
    }));

    if (wlanSources.length === 0) {
      const wlan24 = device.wlanConfigs.find((w) => w.band === '2.4');
      const wlan5 = device.wlanConfigs.find((w) => w.band === '5');
      if (wlan24) {
        wlanSources.push({
          index: 1,
          interfaceId: 'wlan1',
          name: 'Home 2.4 GHz',
          interfaceType: 'primary',
          band: '2.4',
          enabled: wlan24.enabled,
          hidden: false,
          ssid: wlan24.ssid,
          channel: wlan24.channel,
          channelWidth: wlan24.channelWidth,
          security: wlan24.security,
          password: wlan24.password,
          isolated: false,
          vlanId: null,
          bandwidthLimitMbps: null,
          linkStatus: null,
          linkQuality: null,
        });
      }
      if (wlan5) {
        wlanSources.push({
          index: wlanSources.length + 1,
          interfaceId: 'wlan2',
          name: 'Home 5 GHz',
          interfaceType: 'primary',
          band: '5',
          enabled: wlan5.enabled,
          hidden: false,
          ssid: wlan5.ssid,
          channel: wlan5.channel,
          channelWidth: wlan5.channelWidth,
          security: wlan5.security,
          password: wlan5.password,
          isolated: false,
          vlanId: null,
          bandwidthLimitMbps: null,
          linkStatus: null,
          linkQuality: null,
        });
      }
    }

    params.push(...buildWlanTr098Parameters(wlanSources));
    params.push(
      ...buildHostsTr098Parameters(
        connectedHosts.map((h, idx) => ({
          index: idx + 1,
          macAddress: h.macAddress,
          ipAddress: h.ipAddress,
          hostname: h.hostname,
          interface: h.interface,
          band: h.band,
          rssi: h.rssi,
          leaseExpiry: h.leaseExpiry,
        })),
      ),
    );
    params.push(...buildEthernetTr098Parameters(4));

    if (this.diagnostics) {
      params.push(...buildDiagnosticsTr098Parameters(this.diagnostics.getState(deviceId)));
    }

    return params;
  }

  async applyParameterChanges(deviceId: string, changes: CwmpParameterValue[]): Promise<void> {
    const diagPaths: string[] = [];
    const diagValues = new Map<string, string>();

    for (const { name, value } of changes) {
      if (name.includes('Diagnostics') && this.diagnostics) {
        diagPaths.push(name);
        diagValues.set(name, value);
        continue;
      }

      const wlanParsed = parseWlanTr098Path(name);
      if (wlanParsed) {
        await applyWlanTr098Parameter(deviceId, wlanParsed.index, wlanParsed.field, value);
        continue;
      }

      const wanParsed = parseWanTr098Path(name);
      if (wanParsed) {
        await this.applyWanParameterChange(deviceId, wanParsed.connDeviceIndex, wanParsed.kind, wanParsed.leaf, value);
        continue;
      }

      const systemResult = await applySystemTr098Parameter(deviceId, name, value);
      if (systemResult !== 'unhandled') {
        continue;
      }

      if (await applyIpv6Tr098Parameter(deviceId, name, value)) {
        continue;
      }

      if (await applyWebManagementTr098Parameter(deviceId, name, value)) {
        continue;
      }

      if (name === TR098_LAN.IP_ADDRESS) {
        await prisma.lanConfig.update({ where: { deviceId }, data: { ipAddress: value } });
      } else if (name === TR098_LAN.SUBNET_MASK || name === TR098_LAN.LAN_SUBNET_MASK) {
        await prisma.lanConfig.update({ where: { deviceId }, data: { subnetMask: value } });
      } else if (name === TR098_LAN.DHCP_ENABLE) {
        await prisma.lanConfig.update({
          where: { deviceId },
          data: { dhcpEnabled: value === 'true' || value === '1' },
        });
      } else if (name === TR098_LAN.MIN_ADDRESS) {
        await prisma.lanConfig.update({ where: { deviceId }, data: { dhcpRangeStart: value } });
      } else if (name === TR098_LAN.MAX_ADDRESS) {
        await prisma.lanConfig.update({ where: { deviceId }, data: { dhcpRangeEnd: value } });
      }
    }

    if (diagPaths.length && this.diagnostics) {
      this.diagnostics.applyParameterChanges(deviceId, diagPaths, diagValues);
    }
  }

  private async applyWanParameterChange(
    deviceId: string,
    connDeviceIndex: number,
    kind: 'ppp' | 'ip',
    leaf: string,
    value: string,
  ): Promise<void> {
    const field = leafToDomainField(kind, leaf);
    if (!field) return;

    const isPrimary = connDeviceIndex === 1;
    const mapped = domainValueFromTr098(field, value);

    if (field === 'dnsServers' && typeof mapped === 'string') {
      const dns = JSON.parse(mapped) as { dnsPrimary: string; dnsSecondary: string };
      if (isPrimary) {
        await prisma.wanConfig.update({
          where: { deviceId },
          data: { dnsPrimary: dns.dnsPrimary, dnsSecondary: dns.dnsSecondary, dnsAuto: false },
        });
      } else {
        const iface = await this.findExtraInterfaceByConnIndex(deviceId, connDeviceIndex);
        if (iface) {
          await prisma.wanInterface.update({
            where: { id: iface.id },
            data: { dnsPrimary: dns.dnsPrimary, dnsSecondary: dns.dnsSecondary },
          });
        }
      }
      return;
    }

    const data: Record<string, unknown> = {};
    if (field === 'enabled') data.enabled = mapped as boolean;
    else if (field === 'natEnabled') data.natEnabled = mapped as boolean;
    else if (field === 'vlanEnabled') data.vlanEnabled = mapped as boolean;
    else if (field === 'mtu') data.mtu = mapped as number;
    else if (field === 'vlanId') data.vlanId = mapped as number;
    else if (field === 'status') data.status = mapped as string;
    else if (field === 'connectionType') data.connectionType = mapped as string;
    else if (field === 'name' && !isPrimary) data.name = mapped as string;
    else if (field === 'pppoeUsername') data.pppoeUsername = mapped as string;
    else if (field === 'pppoePassword') data.pppoePassword = mapped as string;
    else if (field === 'pppoeServiceName' && isPrimary) data.pppoeServiceName = mapped as string;
    else if (field === 'pppoeAcName' && isPrimary) data.pppoeAcName = mapped as string;
    else if (field === 'ipAddress') data.ipAddress = mapped as string;
    else if (field === 'subnetMask') data.subnetMask = mapped as string;
    else if (field === 'gateway') data.gateway = mapped as string;

    if (Object.keys(data).length === 0) return;

    if (isPrimary) {
      await prisma.wanConfig.update({ where: { deviceId }, data });
    } else {
      const iface = await this.findExtraInterfaceByConnIndex(deviceId, connDeviceIndex);
      if (iface) {
        await prisma.wanInterface.update({ where: { id: iface.id }, data });
      }
    }
  }

  private async findExtraInterfaceByConnIndex(deviceId: string, connDeviceIndex: number) {
    const extras = await prisma.wanInterface.findMany({
      where: { deviceId },
      orderBy: { createdAt: 'asc' },
    });
    return extras[connDeviceIndex - 2] ?? null;
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

  async applyParameterChanges(_deviceId: string, _changes: CwmpParameterValue[]): Promise<void> {
    // TR-181 not implemented in v1
  }
}
