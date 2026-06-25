import {
  validateBandSteeringMembership,
  isBandSteeringEligible,
  getBandSteeringWarning,
  NETWORK_WLAN_INTERFACE_TYPES,
} from '@routergui/shared';
import type {
  GuestWirelessInput,
  MeshBackhaulInput,
  WirelessBand,
  WirelessInterfaceDto,
  WirelessInterfaceType,
  WirelessInterfaceUpdate,
} from '@routergui/shared';
import { prisma } from '../../infrastructure/database/prisma.js';
import type { LogService } from './LogService.js';
import type { PrismaDeviceRepository } from '../../infrastructure/database/repositories/PrismaDeviceRepository.js';

type WirelessRow = Awaited<ReturnType<typeof prisma.wirelessInterface.findFirst>>;

const SECONDARY_INTERFACE_DEFS: Array<{
  interfaceId: string;
  band: WirelessBand;
  name: string;
  channel: number;
  channelWidth: string;
  ssidSuffix: string;
}> = [
  { interfaceId: 'wlan1-sec1', band: '2.4', name: 'Secondary 2.4 GHz 1', channel: 1, channelWidth: '20MHz', ssidSuffix: '-2G-S1' },
  { interfaceId: 'wlan1-sec2', band: '2.4', name: 'Secondary 2.4 GHz 2', channel: 11, channelWidth: '20MHz', ssidSuffix: '-2G-S2' },
  { interfaceId: 'wlan1-sec3', band: '2.4', name: 'Secondary 2.4 GHz 3', channel: 3, channelWidth: '20MHz', ssidSuffix: '-2G-S3' },
  { interfaceId: 'wlan2-sec1', band: '5', name: 'Secondary 5 GHz 1', channel: 40, channelWidth: '80MHz', ssidSuffix: '-5G-S1' },
  { interfaceId: 'wlan2-sec2', band: '5', name: 'Secondary 5 GHz 2', channel: 44, channelWidth: '80MHz', ssidSuffix: '-5G-S2' },
  { interfaceId: 'wlan2-sec3', band: '5', name: 'Secondary 5 GHz 3', channel: 48, channelWidth: '80MHz', ssidSuffix: '-5G-S3' },
];

const EXTRA_GUEST_DEFS: Array<{
  interfaceId: string;
  band: WirelessBand;
  name: string;
  ssid: string;
  channel: number;
  channelWidth: string;
  vlanId: number;
}> = [
  {
    interfaceId: 'wlan2-guest',
    band: '5',
    name: 'Guest 5 GHz',
    ssid: 'RGX-Guest-5G',
    channel: 36,
    channelWidth: '80MHz',
    vlanId: 31,
  },
];

const EXTRA_MESH_DEFS: Array<{
  interfaceId: string;
  band: WirelessBand;
  name: string;
  channel: number;
  channelWidth: string;
}> = [
  {
    interfaceId: 'mesh1',
    band: '2.4',
    name: 'Mesh Backhaul 2.4 GHz',
    channel: 11,
    channelWidth: '20MHz',
  },
];

export class WirelessInterfaceService {
  constructor(
    private readonly deviceRepo: PrismaDeviceRepository,
    private readonly logService?: LogService,
  ) {}

