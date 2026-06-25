import type { EventEmitter } from 'events';
import { prisma } from '../../infrastructure/database/prisma.js';
import type { LogService } from './LogService.js';

const SAMPLE_HOSTS = [
  { hostname: 'Smart-TV', mac: 'AA:BB:CC:11:22:01', interface: 'wifi', band: '5' },
  { hostname: 'iPhone-13', mac: 'AA:BB:CC:11:22:02', interface: 'wifi', band: '5' },
  { hostname: 'Laptop-Work', mac: 'AA:BB:CC:11:22:03', interface: 'wifi', band: '2.4' },
  { hostname: 'Desktop-PC', mac: 'AA:BB:CC:11:22:04', interface: 'lan', band: null },
  { hostname: 'Android-Phone', mac: 'AA:BB:CC:11:22:05', interface: 'wifi', band: '2.4' },
  { hostname: 'Printer-HP', mac: 'AA:BB:CC:11:22:06', interface: 'lan', band: null },
  { hostname: 'Tablet', mac: 'AA:BB:CC:11:22:07', interface: 'wifi', band: '5' },
];

const NEIGHBOR_SSIDS = ['NET_2G', 'VIVO_WIFI', 'CLARO_5G', 'Guest_WiFi', 'FiberHome', 'TP-Link_5G', 'ZTE_AP', 'Intelbras'];

function parseFirmwareVersion(filename: string): string {
  const match = filename.match(/(\d+\.\d+(?:\.\d+)?(?:[-_][\w.]+)?)/);
  return match?.[1] ?? filename.replace(/\.[^.]+$/, '');
}

export class CpeSimulatorService {
  constructor(
    private readonly logService?: LogService,
    private readonly eventBus?: EventEmitter,
  ) {}

  async seedCpeData(deviceId: string) {
    const existing = await prisma.connectedHost.count({ where: { deviceId } });
    if (existing > 0) return;

    await prisma.bandSteeringConfig.create({ data: { deviceId } });
    await prisma.ipv6Config.create({ data: { deviceId } });
    await prisma.guestWlanConfig.create({ data: { deviceId } });
    await prisma.upnpConfig.create({ data: { deviceId } });
    await prisma.vpnConfig.create({ data: { deviceId } });
    await prisma.firmwareInfo.create({ data: { deviceId } });
    await prisma.ntpConfig.create({ data: { deviceId } });
    await prisma.webManagementConfig.create({ data: { deviceId } });
    await prisma.opticalInfo.create({ data: { deviceId } });

    await prisma.voipLine.createMany({
      data: [
        { deviceId, lineId: 1, number: '+55 11 4000-0001', status: 'registered' },
        { deviceId, lineId: 2, number: '', status: 'idle' },
      ],
    });

    await prisma.qosRule.createMany({
      data: [
        { deviceId, name: 'VoIP Priority', priority: 1, protocol: 'UDP', destPort: '5060', dscp: 46 },
        { deviceId, name: 'Gaming', priority: 3, protocol: 'UDP', destPort: 'any', dscp: 34 },
      ],
    });

    await prisma.dhcpReservation.create({
      data: { deviceId, macAddress: 'AA:BB:CC:11:22:04', ipAddress: '192.168.1.50', hostname: 'Desktop-PC' },
    });

    await prisma.staticRoute.create({
      data: { deviceId, destination: '10.0.0.0', subnetMask: '255.0.0.0', gateway: '192.168.1.1', interface: 'lan' },
    });

    for (let i = 0; i < SAMPLE_HOSTS.length; i++) {
      const h = SAMPLE_HOSTS[i];
      await prisma.connectedHost.create({
        data: {
          deviceId,
          macAddress: h.mac,
          ipAddress: `192.168.1.${100 + i}`,
          hostname: h.hostname,
          interface: h.interface,
          band: h.band,
          rssi: h.band ? -45 + Math.floor(Math.random() * 25) : null,
          leaseExpiry: new Date(Date.now() + 86400000 * 2),
        },
      });
    }
  }

