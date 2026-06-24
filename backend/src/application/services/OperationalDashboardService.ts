import type {
  OperationalDashboardResponse,
  LedIndicatorDto,
  Tr069EventDto,
  Tr069ManagementDto,
  Tr098ParameterNodeDto,
  PonStatusDto,
  ConnectedHostExtendedDto,
} from '@routergui/shared';
import { TR098_MANAGEMENT_SERVER } from '@routergui/shared';
import type { IDeviceRepository } from '../../domain/repositories/IDeviceRepository.js';
import type { ParameterTreeService } from './ParameterTreeService.js';
import { prisma } from '../../infrastructure/database/prisma.js';

const VENDOR_MAP: Record<string, string> = {
  'AA:BB': 'RouterGui',
  '00:1A': 'Intelbras',
  'B8:27': 'Raspberry',
};

export class OperationalDashboardService {
  private bytesSent = 1_250_000_000;
  private bytesReceived = 4_800_000_000;

  constructor(
    private readonly deviceRepo: IDeviceRepository,
    private readonly parameterTree?: ParameterTreeService,
  ) {}

  async getOperationalDashboard(deviceId: string): Promise<OperationalDashboardResponse> {
    const device = await prisma.virtualDevice.findUnique({ where: { id: deviceId } });
    const wan = await prisma.wanConfig.findUnique({ where: { deviceId } });
    const lan = await prisma.lanConfig.findUnique({ where: { deviceId } });
    const wlans = await prisma.wlanConfig.findMany({ where: { deviceId } });
    const metrics = await this.deviceRepo.getMetrics(deviceId);
    const session = await prisma.cwmpSession.findUnique({ where: { deviceId } });
    const hosts = await prisma.connectedHost.findMany({ where: { deviceId } });
    const optical = await prisma.opticalInfo.findUnique({ where: { deviceId } });

    const uptime = metrics ? Math.floor((Date.now() - metrics.bootTime.getTime()) / 1000) : 0;
    this.bytesSent += Math.floor(Math.random() * 50000);
    this.bytesReceived += Math.floor(Math.random() * 120000);

    const wlan24 = wlans.find((w) => w.band === '2.4');
    const wlan5 = wlans.find((w) => w.band === '5');
    const wifi24Clients = hosts.filter((h) => h.band === '2.4').length;
    const wifi5Clients = hosts.filter((h) => h.band === '5').length;
    const lanClients = hosts.filter((h) => h.interface === 'lan').length;

    const wanConnected = wan?.status === 'connected';
    const nextInform =
      session?.lastInform && session.periodicInformEnabled
        ? new Date(session.lastInform.getTime() + session.periodicInformInterval * 1000).toISOString()
        : null;

    const leds = this.buildLeds({
      wanConnected,
      ponRegistered: optical?.ponStatus === 'registered',
      lanClients,
      wifi24Clients,
      wifi5Clients,
      wlan24Enabled: wlan24?.enabled ?? false,
      wlan5Enabled: wlan5?.enabled ?? false,
      acsConfigured: Boolean(session?.acsUrl),
      acsSessionActive: session?.sessionState === 'active',
    });

    return {
      updatedAt: new Date().toISOString(),
      internet: { status: wanConnected ? 'online' : 'offline' },
      wan: {
        connectionType: wan?.connectionType ?? 'DHCP',
        ipAddress: wan?.ipAddress ?? '',
        gateway: wan?.gateway ?? '',
        bytesSent: this.bytesSent,
        bytesReceived: this.bytesReceived,
        status: wanConnected ? 'connected' : 'disconnected',
      },
      lan: {
        ipAddress: lan?.ipAddress ?? '',
        dhcpEnabled: lan?.dhcpEnabled ?? false,
        hostCount: hosts.length,
        status: 'active',
      },
      wifi: {
        clients24: wifi24Clients,
        clients5: wifi5Clients,
        ssid24: wlan24?.ssid ?? '',
        ssid5: wlan5?.ssid ?? '',
        status24: wlan24?.enabled ? 'active' : 'disabled',
        status5: wlan5?.enabled ? 'active' : 'disabled',
      },
      acs: {
        url: session?.acsUrl ?? '',
        configured: Boolean(session?.acsUrl),
        status: session?.sessionState ?? 'idle',
        lastInform: session?.lastInform?.toISOString() ?? null,
        nextInform,
        periodicInformInterval: session?.periodicInformInterval ?? 300,
      },
      system: {
        cpuUsage: metrics?.cpuUsage ?? 25,
        memoryUsage: metrics?.memoryUsage ?? 55,
        uptime,
      },
      topology: {
        internetOnline: wanConnected,
        wanStatus: wanConnected ? 'connected' : 'disconnected',
        lanStatus: 'active',
        wifi24Status: wlan24?.enabled ? 'active' : 'disabled',
        wifi5Status: wlan5?.enabled ? 'active' : 'disabled',
        lanClientCount: lanClients,
        wifi24ClientCount: wifi24Clients,
        wifi5ClientCount: wifi5Clients,
      },
      leds,
      device: {
        manufacturer: device?.manufacturer ?? 'RouterGui',
        modelName: device?.modelName ?? 'RGX-5000',
        osName: device?.osName ?? 'RGOS',
        softwareVersion: device?.softwareVersion ?? '1.0.0',
        hardwareVersion: device?.hardwareVersion ?? 'RGX-HW-A1',
        serialNumber: device?.serialNumber ?? '',
        uptime,
      },
    };
  }

