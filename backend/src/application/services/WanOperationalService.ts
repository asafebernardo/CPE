import type { EventEmitter } from 'events';
import type {
  WanDashboardDto,
  WanHistoryEventDto,
  WanStatsPayload,
  WanConnectionType,
  WanInterfaceDto,
  WanInterfaceInput,
  WanServiceType,
  WanLinkStatus,
} from '@aerobrry/shared';
import type { IDeviceRepository } from '../../domain/repositories/IDeviceRepository.js';
import type { LogService } from './LogService.js';
import { prisma } from '../../infrastructure/database/prisma.js';

interface RuntimeCounters {
  rxBytes: number;
  txBytes: number;
  rxPackets: number;
  txPackets: number;
  rxErrors: number;
  txErrors: number;
  rxDrops: number;
  txDrops: number;
  latencyMs: number;
  jitterMs: number;
  packetLossPercent: number;
  pppoeSessionStart: Date | null;
}

const FUTURE_TYPES = ['L2TP', 'PPTP', 'IPoE', 'DS-Lite', 'MAP-T', 'MAP-E'] as const;

export class WanOperationalService {
  private counters = new Map<string, RuntimeCounters>();

  constructor(
    private readonly deviceRepo: IDeviceRepository,
    private readonly logService?: LogService,
    private readonly eventBus?: EventEmitter,
  ) {}

  private getCounters(deviceId: string): RuntimeCounters {
    if (!this.counters.has(deviceId)) {
      this.counters.set(deviceId, {
        rxBytes: 2_400_000_000,
        txBytes: 890_000_000,
        rxPackets: 18_500_000,
        txPackets: 9_200_000,
        rxErrors: 12,
        txErrors: 4,
        rxDrops: 28,
        txDrops: 9,
        latencyMs: 18,
        jitterMs: 2,
        packetLossPercent: 0.1,
        pppoeSessionStart: null,
      });
    }
    return this.counters.get(deviceId)!;
  }

  async getDashboard(deviceId: string): Promise<WanDashboardDto> {
    const wanRow = await prisma.wanConfig.findUnique({ where: { deviceId } });
    const ipv6Row = await prisma.ipv6Config.findUnique({ where: { deviceId } });
    const routes = await prisma.staticRoute.findMany({ where: { deviceId }, orderBy: { destination: 'asc' } });
    const session = await prisma.cwmpSession.findUnique({ where: { deviceId } });
    const counters = this.getCounters(deviceId);

    if (!wanRow) throw new Error('WAN config not found');

    const connected = wanRow.enabled && wanRow.status === 'connected';
    const connectedSince = wanRow.connectedSince ?? new Date(Date.now() - 86400 * 1000);
    const uptimeSeconds = connected
      ? Math.floor((Date.now() - connectedSince.getTime()) / 1000)
      : 0;

    const pppoeSessionTime = wanRow.pppoeConnected && counters.pppoeSessionStart
      ? Math.floor((Date.now() - counters.pppoeSessionStart.getTime()) / 1000)
      : wanRow.pppoeConnected
        ? uptimeSeconds
        : 0;

    const nextInform =
      session?.lastInform && session.periodicInformEnabled
        ? new Date(session.lastInform.getTime() + session.periodicInformInterval * 1000).toISOString()
        : null;

    const history = await this.getHistory(deviceId);

    return {
      status: {
        status: connected ? 'connected' : 'disconnected',
        connectionType: wanRow.connectionType as WanConnectionType,
        uptimeSeconds,
        lastReconnect: wanRow.lastReconnect?.toISOString() ?? null,
        connectedSince: connected ? connectedSince.toISOString() : null,
      },
      physicalLink: {
        interface: 'eth0',
        linkStatus: connected ? 'connected' : 'disconnected',
        speedMbps: 1000,
        duplex: 'Full',
      },
      statistics: {
        rxBytes: counters.rxBytes,
        txBytes: counters.txBytes,
        rxPackets: counters.rxPackets,
        txPackets: counters.txPackets,
        rxErrors: counters.rxErrors,
        txErrors: counters.txErrors,
        rxDrops: counters.rxDrops,
        txDrops: counters.txDrops,
        updatedAt: new Date().toISOString(),
      },
      quality: {
        latencyMs: counters.latencyMs,
        jitterMs: counters.jitterMs,
        packetLossPercent: counters.packetLossPercent,
      },
      config: {
        connectionType: wanRow.connectionType as WanConnectionType,
        ipv4: {
          ipAddress: wanRow.ipAddress,
          subnetMask: wanRow.subnetMask,
          gateway: wanRow.gateway,
          mtu: wanRow.mtu,
        },
        dns: {
          auto: wanRow.dnsAuto,
          primary: wanRow.dnsPrimary,
          secondary: wanRow.dnsSecondary,
        },
        pppoe: {
          username: wanRow.pppoeUsername ?? '',
          password: wanRow.pppoePassword ?? '',
          serviceName: wanRow.pppoeServiceName,
          acName: wanRow.pppoeAcName,
          mtu: wanRow.pppoeMtu,
          connected: wanRow.pppoeConnected,
          sessionTimeSeconds: pppoeSessionTime,
          authStatus: wanRow.pppoeAuthStatus as 'authenticated' | 'failed' | 'disconnected' | 'connecting',
        },
        ipv6: {
          enabled: ipv6Row?.wanEnabled ?? false,
          slaac: ipv6Row?.slaacEnabled ?? true,
          dhcpv6: ipv6Row?.dhcpv6Enabled ?? true,
          prefixDelegation: ipv6Row?.prefixDelegation ?? true,
          wanAddress: ipv6Row?.wanAddress ?? '',
          gateway: ipv6Row?.wanGateway ?? '',
          dns: ipv6Row?.wanDns ?? '',
          prefixLength: ipv6Row?.prefixLength ?? 64,
        },
        vlan: {
          enabled: wanRow.vlanEnabled,
          vlanId: wanRow.vlanId,
          priority: wanRow.vlanPriority,
          status: wanRow.vlanEnabled ? 'active' : 'inactive',
        },
        nat: {
          enabled: wanRow.natEnabled,
          type: wanRow.natType,
        },
      },
      routes: routes.map((r, i) => ({
        destination: r.destination,
        gateway: r.gateway,
        interface: r.interface,
        metric: i + 1,
      })),
      acs: {
        reachable: Boolean(session?.acsUrl),
        lastInform: session?.lastInform?.toISOString() ?? null,
        nextInform,
        connectionStatus: session?.sessionState ?? 'idle',
      },
      history,
      futureConnectionTypes: [...FUTURE_TYPES],
      updatedAt: new Date().toISOString(),
    };
  }