  async ensureSeeded(deviceId: string): Promise<void> {
    const count = await prisma.wirelessInterface.count({ where: { deviceId } });
    if (count > 0) return;

    const wlans = await this.deviceRepo.getWlanConfigs(deviceId);
    for (const w of wlans) {
      await prisma.wirelessInterface.create({
        data: {
          deviceId,
          interfaceId: w.band === '2.4' ? 'wlan1' : 'wlan2',
          name: w.band === '2.4' ? 'Home 2.4 GHz' : 'Home 5 GHz',
          interfaceType: 'primary',
          band: w.band,
          enabled: w.enabled,
          hidden: false,
          ssid: w.ssid,
          channel: w.channel,
          channelWidth: w.channelWidth,
          security: w.security,
          password: w.password,
        },
      });
    }

    const guest = await prisma.guestWlanConfig.findUnique({ where: { deviceId } });
    if (guest) {
      await prisma.wirelessInterface.create({
        data: {
          deviceId,
          interfaceId: 'wlan1-1',
          name: 'Guest 2.4 GHz',
          interfaceType: 'guest',
          band: (guest.band === '5' ? '2.4' : guest.band) as WirelessBand,
          enabled: guest.enabled,
          ssid: guest.ssid,
          channel: 6,
          channelWidth: '20MHz',
          security: guest.security,
          password: guest.password,
          isolated: guest.isolation,
          vlanId: 30,
        },
      });
    }

    await prisma.wirelessInterface.create({
      data: {
        deviceId,
        interfaceId: 'mesh0',
        name: 'Mesh Backhaul 5 GHz',
        interfaceType: 'mesh_backhaul',
        band: '5',
        enabled: true,
        hidden: true,
        ssid: 'mesh-backhaul-hidden',
        channel: 149,
        channelWidth: '80MHz',
        security: 'wpa2-psk-aes',
        password: '',
        backhaulMode: 'wireless',
        linkQuality: 92,
        linkStatus: 'connected',
      },
    });

    for (const def of EXTRA_GUEST_DEFS) {
      await prisma.wirelessInterface.create({
        data: {
          deviceId,
          interfaceId: def.interfaceId,
          name: def.name,
          interfaceType: 'guest',
          band: def.band,
          enabled: guest?.enabled ?? false,
          hidden: false,
          ssid: def.ssid,
          channel: def.channel,
          channelWidth: def.channelWidth,
          security: guest?.security ?? 'wpa2-psk-aes',
          password: guest?.password ?? 'guest2024',
          isolated: true,
          vlanId: def.vlanId,
        },
      });
    }

    for (const def of EXTRA_MESH_DEFS) {
      await prisma.wirelessInterface.create({
        data: {
          deviceId,
          interfaceId: def.interfaceId,
          name: def.name,
          interfaceType: 'mesh_backhaul',
          band: def.band,
          enabled: true,
          hidden: true,
          ssid: `mesh-backhaul-${def.interfaceId}`,
          channel: def.channel,
          channelWidth: def.channelWidth,
          security: 'wpa2-psk-aes',
          password: '',
          backhaulMode: 'wireless',
          linkQuality: 88,
          linkStatus: 'connected',
        },
      });
    }
  }

  async ensureSecondaryInterfaces(deviceId: string): Promise<void> {
    for (const def of SECONDARY_INTERFACE_DEFS) {
      const existing = await prisma.wirelessInterface.findUnique({
        where: { deviceId_interfaceId: { deviceId, interfaceId: def.interfaceId } },
      });
      if (existing) continue;

      const primaryId = def.band === '2.4' ? 'wlan1' : 'wlan2';
      const primary = await prisma.wirelessInterface.findUnique({
        where: { deviceId_interfaceId: { deviceId, interfaceId: primaryId } },
      });
      const wlans = await this.deviceRepo.getWlanConfigs(deviceId);
      const wlanBand = wlans.find((w) => w.band === def.band);
      const baseSsid = primary?.ssid ?? wlanBand?.ssid ?? 'RGX-Network';
      const baseSecurity = primary?.security ?? wlanBand?.security ?? 'wpa2-psk-aes';
      const basePassword = primary?.password ?? wlanBand?.password ?? '';

      await prisma.wirelessInterface.create({
        data: {
          deviceId,
          interfaceId: def.interfaceId,
          name: def.name,
          interfaceType: 'secondary',
          band: def.band,
          enabled: false,
          hidden: false,
          ssid: `${baseSsid}${def.ssidSuffix}`,
          channel: def.channel,
          channelWidth: def.channelWidth,
          security: baseSecurity,
          password: basePassword,
        },
      });
    }
  }