  async getHosts(deviceId: string) {
    const hosts = await prisma.connectedHost.findMany({
      where: { deviceId },
      orderBy: { hostname: 'asc' },
    });
    return hosts.map((h) => ({
      id: h.id,
      macAddress: h.macAddress,
      ipAddress: h.ipAddress,
      hostname: h.hostname,
      interface: h.interface,
      band: h.band,
      rssi: h.rssi,
      leaseExpiry: h.leaseExpiry?.toISOString(),
      connectedAt: h.connectedAt.toISOString(),
    }));
  }

  async tickHosts(deviceId: string) {
    const hosts = await prisma.connectedHost.findMany({ where: { deviceId, interface: 'wifi' } });
    const steering = await prisma.bandSteeringConfig.findUnique({ where: { deviceId } });

    for (const host of hosts) {
      const rssi = -40 + Math.floor(Math.random() * 35);
      let band = host.band;

      if (steering?.enabled && steering.clientSteering && rssi < steering.rssiThreshold24 && band === '2.4' && steering.prefer5G) {
        band = '5';
        await this.logService?.log(deviceId, 'SYSTEM', `Band steering: ${host.hostname} steered to 5 GHz`);
      }

      await prisma.connectedHost.update({
        where: { id: host.id },
        data: { rssi, band, updatedAt: new Date() },
      });
    }

    const updated = await this.getHosts(deviceId);
    this.eventBus?.emit('hosts.updated', updated);
    return updated;
  }

  async getNeighbors(deviceId: string) {
    const neighbors = await prisma.wifiNeighbor.findMany({
      where: { deviceId },
      orderBy: { rssi: 'desc' },
      take: 20,
    });
    return neighbors.map((n) => ({
      id: n.id,
      bssid: n.bssid,
      ssid: n.ssid,
      channel: n.channel,
      rssi: n.rssi,
      security: n.security,
      band: n.band,
      scannedAt: n.scannedAt.toISOString(),
    }));
  }

  async scanNeighbors(deviceId: string) {
    await prisma.wifiNeighbor.deleteMany({ where: { deviceId } });

    const count = 8 + Math.floor(Math.random() * 7);
    const neighbors = Array.from({ length: count }, (_, i) => ({
      deviceId,
      bssid: `00:1A:2B:${(i + 10).toString(16).padStart(2, '0')}:CC:${(i + 20).toString(16).padStart(2, '0')}`,
      ssid: NEIGHBOR_SSIDS[i % NEIGHBOR_SSIDS.length] + (i > 4 ? `_${i}` : ''),
      channel: i % 2 === 0 ? 6 + (i % 5) : 36 + (i % 4) * 4,
      rssi: -90 + Math.floor(Math.random() * 50),
      security: i % 3 === 0 ? 'WPA2' : 'WPA3',
      band: i % 2 === 0 ? '2.4' : '5',
    }));

    await prisma.wifiNeighbor.createMany({ data: neighbors });
    await this.logService?.log(deviceId, 'DIAGNOSTIC', `Wi-Fi neighbor scan completed: ${count} APs found`);

    const result = await this.getNeighbors(deviceId);
    this.eventBus?.emit('neighbors.scanned', result);
    return result;
  }

  async getBandSteering(deviceId: string) {
    const cfg = await prisma.bandSteeringConfig.findUnique({ where: { deviceId } });
    if (!cfg) return { enabled: true, rssiThreshold24: -70, rssiThreshold5: -65, prefer5G: true, clientSteering: true };
    return {
      enabled: cfg.enabled,
      rssiThreshold24: cfg.rssiThreshold24,
      rssiThreshold5: cfg.rssiThreshold5,
      prefer5G: cfg.prefer5G,
      clientSteering: cfg.clientSteering,
    };
  }