  async tickStats(deviceId: string): Promise<WanStatsPayload> {
    const counters = this.getCounters(deviceId);
    const wanRow = await prisma.wanConfig.findUnique({ where: { deviceId } });
    const connected = wanRow?.enabled && wanRow?.status === 'connected';

    if (connected) {
      counters.rxBytes += Math.floor(50_000 + Math.random() * 120_000);
      counters.txBytes += Math.floor(20_000 + Math.random() * 60_000);
      counters.rxPackets += Math.floor(400 + Math.random() * 800);
      counters.txPackets += Math.floor(200 + Math.random() * 400);
      if (Math.random() < 0.05) counters.rxErrors += 1;
      if (Math.random() < 0.02) counters.txErrors += 1;
      counters.latencyMs = 12 + Math.random() * 15;
      counters.jitterMs = 1 + Math.random() * 4;
      counters.packetLossPercent = Math.random() * 0.5;
    }

    const dashboard = await this.getDashboard(deviceId);
    const payload: WanStatsPayload = {
      statistics: dashboard.statistics,
      quality: dashboard.quality,
      status: dashboard.status,
    };

    if (this.eventBus) {
      this.eventBus.emit('wan.stats', payload);
    }

    return payload;
  }

  async updateConfig(deviceId: string, data: Record<string, unknown>) {
    const wanUpdate: Record<string, unknown> = {};
    const ipv6Update: Record<string, unknown> = {};

    if (data.connectionType) wanUpdate.connectionType = data.connectionType;
    if (data.ipAddress) wanUpdate.ipAddress = data.ipAddress;
    if (data.subnetMask) wanUpdate.subnetMask = data.subnetMask;
    if (data.gateway) wanUpdate.gateway = data.gateway;
    if (data.mtu) wanUpdate.mtu = data.mtu;
    if (data.dnsPrimary) wanUpdate.dnsPrimary = data.dnsPrimary;
    if (data.dnsSecondary) wanUpdate.dnsSecondary = data.dnsSecondary;
    if (data.dnsAuto !== undefined) wanUpdate.dnsAuto = data.dnsAuto;
    if (data.pppoeUsername) wanUpdate.pppoeUsername = data.pppoeUsername;
    if (data.pppoePassword) wanUpdate.pppoePassword = data.pppoePassword;
    if (data.pppoeServiceName) wanUpdate.pppoeServiceName = data.pppoeServiceName;
    if (data.pppoeAcName) wanUpdate.pppoeAcName = data.pppoeAcName;
    if (data.pppoeMtu) wanUpdate.pppoeMtu = data.pppoeMtu;
    if (data.vlanEnabled !== undefined) wanUpdate.vlanEnabled = data.vlanEnabled;
    if (data.vlanId !== undefined) wanUpdate.vlanId = data.vlanId;
    if (data.vlanPriority !== undefined) wanUpdate.vlanPriority = data.vlanPriority;
    if (data.natEnabled !== undefined) wanUpdate.natEnabled = data.natEnabled;
    if (data.natType) wanUpdate.natType = data.natType;
    if (data.enabled !== undefined) {
      wanUpdate.enabled = data.enabled;
      wanUpdate.status = data.enabled ? 'connected' : 'disconnected';
      if (data.enabled) {
        wanUpdate.connectedSince = new Date();
        wanUpdate.lastReconnect = new Date();
      }
    }

    if (data.ipv6Enabled !== undefined) ipv6Update.wanEnabled = data.ipv6Enabled;
    if (data.slaacEnabled !== undefined) ipv6Update.slaacEnabled = data.slaacEnabled;
    if (data.dhcpv6Enabled !== undefined) ipv6Update.dhcpv6Enabled = data.dhcpv6Enabled;
    if (data.prefixDelegation !== undefined) ipv6Update.prefixDelegation = data.prefixDelegation;
    if (data.wanAddress) ipv6Update.wanAddress = data.wanAddress;
    if (data.wanGateway) ipv6Update.wanGateway = data.wanGateway;
    if (data.wanDns) ipv6Update.wanDns = data.wanDns;
    if (data.prefixLength !== undefined) ipv6Update.prefixLength = data.prefixLength;

    if (Object.keys(wanUpdate).length > 0) {
      await prisma.wanConfig.update({ where: { deviceId }, data: wanUpdate });
    }
    if (Object.keys(ipv6Update).length > 0) {
      await prisma.ipv6Config.update({ where: { deviceId }, data: ipv6Update });
    }

    if (this.logService && Object.keys(wanUpdate).length + Object.keys(ipv6Update).length > 0) {
      await this.logService.log(deviceId, 'PARAM_CHANGE', 'WAN configuration updated');
    }
  }

