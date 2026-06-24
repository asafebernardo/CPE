import type { IDeviceRepository } from '../../domain/repositories/IDeviceRepository.js';
import type {
  PingResponse,
  TracerouteResponse,
  DashboardResponse,
} from '@routergui/shared';
import { prisma } from '../../infrastructure/database/prisma.js';

export class DeviceSimulatorService {
  constructor(private readonly deviceRepo: IDeviceRepository) {}

  async getDashboard(deviceId: string): Promise<DashboardResponse> {
    const wan = await prisma.wanConfig.findUnique({ where: { deviceId } });
    const lan = await prisma.lanConfig.findUnique({ where: { deviceId } });
    const wlans = await prisma.wlanConfig.findMany({ where: { deviceId } });
    const metrics = await this.deviceRepo.getMetrics(deviceId);
    const session = await prisma.cwmpSession.findUnique({ where: { deviceId } });

    const uptime = metrics
      ? Math.floor((Date.now() - metrics.bootTime.getTime()) / 1000)
      : 0;

    if (metrics) {
      await this.deviceRepo.updateMetrics(deviceId, { uptime });
    }

    return {
      wan: {
        connectionType: wan?.connectionType ?? 'DHCP',
        ipAddress: wan?.ipAddress ?? '',
        subnetMask: wan?.subnetMask ?? '',
        gateway: wan?.gateway ?? '',
        dnsPrimary: wan?.dnsPrimary ?? '',
        dnsSecondary: wan?.dnsSecondary ?? '',
        status: wan?.status === 'connected' ? 'connected' : 'disconnected',
      },
      lan: {
        ipAddress: lan?.ipAddress ?? '',
        subnetMask: lan?.subnetMask ?? '',
        dhcpEnabled: lan?.dhcpEnabled ?? false,
        dhcpRangeStart: lan?.dhcpRangeStart ?? '',
        dhcpRangeEnd: lan?.dhcpRangeEnd ?? '',
        status: 'active',
      },
      wifi: wlans.map((w) => ({
        band: w.band as '2.4' | '5',
        ssid: w.ssid,
        channel: w.channel,
        channelWidth: w.channelWidth,
        security: w.security,
        enabled: w.enabled,
        status: w.enabled ? 'active' : 'disabled',
      })),
      uptime,
      cpuUsage: metrics?.cpuUsage ?? 25,
      memoryUsage: metrics?.memoryUsage ?? 55,
      acs: {
        url: session?.acsUrl ?? '',
        configured: Boolean(session?.acsUrl),
        periodicInformEnabled: session?.periodicInformEnabled ?? false,
        periodicInformInterval: session?.periodicInformInterval ?? 300,
        lastSessionState: session?.sessionState ?? 'idle',
      },
      lastInform: session?.lastInform?.toISOString() ?? null,
    };
  }

  async tickMetrics(deviceId: string): Promise<{ cpuUsage: number; memoryUsage: number; uptime: number }> {
    const metrics = await this.deviceRepo.getMetrics(deviceId);
    if (!metrics) return { cpuUsage: 25, memoryUsage: 55, uptime: 0 };

    const cpuUsage = Math.max(15, Math.min(45, metrics.cpuUsage + (Math.random() - 0.5) * 4));
    const memoryUsage = Math.max(40, Math.min(70, metrics.memoryUsage + (Math.random() - 0.5) * 3));
    const uptime = Math.floor((Date.now() - metrics.bootTime.getTime()) / 1000);

    await this.deviceRepo.updateMetrics(deviceId, { cpuUsage, memoryUsage, uptime });
    return { cpuUsage, memoryUsage, uptime };
  }

  async runPing(target: string, count = 4): Promise<PingResponse> {
    const results = Array.from({ length: count }, (_, i) => ({
      seq: i + 1,
      timeMs: Math.round(8 + Math.random() * 17),
      ttl: 64,
      success: true,
    }));

    const times = results.map((r) => r.timeMs);
    return {
      target,
      packetsSent: count,
      packetsReceived: count,
      minMs: Math.min(...times),
      avgMs: Math.round(times.reduce((a, b) => a + b, 0) / times.length),
      maxMs: Math.max(...times),
      results,
    };
  }

  async runTraceroute(target: string, maxHops = 8): Promise<TracerouteResponse> {
    const hops = Array.from({ length: maxHops }, (_, i) => ({
      hop: i + 1,
      ip: i < maxHops - 1 ? `10.${i}.${i}.${i + 1}` : target,
      hostname: i < maxHops - 1 ? `hop-${i + 1}.isp.net` : target,
      timeMs: Math.round(5 + Math.random() * 30),
    }));
    return { target, hops };
  }
}