  async ensureExtraGuestAndMeshInterfaces(deviceId: string): Promise<void> {
    const guest24 = await prisma.wirelessInterface.findUnique({
      where: { deviceId_interfaceId: { deviceId, interfaceId: 'wlan1-1' } },
    });
    if (guest24 && guest24.name === 'Guest WiFi') {
      await prisma.wirelessInterface.update({
        where: { deviceId_interfaceId: { deviceId, interfaceId: 'wlan1-1' } },
        data: { name: 'Guest 2.4 GHz', band: '2.4' },
      });
    }

    for (const def of EXTRA_GUEST_DEFS) {
      const existing = await prisma.wirelessInterface.findUnique({
        where: { deviceId_interfaceId: { deviceId, interfaceId: def.interfaceId } },
      });
      if (existing) continue;

      const guestRef = guest24 ?? await prisma.wirelessInterface.findFirst({
        where: { deviceId, interfaceType: 'guest', band: '2.4' },
      });

      await prisma.wirelessInterface.create({
        data: {
          deviceId,
          interfaceId: def.interfaceId,
          name: def.name,
          interfaceType: 'guest',
          band: def.band,
          enabled: guestRef?.enabled ?? false,
          hidden: false,
          ssid: def.ssid,
          channel: def.channel,
          channelWidth: def.channelWidth,
          security: guestRef?.security ?? 'wpa2-psk-aes',
          password: guestRef?.password ?? 'guest2024',
          isolated: true,
          vlanId: def.vlanId,
        },
      });
    }

    const mesh5 = await prisma.wirelessInterface.findUnique({
      where: { deviceId_interfaceId: { deviceId, interfaceId: 'mesh0' } },
    });
    if (mesh5 && mesh5.name === 'Mesh Backhaul') {
      await prisma.wirelessInterface.update({
        where: { deviceId_interfaceId: { deviceId, interfaceId: 'mesh0' } },
        data: { name: 'Mesh Backhaul 5 GHz' },
      });
    }

    for (const def of EXTRA_MESH_DEFS) {
      const existing = await prisma.wirelessInterface.findUnique({
        where: { deviceId_interfaceId: { deviceId, interfaceId: def.interfaceId } },
      });
      if (existing) continue;

      const meshRef = mesh5 ?? await prisma.wirelessInterface.findFirst({
        where: { deviceId, interfaceType: 'mesh_backhaul' },
      });

      await prisma.wirelessInterface.create({
        data: {
          deviceId,
          interfaceId: def.interfaceId,
          name: def.name,
          interfaceType: 'mesh_backhaul',
          band: def.band,
          enabled: meshRef?.enabled ?? true,
          hidden: true,
          ssid: `mesh-backhaul-${def.interfaceId}`,
          channel: def.channel,
          channelWidth: def.channelWidth,
          security: meshRef?.security ?? 'wpa2-psk-aes',
          password: '',
          backhaulMode: meshRef?.backhaulMode ?? 'wireless',
          linkQuality: meshRef?.linkQuality ?? 88,
          linkStatus: meshRef?.enabled ? 'connected' : 'disconnected',
        },
      });
    }
  }

  async list(deviceId: string): Promise<WirelessInterfaceDto[]> {
    await this.ensureSeeded(deviceId);
    await this.ensureSecondaryInterfaces(deviceId);
    await this.ensureExtraGuestAndMeshInterfaces(deviceId);
    const rows = await prisma.wirelessInterface.findMany({
      where: { deviceId },
      orderBy: [{ interfaceType: 'asc' }, { band: 'asc' }, { interfaceId: 'asc' }],
    });
    return rows.map((r) => this.toDto(r));
  }

  async listBandSteeringEligible(deviceId: string): Promise<WirelessInterfaceDto[]> {
    const all = await this.list(deviceId);
    return all.filter((i) => i.bandSteeringEligible && i.enabled);
  }

  async listClientFacing(deviceId: string): Promise<WirelessInterfaceDto[]> {
    const all = await this.list(deviceId);
    return all.filter((i) => i.interfaceType !== 'mesh_backhaul');
  }

  async getByInterfaceId(deviceId: string, interfaceId: string): Promise<WirelessInterfaceDto | null> {
    await this.ensureSeeded(deviceId);
    const row = await prisma.wirelessInterface.findUnique({
      where: { deviceId_interfaceId: { deviceId, interfaceId } },
    });
    return row ? this.toDto(row) : null;
  }