  async renewDhcp(deviceId: string) {
    await this.reconnect(deviceId, 'WAN Connected', 'DHCP lease renewed');
    await this.addHistory(deviceId, 'WAN Connected', 'DHCP lease renewed');
  }

  async releaseDhcp(deviceId: string) {
    await prisma.wanConfig.update({
      where: { deviceId },
      data: { status: 'disconnected', ipAddress: '0.0.0.0' },
    });
    await this.addHistory(deviceId, 'WAN Disconnected', 'DHCP lease released');
  }

  async reconnect(deviceId: string, event = 'WAN Connected', details = 'WAN reconnected') {
    const now = new Date();
    await prisma.wanConfig.update({
      where: { deviceId },
      data: {
        status: 'connected',
        connectedSince: now,
        lastReconnect: now,
        ipAddress: '192.0.2.10',
      },
    });
    await this.addHistory(deviceId, event, details);
    if (this.logService) await this.logService.log(deviceId, 'SYSTEM', details);
  }

  async testConnection(deviceId: string) {
    const ok = Math.random() > 0.1;
    await this.addHistory(deviceId, ok ? 'WAN Connected' : 'WAN Disconnected', 'Connection test');
    return { success: ok, latencyMs: 15 + Math.floor(Math.random() * 20) };
  }

  async pingGateway(deviceId: string) {
    const wan = await prisma.wanConfig.findUnique({ where: { deviceId } });
    const avgMs = 8 + Math.floor(Math.random() * 12);
    await this.addHistory(deviceId, 'WAN Connected', `Ping gateway ${wan?.gateway} OK`);
    return { target: wan?.gateway ?? '192.0.2.1', packetsSent: 4, packetsReceived: 4, avgMs };
  }

  async pppoeConnect(deviceId: string) {
    const counters = this.getCounters(deviceId);
    counters.pppoeSessionStart = new Date();
    await prisma.wanConfig.update({
      where: { deviceId },
      data: {
        pppoeConnected: true,
        pppoeAuthStatus: 'authenticated',
        status: 'connected',
        connectedSince: new Date(),
        lastReconnect: new Date(),
      },
    });
    await this.addHistory(deviceId, 'PPPoE Connected', 'PPPoE session established');
    if (this.logService) await this.logService.log(deviceId, 'SYSTEM', 'PPPoE connected');
  }