  private buildLeds(ctx: {
    wanConnected: boolean;
    ponRegistered: boolean;
    lanClients: number;
    wifi24Clients: number;
    wifi5Clients: number;
    wlan24Enabled: boolean;
    wlan5Enabled: boolean;
    acsConfigured: boolean;
    acsSessionActive: boolean;
  }): LedIndicatorDto[] {
    const lanLed = (n: number) => (ctx.lanClients >= n ? 'on' : 'off') as LedIndicatorDto['state'];
    return [
      { id: 'power', label: 'POWER', state: 'on' },
      { id: 'pon', label: 'PON', state: ctx.ponRegistered ? 'on' : 'error' },
      { id: 'wan', label: 'WAN', state: ctx.wanConnected ? 'on' : 'error' },
      { id: 'lan1', label: 'LAN1', state: lanLed(1) },
      { id: 'lan2', label: 'LAN2', state: lanLed(2) },
      { id: 'lan3', label: 'LAN3', state: lanLed(3) },
      { id: 'lan4', label: 'LAN4', state: lanLed(4) },
      { id: 'wifi24', label: '2.4G', state: ctx.wlan24Enabled ? (ctx.wifi24Clients > 0 ? 'on' : 'blink') : 'off' },
      { id: 'wifi5', label: '5G', state: ctx.wlan5Enabled ? (ctx.wifi5Clients > 0 ? 'on' : 'blink') : 'off' },
      { id: 'tr069', label: 'TR069', state: ctx.acsSessionActive ? 'blink' : ctx.acsConfigured ? 'on' : 'off' },
    ];
  }