  async update(deviceId: string, interfaceId: string, data: WirelessInterfaceUpdate): Promise<WirelessInterfaceDto> {
    const row = await prisma.wirelessInterface.findUnique({
      where: { deviceId_interfaceId: { deviceId, interfaceId } },
    });
    if (!row) throw new Error('Wireless interface not found');

    if (row.interfaceType === 'primary' && data.enabled === false) {
      const steering = await prisma.bandSteeringConfig.findUnique({ where: { deviceId } });
      if (steering?.enabled) {
        throw new Error('Cannot disable the main interface while band steering is enabled');
      }
    }

    if (row.interfaceType === 'mesh_backhaul') {
      if (data.ssid !== undefined && !data.hidden) {
        throw new Error('Mesh Backhaul interfaces must remain hidden');
      }
      if (data.hidden === false) {
        throw new Error('Mesh Backhaul interfaces must remain hidden');
      }
    }

    if (row.interfaceType === 'guest' && data.ssid) {
      validateBandSteeringMembership('guest');
    }

    const updated = await prisma.wirelessInterface.update({
      where: { deviceId_interfaceId: { deviceId, interfaceId } },
      data: {
        ...data,
        vlanId: data.vlanId === null ? null : data.vlanId,
        bandwidthLimitMbps: data.bandwidthLimitMbps === null ? null : data.bandwidthLimitMbps,
        scheduleStart: data.scheduleStart === null ? null : data.scheduleStart,
        scheduleEnd: data.scheduleEnd === null ? null : data.scheduleEnd,
      },
    });

    if (updated.interfaceType === 'primary') {
      await this.syncPrimaryToWlanConfig(deviceId, updated);
    }

    if (
      NETWORK_WLAN_INTERFACE_TYPES.includes(updated.interfaceType as WirelessInterfaceType) &&
      (data.channel !== undefined || data.channelWidth !== undefined)
    ) {
      await this.syncBandChannelPlanToNetworkInterfaces(deviceId, updated.band, updated.channel, updated.channelWidth);
    }

    if (updated.interfaceType === 'guest' && interfaceId === 'wlan1-1') {
      await prisma.guestWlanConfig.update({
        where: { deviceId },
        data: {
          enabled: updated.enabled,
          ssid: updated.ssid,
          password: updated.password,
          security: updated.security,
          isolation: updated.isolated,
          band: updated.band,
        },
      });
    }

    await this.logService?.log(deviceId, 'PARAM_CHANGE', `Wireless interface ${interfaceId} updated`);
    return this.toDto(updated);
  }

  async createGuest(deviceId: string, input: GuestWirelessInput): Promise<WirelessInterfaceDto> {
    const check = validateBandSteeringMembership('guest');
    if (!check.valid) {
      // Creating guest — never part of band steering; validation documents intent
    }

    const existing = await prisma.wirelessInterface.count({ where: { deviceId, interfaceType: 'guest' } });
    const interfaceId = `wlan-guest-${existing + 1}`;

    const row = await prisma.wirelessInterface.create({
      data: {
        deviceId,
        interfaceId,
        name: input.name,
        interfaceType: 'guest',
        band: input.band,
        enabled: input.enabled ?? true,
        hidden: false,
        ssid: input.ssid,
        channel: input.band === '5' ? 36 : input.band === '6' ? 37 : 6,
        channelWidth: input.band === '5' ? '80MHz' : '20MHz',
        security: input.security,
        password: input.password,
        isolated: input.isolated ?? true,
        vlanId: input.vlanId ?? 30 + existing,
        bandwidthLimitMbps: input.bandwidthLimitMbps ?? null,
        captivePortal: input.captivePortal ?? false,
        scheduleEnabled: input.scheduleEnabled ?? false,
        scheduleStart: input.scheduleStart ?? null,
        scheduleEnd: input.scheduleEnd ?? null,
        ipv4Enabled: input.ipv4Enabled ?? true,
        ipv6Enabled: input.ipv6Enabled ?? true,
      },
    });

    await this.logService?.log(deviceId, 'PARAM_CHANGE', `Guest wireless interface created: ${interfaceId}`);
    return this.toDto(row);
  }

  async deleteGuest(deviceId: string, interfaceId: string): Promise<void> {
    const row = await prisma.wirelessInterface.findUnique({
      where: { deviceId_interfaceId: { deviceId, interfaceId } },
    });
    if (!row) throw new Error('Wireless interface not found');
    if (row.interfaceType !== 'guest') {
      throw new Error('Only Guest wireless interfaces can be deleted');
    }
    await prisma.wirelessInterface.delete({ where: { deviceId_interfaceId: { deviceId, interfaceId } } });
    await this.logService?.log(deviceId, 'PARAM_CHANGE', `Guest wireless interface removed: ${interfaceId}`);
  }

  async updateMesh(deviceId: string, interfaceId: string, input: MeshBackhaulInput): Promise<WirelessInterfaceDto> {
    const row = await prisma.wirelessInterface.findUnique({
      where: { deviceId_interfaceId: { deviceId, interfaceId } },
    });
    if (!row || row.interfaceType !== 'mesh_backhaul') {
      throw new Error('Mesh Backhaul interface not found');
    }

    const linkQuality = row.linkQuality ?? 90;
    const updated = await prisma.wirelessInterface.update({
      where: { deviceId_interfaceId: { deviceId, interfaceId } },
      data: {
        name: input.name ?? row.name,
        band: input.band,
        enabled: input.enabled ?? row.enabled,
        channel: input.channel,
        channelWidth: input.channelWidth,
        backhaulMode: input.backhaulMode,
        hidden: true,
        linkQuality: Math.max(0, Math.min(100, linkQuality + Math.floor((Math.random() - 0.5) * 4))),
        linkStatus: input.enabled === false ? 'disconnected' : 'connected',
      },
    });

    await this.logService?.log(deviceId, 'PARAM_CHANGE', `Mesh backhaul ${interfaceId} updated`);
    return this.toDto(updated);
  }

