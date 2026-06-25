import { getDevicePreset, type DevicePresetId } from '@aerobrry/shared';
import type { PrismaDeviceRepository } from '../../infrastructure/database/repositories/PrismaDeviceRepository.js';
import type { ParameterTreeService } from './ParameterTreeService.js';
import type { SecurityService } from './SecurityService.js';
import type { LogService } from './LogService.js';
import { prisma } from '../../infrastructure/database/prisma.js';

export class DevicePresetService {
  constructor(
    private readonly deviceRepo: PrismaDeviceRepository,
    private readonly securityService: SecurityService,
    private readonly parameterTree: ParameterTreeService,
    private readonly logService?: LogService,
  ) {}

  async apply(deviceId: string, presetId: DevicePresetId) {
    const preset = getDevicePreset(presetId);
    if (!preset) throw new Error('Unknown configuration preset');

    switch (presetId) {
      case 'factory-default':
        await this.applyFactoryDefault(deviceId);
        break;
      case 'isp-home':
        await this.applyIspHome(deviceId);
        break;
      case 'bridge-mode':
        await this.applyBridgeMode(deviceId);
        break;
      case 'secure-guest':
        await this.applyIspHome(deviceId);
        await this.applySecureGuest(deviceId);
        break;
      default:
        throw new Error('Unknown configuration preset');
    }

    await this.parameterTree.syncFromDomainModels(deviceId);

    if (this.logService) {
      await this.logService.log(deviceId, 'SYSTEM', `Configuration preset applied: ${preset.label}`);
    }

    return {
      presetId,
      label: preset.label,
      success: true,
      message: `${preset.label} preset applied successfully`,
    };
  }

  async applyFactoryDefault(deviceId: string) {
    await this.deviceRepo.updateWanConfig(deviceId, {
      connectionType: 'DHCP',
      ipAddress: '192.0.2.10',
      subnetMask: '255.255.255.0',
      gateway: '192.0.2.1',
      dnsPrimary: '8.8.8.8',
      dnsSecondary: '8.8.4.4',
    });
    await this.deviceRepo.updateLanConfig(deviceId, {
      ipAddress: '192.168.1.1',
      subnetMask: '255.255.255.0',
      dhcpEnabled: true,
      dhcpRangeStart: '192.168.1.100',
      dhcpRangeEnd: '192.168.1.200',
    });

    const factoryRow = await this.securityService.getSettingsRow(deviceId);
    if (factoryRow.factorySsid && factoryRow.factoryWifiPassword) {
      for (const band of ['2.4', '5'] as const) {
        await this.deviceRepo.updateWlanConfig(deviceId, band, {
          enabled: true,
          ssid: factoryRow.factorySsid,
          password: factoryRow.factoryWifiPassword,
          security: 'wpa2-psk-aes',
        });
      }
    }

    await prisma.bandSteeringConfig.update({
      where: { deviceId },
      data: { enabled: true, prefer5G: true, clientSteering: true },
    });

    await prisma.guestWlanConfig.updateMany({
      where: { deviceId },
      data: { enabled: false },
    });
    await prisma.wirelessInterface.updateMany({
      where: { deviceId, interfaceType: 'guest' },
      data: { enabled: false },
    });

    await this.deviceRepo.resetMetrics(deviceId);
  }

  private async applyIspHome(deviceId: string) {
    await this.deviceRepo.updateWanConfig(deviceId, {
      connectionType: 'DHCP',
      ipAddress: '0.0.0.0',
      subnetMask: '255.255.255.0',
      gateway: '0.0.0.0',
      dnsPrimary: '8.8.8.8',
      dnsSecondary: '8.8.4.4',
    });
    await this.deviceRepo.updateLanConfig(deviceId, {
      ipAddress: '192.168.1.1',
      subnetMask: '255.255.255.0',
      dhcpEnabled: true,
      dhcpRangeStart: '192.168.1.100',
      dhcpRangeEnd: '192.168.1.200',
    });

    const wlans = await this.deviceRepo.getWlanConfigs(deviceId);
    for (const wlan of wlans) {
      await this.deviceRepo.updateWlanConfig(deviceId, wlan.band, {
        enabled: true,
        security: wlan.security || 'wpa2-psk-aes',
      });
    }

    await prisma.bandSteeringConfig.update({
      where: { deviceId },
      data: { enabled: true, prefer5G: true, clientSteering: true },
    });
  }

  private async applyBridgeMode(deviceId: string) {
    await this.deviceRepo.updateWanConfig(deviceId, {
      connectionType: 'Bridge',
      ipAddress: '0.0.0.0',
      subnetMask: '255.255.255.0',
      gateway: '0.0.0.0',
    });
    await this.deviceRepo.updateLanConfig(deviceId, {
      dhcpEnabled: false,
    });
    await prisma.bandSteeringConfig.update({
      where: { deviceId },
      data: { enabled: false },
    });
  }

  private async applySecureGuest(deviceId: string) {
    const guest = await prisma.guestWlanConfig.findUnique({ where: { deviceId } });
    if (guest) {
      await prisma.guestWlanConfig.update({
        where: { deviceId },
        data: { enabled: true, isolation: true, band: '2.4' },
      });
    } else {
      await prisma.guestWlanConfig.create({
        data: {
          deviceId,
          enabled: true,
          ssid: 'RGX-Guest',
          password: 'guest2024',
          security: 'wpa2-psk-aes',
          isolation: true,
          band: '2.4',
        },
      });
    }
    await prisma.wirelessInterface.updateMany({
      where: { deviceId, interfaceType: 'guest', band: '2.4' },
      data: { enabled: true, isolated: true },
    });
  }
}