  async pppoeDisconnect(deviceId: string) {
    const counters = this.getCounters(deviceId);
    counters.pppoeSessionStart = null;
    await prisma.wanConfig.update({
      where: { deviceId },
      data: {
        pppoeConnected: false,
        pppoeAuthStatus: 'disconnected',
        status: 'disconnected',
      },
    });
    await this.addHistory(deviceId, 'PPPoE Disconnected', 'PPPoE session terminated');
    if (this.logService) await this.logService.log(deviceId, 'SYSTEM', 'PPPoE disconnected');
  }

  private async addHistory(deviceId: string, event: string, details?: string) {
    await prisma.logEntry.create({
      data: {
        deviceId,
        type: 'SYSTEM',
        message: event,
        details: details ?? null,
      },
    });
  }

  /**
   * Lists every WAN interface on the device: the primary internet WAN (backed by
   * the main WanConfig, non-deletable) followed by the additional service profiles.
   */
  async listInterfaces(deviceId: string): Promise<WanInterfaceDto[]> {
    const primaryRow = await prisma.wanConfig.findUnique({ where: { deviceId } });
    const extraRows = await prisma.wanInterface.findMany({
      where: { deviceId },
      orderBy: { createdAt: 'asc' },
    });

    const interfaces: WanInterfaceDto[] = [];

    if (primaryRow) {
      interfaces.push({
        id: 'primary',
        name: 'Internet (WAN1)',
        serviceType: 'INTERNET',
        connectionType: primaryRow.connectionType as WanConnectionType,
        enabled: primaryRow.enabled,
        isDefault: true,
        ipAddress: primaryRow.ipAddress,
        subnetMask: primaryRow.subnetMask,
        gateway: primaryRow.gateway,
        dnsPrimary: primaryRow.dnsPrimary,
        dnsSecondary: primaryRow.dnsSecondary,
        mtu: primaryRow.mtu,
        vlanEnabled: primaryRow.vlanEnabled,
        vlanId: primaryRow.vlanId,
        natEnabled: primaryRow.natEnabled,
        pppoeUsername: primaryRow.pppoeUsername ?? '',
        status: (!primaryRow.enabled
          ? 'disconnected'
          : primaryRow.status === 'connected' ? 'connected' : 'disconnected') as WanLinkStatus,
      });
    }

    for (const row of extraRows) {
      interfaces.push(this.toInterfaceDto(row));
    }

    return interfaces;
  }

  async createInterface(deviceId: string, input: WanInterfaceInput): Promise<WanInterfaceDto> {
    const row = await prisma.wanInterface.create({
      data: {
        deviceId,
        name: input.name,
        serviceType: input.serviceType,
        connectionType: input.connectionType,
        enabled: input.enabled,
        ipAddress: input.ipAddress,
        subnetMask: input.subnetMask,
        gateway: input.gateway,
        dnsPrimary: input.dnsPrimary,
        dnsSecondary: input.dnsSecondary,
        mtu: input.mtu,
        pppoeUsername: input.pppoeUsername || null,
        pppoePassword: input.pppoePassword || null,
        vlanEnabled: input.vlanEnabled,
        vlanId: input.vlanId,
        natEnabled: input.natEnabled,
        status: input.enabled ? 'connected' : 'disconnected',
      },
    });
    if (this.logService) {
      await this.logService.log(deviceId, 'PARAM_CHANGE', `WAN interface created: ${input.name}`);
    }
    await this.addHistory(deviceId, 'WAN Interface Added', `${input.name} (${input.serviceType})`);
    return this.toInterfaceDto(row);
  }

  async updateInterface(deviceId: string, id: string, input: WanInterfaceInput): Promise<WanInterfaceDto> {
    const existing = await prisma.wanInterface.findFirst({ where: { id, deviceId } });
    if (!existing) throw new Error('WAN interface not found');

    const row = await prisma.wanInterface.update({
      where: { id },
      data: {
        name: input.name,
        serviceType: input.serviceType,
        connectionType: input.connectionType,
        enabled: input.enabled,
        ipAddress: input.ipAddress,
        subnetMask: input.subnetMask,
        gateway: input.gateway,
        dnsPrimary: input.dnsPrimary,
        dnsSecondary: input.dnsSecondary,
        mtu: input.mtu,
        pppoeUsername: input.pppoeUsername || null,
        pppoePassword: input.pppoePassword || null,
        vlanEnabled: input.vlanEnabled,
        vlanId: input.vlanId,
        natEnabled: input.natEnabled,
        status: input.enabled ? 'connected' : 'disconnected',
      },
    });
    if (this.logService) {
      await this.logService.log(deviceId, 'PARAM_CHANGE', `WAN interface updated: ${input.name}`);
    }
    return this.toInterfaceDto(row);
  }