  async attemptBandSteeringJoin(deviceId: string, interfaceId: string): Promise<WirelessInterfaceDto> {
    const row = await prisma.wirelessInterface.findUnique({
      where: { deviceId_interfaceId: { deviceId, interfaceId } },
    });
    if (!row) throw new Error('Wireless interface not found');

    const check = validateBandSteeringMembership(row.interfaceType as WirelessInterfaceType);
    if (!check.valid) {
      throw new Error(check.error ?? 'Interface not eligible for Band Steering');
    }

    return this.toDto(row);
  }

  async syncPrimaryFromWlan(deviceId: string, band: string, wlanData: {
    enabled: boolean;
    ssid: string;
    channel: number;
    channelWidth: string;
    security: string;
    password: string;
  }): Promise<void> {
    const interfaceId = band === '2.4' ? 'wlan1' : 'wlan2';
    const existing = await prisma.wirelessInterface.findUnique({
      where: { deviceId_interfaceId: { deviceId, interfaceId } },
    });
    if (!existing) return;

    await prisma.wirelessInterface.update({
      where: { deviceId_interfaceId: { deviceId, interfaceId } },
      data: {
        enabled: wlanData.enabled,
        ssid: wlanData.ssid,
        channel: wlanData.channel,
        channelWidth: wlanData.channelWidth,
        security: wlanData.security,
        password: wlanData.password,
      },
    });

    await this.syncBandChannelPlanToNetworkInterfaces(deviceId, band, wlanData.channel, wlanData.channelWidth);
  }

  private async syncBandChannelPlanToNetworkInterfaces(
    deviceId: string,
    band: string,
    channel: number,
    channelWidth: string,
  ): Promise<void> {
    await prisma.wirelessInterface.updateMany({
      where: {
        deviceId,
        band,
        interfaceType: { in: NETWORK_WLAN_INTERFACE_TYPES },
      },
      data: { channel, channelWidth },
    });

    const primary = await prisma.wirelessInterface.findFirst({
      where: { deviceId, band, interfaceType: 'primary' },
    });
    if (primary) {
      await this.deviceRepo.updateWlanConfig(deviceId, band, {
        enabled: primary.enabled,
        ssid: primary.ssid,
        channel,
        channelWidth,
        security: primary.security,
        password: primary.password,
      });
    }
  }

  private async syncPrimaryToWlanConfig(deviceId: string, row: WirelessRow & { interfaceType: string; band: string }) {
    if (row.interfaceType !== 'primary') return;
    await this.deviceRepo.updateWlanConfig(deviceId, row.band, {
      enabled: row.enabled,
      ssid: row.ssid,
      channel: row.channel,
      channelWidth: row.channelWidth,
      security: row.security,
      password: row.password,
    });
  }

  private toDto(row: NonNullable<WirelessRow>): WirelessInterfaceDto {
    const type = row.interfaceType as WirelessInterfaceType;
    const eligible = isBandSteeringEligible(type);
    return {
      id: row.id,
      interfaceId: row.interfaceId,
      name: row.name,
      interfaceType: type,
      band: row.band as WirelessBand,
      enabled: row.enabled,
      hidden: row.hidden,
      ssid: row.interfaceType === 'mesh_backhaul' ? '' : row.ssid,
      channel: row.channel,
      channelWidth: row.channelWidth,
      security: row.security,
      password: row.password,
      isolated: row.isolated,
      vlanId: row.vlanId,
      bandwidthLimitMbps: row.bandwidthLimitMbps,
      captivePortal: row.captivePortal,
      scheduleEnabled: row.scheduleEnabled,
      scheduleStart: row.scheduleStart,
      scheduleEnd: row.scheduleEnd,
      ipv4Enabled: row.ipv4Enabled,
      ipv6Enabled: row.ipv6Enabled,
      backhaulMode: row.backhaulMode as WirelessInterfaceDto['backhaulMode'],
      linkQuality: row.linkQuality,
      linkStatus: row.linkStatus as WirelessInterfaceDto['linkStatus'],
      bandSteeringEligible: eligible,
      bandSteeringWarning: getBandSteeringWarning(type),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