  async updateBandSteering(deviceId: string, data: {
    enabled?: boolean;
    rssiThreshold24?: number;
    rssiThreshold5?: number;
    prefer5G?: boolean;
    clientSteering?: boolean;
  }) {
    const cfg = await prisma.bandSteeringConfig.update({ where: { deviceId }, data });
    if (cfg.enabled) {
      await prisma.wlanConfig.updateMany({ where: { deviceId }, data: { enabled: true } });
      await prisma.wirelessInterface.updateMany({
        where: { deviceId, interfaceType: 'primary' },
        data: { enabled: true },
      });
    }
    this.eventBus?.emit('bandsteering.changed', cfg);
    await this.logService?.log(deviceId, 'PARAM_CHANGE', 'Band steering configuration updated');
    return {
      enabled: cfg.enabled,
      rssiThreshold24: cfg.rssiThreshold24,
      rssiThreshold5: cfg.rssiThreshold5,
      prefer5G: cfg.prefer5G,
      clientSteering: cfg.clientSteering,
    };
  }

  async runSpeedTest(deviceId: string) {
    const downloadMbps = 80 + Math.random() * 420;
    const uploadMbps = 20 + Math.random() * 80;
    const latencyMs = 5 + Math.random() * 20;
    const jitterMs = 1 + Math.random() * 5;

    const result = await prisma.speedTestResult.create({
      data: {
        deviceId,
        downloadMbps: Math.round(downloadMbps * 10) / 10,
        uploadMbps: Math.round(uploadMbps * 10) / 10,
        latencyMs: Math.round(latencyMs * 10) / 10,
        jitterMs: Math.round(jitterMs * 10) / 10,
      },
    });

    const dto = {
      id: result.id,
      downloadMbps: result.downloadMbps,
      uploadMbps: result.uploadMbps,
      latencyMs: result.latencyMs,
      jitterMs: result.jitterMs,
      server: result.server,
      testedAt: result.testedAt.toISOString(),
    };

    await this.logService?.log(deviceId, 'DIAGNOSTIC', `Speed test: ${dto.downloadMbps}↓ / ${dto.uploadMbps}↑ Mbps`);
    this.eventBus?.emit('speedtest.completed', dto);
    return dto;
  }

  async getSpeedTestHistory(deviceId: string, limit = 10) {
    const results = await prisma.speedTestResult.findMany({
      where: { deviceId },
      orderBy: { testedAt: 'desc' },
      take: limit,
    });
    return results.map((r) => ({
      id: r.id,
      downloadMbps: r.downloadMbps,
      uploadMbps: r.uploadMbps,
      latencyMs: r.latencyMs,
      jitterMs: r.jitterMs,
      server: r.server,
      testedAt: r.testedAt.toISOString(),
    }));
  }

  async getIpv6(deviceId: string) {
    const cfg = await prisma.ipv6Config.findUnique({ where: { deviceId } });
    return cfg ?? { wanEnabled: false, wanMode: 'auto', lanEnabled: true, lanPrefix: 'fd00::/64', dhcpv6Enabled: true };
  }

  async updateIpv6(deviceId: string, data: Record<string, unknown>) {
    return prisma.ipv6Config.update({ where: { deviceId }, data });
  }

  async getGuestWlan(deviceId: string) {
    return prisma.guestWlanConfig.findUnique({ where: { deviceId } });
  }

  async updateGuestWlan(deviceId: string, data: Record<string, unknown>) {
    return prisma.guestWlanConfig.update({ where: { deviceId }, data });
  }

  async getUpnp(deviceId: string) {
    const cfg = await prisma.upnpConfig.findUnique({ where: { deviceId } });
    return { enabled: cfg?.enabled ?? true };
  }

  async updateUpnp(deviceId: string, enabled: boolean) {
    return prisma.upnpConfig.update({ where: { deviceId }, data: { enabled } });
  }

  async getVpn(deviceId: string) {
    return prisma.vpnConfig.findUnique({ where: { deviceId } });
  }

  async updateVpn(deviceId: string, data: Record<string, unknown>) {
    return prisma.vpnConfig.update({ where: { deviceId }, data });
  }

  async getQosRules(deviceId: string) {
    return prisma.qosRule.findMany({ where: { deviceId } });
  }

  async createQosRule(deviceId: string, data: Record<string, unknown>) {
    return prisma.qosRule.create({ data: { deviceId, ...data } as Parameters<typeof prisma.qosRule.create>[0]['data'] });
  }

  async deleteQosRule(deviceId: string, id: string) {
    await prisma.qosRule.deleteMany({ where: { id, deviceId } });
  }

