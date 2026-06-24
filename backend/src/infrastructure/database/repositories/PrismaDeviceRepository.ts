import type { IDeviceRepository } from '../../../domain/repositories/IDeviceRepository.js';
import type { VirtualDeviceEntity } from '../../../domain/entities/VirtualDevice.js';
import type { WanConfig, LanConfig, WlanConfig } from '../../../domain/entities/NetworkConfig.js';
import { prisma } from '../prisma.js';

export class PrismaDeviceRepository implements IDeviceRepository {
  async findDefault(): Promise<VirtualDeviceEntity | null> {
    const device = await prisma.virtualDevice.findFirst({ orderBy: { createdAt: 'asc' } });
    return device ?? null;
  }

  async findById(id: string): Promise<VirtualDeviceEntity | null> {
    return prisma.virtualDevice.findUnique({ where: { id } });
  }

  async create(data: Omit<VirtualDeviceEntity, 'id'>): Promise<VirtualDeviceEntity> {
    return prisma.virtualDevice.create({ data });
  }

  async getWanConfig(deviceId: string): Promise<WanConfig | null> {
    const row = await prisma.wanConfig.findUnique({ where: { deviceId } });
    if (!row) return null;
    return {
      connectionType: row.connectionType as WanConfig['connectionType'],
      ipAddress: row.ipAddress,
      subnetMask: row.subnetMask,
      gateway: row.gateway,
      dnsPrimary: row.dnsPrimary,
      dnsSecondary: row.dnsSecondary,
      pppoeUsername: row.pppoeUsername ?? undefined,
      pppoePassword: row.pppoePassword ?? undefined,
    };
  }

  async updateWanConfig(deviceId: string, data: Partial<WanConfig>): Promise<WanConfig> {
    const row = await prisma.wanConfig.update({ where: { deviceId }, data });
    return {
      connectionType: row.connectionType as WanConfig['connectionType'],
      ipAddress: row.ipAddress,
      subnetMask: row.subnetMask,
      gateway: row.gateway,
      dnsPrimary: row.dnsPrimary,
      dnsSecondary: row.dnsSecondary,
      pppoeUsername: row.pppoeUsername ?? undefined,
      pppoePassword: row.pppoePassword ?? undefined,
    };
  }

  async getLanConfig(deviceId: string): Promise<LanConfig | null> {
    const row = await prisma.lanConfig.findUnique({ where: { deviceId } });
    if (!row) return null;
    return {
      ipAddress: row.ipAddress,
      subnetMask: row.subnetMask,
      dhcpEnabled: row.dhcpEnabled,
      dhcpRangeStart: row.dhcpRangeStart,
      dhcpRangeEnd: row.dhcpRangeEnd,
    };
  }

  async updateLanConfig(deviceId: string, data: Partial<LanConfig>): Promise<LanConfig> {
    const row = await prisma.lanConfig.update({ where: { deviceId }, data });
    return {
      ipAddress: row.ipAddress,
      subnetMask: row.subnetMask,
      dhcpEnabled: row.dhcpEnabled,
      dhcpRangeStart: row.dhcpRangeStart,
      dhcpRangeEnd: row.dhcpRangeEnd,
    };
  }

  async getWlanConfigs(deviceId: string): Promise<WlanConfig[]> {
    const rows = await prisma.wlanConfig.findMany({ where: { deviceId } });
    return rows.map((r) => ({
      band: r.band as WlanConfig['band'],
      enabled: r.enabled,
      ssid: r.ssid,
      channel: r.channel,
      channelWidth: r.channelWidth,
      security: r.security,
      password: r.password,
    }));
  }

  async updateWlanConfig(deviceId: string, band: string, data: Partial<WlanConfig>): Promise<WlanConfig> {
    const row = await prisma.wlanConfig.update({
      where: { deviceId_band: { deviceId, band } },
      data,
    });
    return {
      band: row.band as WlanConfig['band'],
      enabled: row.enabled,
      ssid: row.ssid,
      channel: row.channel,
      channelWidth: row.channelWidth,
      security: row.security,
      password: row.password,
    };
  }

  async getMetrics(deviceId: string) {
    return prisma.simulatedMetrics.findUnique({ where: { deviceId } });
  }

  async updateMetrics(deviceId: string, data: Partial<{ cpuUsage: number; memoryUsage: number; uptime: number }>) {
    await prisma.simulatedMetrics.update({ where: { deviceId }, data });
  }

  async resetMetrics(deviceId: string): Promise<void> {
    await prisma.simulatedMetrics.update({
      where: { deviceId },
      data: { cpuUsage: 25, memoryUsage: 55, uptime: 0, bootTime: new Date() },
    });
  }
}