  async getTr069Management(deviceId: string): Promise<Tr069ManagementDto> {
    const session = await prisma.cwmpSession.findUnique({ where: { deviceId } });
    const metrics = await this.deviceRepo.getMetrics(deviceId);
    const bootLogs = await prisma.logEntry.findMany({
      where: { deviceId, type: { in: ['INFORM', 'SYSTEM', 'ACS_COMMAND'] } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const lastReboot = bootLogs.find((l) => l.message.includes('Reboot'))?.createdAt;
    const lastFactoryReset = bootLogs.find((l) => l.message.includes('Factory'))?.createdAt;
    const lastBoot = metrics?.bootTime.toISOString() ?? null;
    const nextInform =
      session?.lastInform && session.periodicInformEnabled
        ? new Date(session.lastInform.getTime() + session.periodicInformInterval * 1000).toISOString()
        : null;

    const crUrl = await prisma.tr098Parameter.findUnique({
      where: { deviceId_path: { deviceId, path: TR098_MANAGEMENT_SERVER.CONNECTION_REQUEST_URL } },
    });

    return {
      url: session?.acsUrl ?? '',
      username: session?.acsUsername ?? '',
      password: session?.acsPassword ?? '',
      periodicInformEnabled: session?.periodicInformEnabled ?? false,
      periodicInformInterval: session?.periodicInformInterval ?? 300,
      cwmpVersion: '1.0',
      connectionRequestUrl: crUrl?.value ?? '',
      connectionRequestUsername: '',
      connectionRequestPassword: '',
      lastInform: session?.lastInform?.toISOString() ?? null,
      nextInform,
      lastBoot,
      lastReboot: lastReboot?.toISOString() ?? null,
      lastFactoryReset: lastFactoryReset?.toISOString() ?? null,
      acsStatus: session?.sessionState ?? 'idle',
    };
  }

  async getTr069Events(deviceId: string, search?: string): Promise<Tr069EventDto[]> {
    const logs = await prisma.logEntry.findMany({
      where: {
        deviceId,
        type: { in: ['INFORM', 'ACS_COMMAND', 'SYSTEM'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const events: Tr069EventDto[] = logs.map((l) => {
      let event = 'SYSTEM';
      let code = 'M';
      if (l.type === 'INFORM') {
        event = 'INFORM';
        code = l.message.includes('PERIODIC') ? '2 PERIODIC' : l.message.includes('BOOT') ? '0 BOOT' : '1 EVENT';
      } else if (l.message.includes('Reboot')) {
        event = 'REBOOT';
        code = 'M Reboot';
      } else if (l.message.includes('Factory')) {
        event = 'FACTORY RESET';
        code = 'M Reset';
      } else if (l.message.includes('GetParameter')) {
        event = 'ACS COMMAND';
        code = 'GetParameterValues';
      } else if (l.message.includes('SetParameter')) {
        event = 'ACS COMMAND';
        code = 'SetParameterValues';
      }
      return {
        id: l.id,
        timestamp: l.createdAt.toISOString(),
        event,
        code,
        result: 'Success',
        details: l.details ?? undefined,
      };
    });

    if (search) {
      const q = search.toLowerCase();
      return events.filter((e) => e.event.toLowerCase().includes(q) || e.code.toLowerCase().includes(q));
    }
    return events;
  }

  async getParameterTree(deviceId: string, search?: string): Promise<Tr098ParameterNodeDto[]> {
    const params = await prisma.tr098Parameter.findMany({
      where: { deviceId },
      orderBy: { path: 'asc' },
    });

    if (search) {
      const q = search.toLowerCase();
      return params
        .filter((p) => p.path.toLowerCase().includes(q))
        .map((p) => ({
          id: p.id,
          path: p.path,
          name: p.path.split('.').pop() ?? p.path,
          value: p.value,
          type: p.type,
          writable: p.writable,
          notification: p.notification,
          description: `TR-098 parameter ${p.path}`,
        }));
    }

    return this.buildTree(params);
  }

  private buildTree(
    params: Array<{ id: string; path: string; value: string; type: string; writable: boolean; notification: number }>,
  ): Tr098ParameterNodeDto[] {
    const root: Tr098ParameterNodeDto[] = [];
    const map = new Map<string, Tr098ParameterNodeDto>();

    for (const p of params) {
      const parts = p.path.split('.');
      let currentPath = '';
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const parentPath = currentPath;
        currentPath = currentPath ? `${currentPath}.${part}` : part;
        if (!map.has(currentPath)) {
          const isLeaf = i === parts.length - 1;
          const node: Tr098ParameterNodeDto = {
            id: isLeaf ? p.id : currentPath,
            path: currentPath,
            name: part,
            value: isLeaf ? p.value : '',
            type: isLeaf ? p.type : 'object',
            writable: isLeaf ? p.writable : false,
            notification: isLeaf ? p.notification : 0,
            description: isLeaf ? `TR-098 ${currentPath}` : undefined,
            children: isLeaf ? undefined : [],
          };
          map.set(currentPath, node);
          if (parentPath) {
            const parent = map.get(parentPath);
            if (parent?.children) parent.children.push(node);
          } else {
            root.push(node);
          }
        }
      }
    }
    return root;
  }

  async updateParameter(deviceId: string, path: string, value: string) {
    if (!this.parameterTree) throw new Error('Parameter tree not available');
    await this.parameterTree.setParameterValues(deviceId, [{ name: path, value }]);
  }

  async getPonStatus(deviceId: string): Promise<PonStatusDto> {
    const optical = await prisma.opticalInfo.findUnique({ where: { deviceId } });
    return {
      ponStatus: optical?.ponStatus ?? 'registered',
      oltVendor: 'RouterGui OLT',
      oltModel: 'RG-OLT-8000',
      opticalRx: optical?.rxPowerDbm ?? -18.5,
      opticalTx: optical?.txPowerDbm ?? 2.1,
      distance: 1250 + Math.floor(Math.random() * 50),
      temperature: optical?.temperature ?? 42,
      voltage: 3.3,
      oltId: optical?.oltId ?? 'OLT-001',
    };
  }

  async getExtendedHosts(deviceId: string): Promise<ConnectedHostExtendedDto[]> {
    const hosts = await prisma.connectedHost.findMany({ where: { deviceId }, orderBy: { hostname: 'asc' } });
    return hosts.map((h) => ({
      id: h.id,
      hostname: h.hostname,
      ipAddress: h.ipAddress,
      macAddress: h.macAddress,
      interface: h.interface,
      band: h.band ?? undefined,
      leaseExpiry: h.leaseExpiry?.toISOString(),
      vendor: VENDOR_MAP[h.macAddress.substring(0, 5)] ?? 'Unknown',
      status: 'online',
      rssi: h.rssi ?? undefined,
    }));
  }
}
