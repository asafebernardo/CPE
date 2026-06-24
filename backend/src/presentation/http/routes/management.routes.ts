import { Router } from 'express';
import type { ConfigBackupService } from '../../../application/services/ConfigBackupService.js';
import type { ParameterTreeService } from '../../../application/services/ParameterTreeService.js';
import type { LogService } from '../../../application/services/LogService.js';
import type { SecurityService } from '../../../application/services/SecurityService.js';
import type { PrismaDeviceRepository } from '../../../infrastructure/database/repositories/PrismaDeviceRepository.js';
import type { InformScheduler } from '../../../infrastructure/cwmp/InformScheduler.js';

export function createManagementRoutes(
  backupService: ConfigBackupService,
  deviceRepo: PrismaDeviceRepository,
  parameterTree: ParameterTreeService,
  logService: LogService,
  informScheduler: InformScheduler,
  securityService: SecurityService,
) {
  const router = Router();

  router.get('/backups', async (_req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      res.json(await backupService.listBackups(device.id));
    } catch (e) {
      next(e);
    }
  });

  router.post('/backup', async (req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      const backup = await backupService.createBackup(device.id, req.body.label);
      await logService.log(device.id, 'SYSTEM', 'Configuration backup created', backup.label);
      res.status(201).json(backup);
    } catch (e) {
      next(e);
    }
  });

  router.post('/restore', async (req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      const { snapshotId } = req.body;
      await backupService.restoreBackup(device.id, snapshotId);
      await parameterTree.syncFromDomainModels(device.id);
      await logService.log(device.id, 'SYSTEM', 'Configuration restored', snapshotId);
      res.json({ success: true });
    } catch (e) {
      next(e);
    }
  });

  router.post('/reboot', async (_req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      await deviceRepo.resetMetrics(device.id);
      await logService.log(device.id, 'SYSTEM', 'System reboot initiated');
      res.json({ success: true, message: 'Reboot simulated' });
    } catch (e) {
      next(e);
    }
  });

  router.post('/factory-reset', async (_req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      await deviceRepo.updateWanConfig(device.id, {
        connectionType: 'DHCP',
        ipAddress: '192.0.2.10',
        subnetMask: '255.255.255.0',
        gateway: '192.0.2.1',
        dnsPrimary: '8.8.8.8',
        dnsSecondary: '8.8.4.4',
      });
      await deviceRepo.updateLanConfig(device.id, {
        ipAddress: '192.168.1.1',
        subnetMask: '255.255.255.0',
        dhcpEnabled: true,
        dhcpRangeStart: '192.168.1.100',
        dhcpRangeEnd: '192.168.1.200',
      });

      const factoryRow = await securityService.getSettingsRow(device.id);
      if (factoryRow.factorySsid && factoryRow.factoryWifiPassword) {
        const bands: Array<'2.4' | '5'> = ['2.4', '5'];
        for (const band of bands) {
          await deviceRepo.updateWlanConfig(device.id, band, {
            ssid: factoryRow.factorySsid,
            password: factoryRow.factoryWifiPassword,
            security: 'wpa2-psk-aes',
          });
        }
      }

      await parameterTree.syncFromDomainModels(device.id);
      await deviceRepo.resetMetrics(device.id);
      await logService.log(device.id, 'SYSTEM', 'Factory reset completed — Wi-Fi credentials restored');
      res.json({ success: true, ssid: factoryRow.factorySsid });
    } catch (e) {
      next(e);
    }
  });

  return router;
}

export function createAcsRoutes(
  deviceRepo: PrismaDeviceRepository,
  cwmpClient: { runSession: (deviceId: string, events: Array<{ eventCode: string }>) => Promise<void> },
  informScheduler: InformScheduler,
  logService: LogService,
) {
  const router = Router();

  router.get('/status', async (_req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      const { prisma } = await import('../../../infrastructure/database/prisma.js');
      const session = await prisma.cwmpSession.findUnique({ where: { deviceId: device.id } });
      res.json({
        url: session?.acsUrl ?? '',
        configured: Boolean(session?.acsUrl),
        lastInform: session?.lastInform?.toISOString() ?? null,
        lastEventCodes: JSON.parse(session?.lastEventCodes ?? '[]'),
        sessionState: session?.sessionState ?? 'idle',
        periodicInformEnabled: session?.periodicInformEnabled ?? false,
        periodicInformInterval: session?.periodicInformInterval ?? 300,
      });
    } catch (e) {
      next(e);
    }
  });

  router.put('/config', async (req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      const { prisma } = await import('../../../infrastructure/database/prisma.js');
      const { url, username, password, periodicInformEnabled, periodicInformInterval } = req.body;
      const current = await prisma.cwmpSession.findUnique({ where: { deviceId: device.id } });
      const urlChanged = current?.acsUrl !== url;
      await prisma.cwmpSession.update({
        where: { deviceId: device.id },
        data: {
          acsUrl: url,
          acsUsername: username ?? '',
          acsPassword: password ?? '',
          periodicInformEnabled,
          periodicInformInterval,
          // Re-announce (0 BOOTSTRAP) when pointed at a different ACS.
          ...(urlChanged ? { bootstrapSent: false } : {}),
        },
      });
      await informScheduler.restart(device.id);
      await logService.log(device.id, 'PARAM_CHANGE', 'ACS configuration updated', url);
      res.json({ success: true });
    } catch (e) {
      next(e);
    }
  });

  router.post('/inform', async (_req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      await cwmpClient.runSession(device.id, [{ eventCode: '2 PERIODIC' }]);
      res.json({ success: true });
    } catch (e) {
      next(e);
    }
  });

  router.post('/connection-request', async (_req, res) => {
    res.json({ success: true, message: 'Connection request simulated' });
  });

  return router;
}
