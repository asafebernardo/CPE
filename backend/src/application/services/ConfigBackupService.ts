import { prisma } from '../../infrastructure/database/prisma.js';

export class ConfigBackupService {
  async createBackup(deviceId: string, label?: string) {
    const device = await prisma.virtualDevice.findUnique({
      where: { id: deviceId },
      include: {
        wanConfig: true,
        lanConfig: true,
        wlanConfigs: true,
        firewallRules: true,
        portForwards: true,
        dmzConfig: true,
        cwmpSession: true,
        parameters: true,
      },
    });

    if (!device) throw new Error('Device not found');

    const snapshot = await prisma.deviceSnapshot.create({
      data: {
        deviceId,
        label: label ?? `Backup ${new Date().toISOString()}`,
        data: JSON.stringify(device),
      },
    });

    return { id: snapshot.id, createdAt: snapshot.createdAt.toISOString(), label: snapshot.label };
  }

  async restoreBackup(deviceId: string, snapshotId: string) {
    const snapshot = await prisma.deviceSnapshot.findFirst({
      where: { id: snapshotId, deviceId },
    });
    if (!snapshot) throw new Error('Snapshot not found');

    const data = JSON.parse(snapshot.data);

    if (data.wanConfig) {
      await prisma.wanConfig.update({
        where: { deviceId },
        data: {
          connectionType: data.wanConfig.connectionType,
          ipAddress: data.wanConfig.ipAddress,
          subnetMask: data.wanConfig.subnetMask,
          gateway: data.wanConfig.gateway,
          dnsPrimary: data.wanConfig.dnsPrimary,
          dnsSecondary: data.wanConfig.dnsSecondary,
        },
      });
    }

    if (data.lanConfig) {
      await prisma.lanConfig.update({
        where: { deviceId },
        data: {
          ipAddress: data.lanConfig.ipAddress,
          subnetMask: data.lanConfig.subnetMask,
          dhcpEnabled: data.lanConfig.dhcpEnabled,
          dhcpRangeStart: data.lanConfig.dhcpRangeStart,
          dhcpRangeEnd: data.lanConfig.dhcpRangeEnd,
        },
      });
    }

    for (const wlan of data.wlanConfigs ?? []) {
      await prisma.wlanConfig.update({
        where: { deviceId_band: { deviceId, band: wlan.band } },
        data: {
          enabled: wlan.enabled,
          ssid: wlan.ssid,
          channel: wlan.channel,
          channelWidth: wlan.channelWidth,
          security: wlan.security,
          password: wlan.password,
        },
      });
    }

    return { success: true };
  }

  async listBackups(deviceId: string) {
    const snapshots = await prisma.deviceSnapshot.findMany({
      where: { deviceId },
      orderBy: { createdAt: 'desc' },
    });
    return snapshots.map((s) => ({
      id: s.id,
      label: s.label,
      createdAt: s.createdAt.toISOString(),
    }));
  }
}