  async getRoutes(deviceId: string) {
    return prisma.staticRoute.findMany({ where: { deviceId } });
  }

  async createRoute(deviceId: string, data: Record<string, unknown>) {
    return prisma.staticRoute.create({ data: { deviceId, ...data } as Parameters<typeof prisma.staticRoute.create>[0]['data'] });
  }

  async deleteRoute(deviceId: string, id: string) {
    await prisma.staticRoute.deleteMany({ where: { id, deviceId } });
  }

  async getReservations(deviceId: string) {
    return prisma.dhcpReservation.findMany({ where: { deviceId } });
  }

  async createReservation(deviceId: string, data: { macAddress: string; ipAddress: string; hostname?: string }) {
    return prisma.dhcpReservation.create({
      data: { deviceId, macAddress: data.macAddress, ipAddress: data.ipAddress, hostname: data.hostname ?? '' },
    });
  }

  async deleteReservation(deviceId: string, id: string) {
    await prisma.dhcpReservation.deleteMany({ where: { id, deviceId } });
  }

  async getNtp(deviceId: string) {
    return prisma.ntpConfig.findUnique({ where: { deviceId } });
  }

  async updateNtp(deviceId: string, data: Record<string, unknown>) {
    return prisma.ntpConfig.update({ where: { deviceId }, data });
  }

  async getOptical(deviceId: string) {
    const info = await prisma.opticalInfo.findUnique({ where: { deviceId } });
    if (!info) return null;
    return {
      rxPowerDbm: info.rxPowerDbm + (Math.random() - 0.5) * 0.4,
      txPowerDbm: info.txPowerDbm + (Math.random() - 0.5) * 0.2,
      temperature: info.temperature + (Math.random() - 0.5) * 2,
      ponStatus: info.ponStatus,
      oltId: info.oltId,
    };
  }

  async getVoipLines(deviceId: string) {
    return prisma.voipLine.findMany({ where: { deviceId }, orderBy: { lineId: 'asc' } });
  }

  async getFirmware(deviceId: string) {
    const info = await prisma.firmwareInfo.findUnique({ where: { deviceId } });
    return info;
  }

  async upgradeFirmware(deviceId: string) {
    return this.startFirmwareUpgrade(deviceId, '1.0.1', 'online repository');
  }

  async upgradeFirmwareFromFile(
    deviceId: string,
    file: { originalname: string; size: number },
  ) {
    const targetVersion = parseFirmwareVersion(file.originalname);
    await this.logService?.log(
      deviceId,
      'SYSTEM',
      `Firmware image uploaded: ${file.originalname} (${file.size} bytes)`,
    );
    return this.startFirmwareUpgrade(deviceId, targetVersion, file.originalname);
  }

  private async startFirmwareUpgrade(deviceId: string, targetVersion: string, source: string) {
    await prisma.firmwareInfo.update({
      where: { deviceId },
      data: { upgradeStatus: 'downloading', pendingVersion: targetVersion },
    });
    this.eventBus?.emit('firmware.upgrade.progress', { status: 'downloading', progress: 0 });

    setTimeout(async () => {
      await prisma.firmwareInfo.update({
        where: { deviceId },
        data: {
          currentVersion: targetVersion,
          pendingVersion: null,
          upgradeStatus: 'idle',
          lastUpgrade: new Date(),
        },
      });
      this.eventBus?.emit('firmware.upgrade.progress', { status: 'completed', progress: 100 });
      await this.logService?.log(deviceId, 'SYSTEM', `Firmware upgraded to ${targetVersion} (${source})`);
    }, 3000);

    return { status: 'downloading', message: 'Firmware upgrade started', targetVersion };
  }

  async tickOptical(deviceId: string) {
    const info = await prisma.opticalInfo.findUnique({ where: { deviceId } });
    if (!info) return;
    await prisma.opticalInfo.update({
      where: { deviceId },
      data: {
        rxPowerDbm: Math.max(-28, Math.min(-15, info.rxPowerDbm + (Math.random() - 0.5) * 0.3)),
        temperature: Math.max(35, Math.min(55, info.temperature + (Math.random() - 0.5) * 1)),
      },
    });
  }
}