  async deleteInterface(deviceId: string, id: string): Promise<void> {
    const existing = await prisma.wanInterface.findFirst({ where: { id, deviceId } });
    if (!existing) throw new Error('WAN interface not found');
    await prisma.wanInterface.delete({ where: { id } });
    if (this.logService) {
      await this.logService.log(deviceId, 'PARAM_CHANGE', `WAN interface removed: ${existing.name}`);
    }
    await this.addHistory(deviceId, 'WAN Interface Removed', existing.name);
  }

  async setInterfaceEnabled(deviceId: string, id: string, enabled: boolean): Promise<WanInterfaceDto> {
    if (id === 'primary') {
      await prisma.wanConfig.update({
        where: { deviceId },
        data: {
          enabled,
          status: enabled ? 'connected' : 'disconnected',
          ...(enabled ? { connectedSince: new Date(), lastReconnect: new Date() } : {}),
        },
      });
      if (this.logService) {
        await this.logService.log(
          deviceId,
          'PARAM_CHANGE',
          enabled ? 'Primary WAN interface enabled' : 'Primary WAN interface disabled',
        );
      }
      await this.addHistory(
        deviceId,
        enabled ? 'WAN Connected' : 'WAN Disconnected',
        `Primary WAN ${enabled ? 'enabled' : 'disabled'}`,
      );
      const interfaces = await this.listInterfaces(deviceId);
      const primary = interfaces.find((i) => i.isDefault);
      if (!primary) throw new Error('Primary WAN not found');
      return primary;
    }

    const existing = await prisma.wanInterface.findFirst({ where: { id, deviceId } });
    if (!existing) throw new Error('WAN interface not found');

    const row = await prisma.wanInterface.update({
      where: { id },
      data: {
        enabled,
        status: enabled ? 'connected' : 'disconnected',
      },
    });
    if (this.logService) {
      await this.logService.log(
        deviceId,
        'PARAM_CHANGE',
        `${row.name} ${enabled ? 'enabled' : 'disabled'}`,
      );
    }
    await this.addHistory(
      deviceId,
      enabled ? 'WAN Connected' : 'WAN Disconnected',
      `${row.name} ${enabled ? 'enabled' : 'disabled'}`,
    );
    return this.toInterfaceDto(row);
  }

  private toInterfaceDto(row: {
    id: string;
    name: string;
    serviceType: string;
    connectionType: string;
    enabled: boolean;
    ipAddress: string;
    subnetMask: string;
    gateway: string;
    dnsPrimary: string;
    dnsSecondary: string;
    mtu: number;
    vlanEnabled: boolean;
    vlanId: number;
    natEnabled: boolean;
    pppoeUsername: string | null;
    status: string;
  }): WanInterfaceDto {
    return {
      id: row.id,
      name: row.name,
      serviceType: row.serviceType as WanServiceType,
      connectionType: row.connectionType as WanConnectionType,
      enabled: row.enabled,
      isDefault: false,
      ipAddress: row.ipAddress,
      subnetMask: row.subnetMask,
      gateway: row.gateway,
      dnsPrimary: row.dnsPrimary,
      dnsSecondary: row.dnsSecondary,
      mtu: row.mtu,
      vlanEnabled: row.vlanEnabled,
      vlanId: row.vlanId,
      natEnabled: row.natEnabled,
      pppoeUsername: row.pppoeUsername ?? '',
      status: (row.status === 'connected' ? 'connected' : 'disconnected') as WanLinkStatus,
    };
  }

  private async getHistory(deviceId: string): Promise<WanHistoryEventDto[]> {
    const logs = await prisma.logEntry.findMany({
      where: {
        deviceId,
        OR: [
          { message: { contains: 'WAN' } },
          { message: { contains: 'PPPoE' } },
          { message: { contains: 'DNS' } },
          { message: { contains: 'Gateway' } },
          { message: { contains: 'IP' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    return logs.map((l) => ({
      id: l.id,
      timestamp: l.createdAt.toISOString(),
      event: l.message,
      details: l.details ?? undefined,
    }));
  }
}
