import { Router } from 'express';
import type { ConfigBackupService } from '../../../application/services/ConfigBackupService.js';
import type { DevicePresetService } from '../../../application/services/DevicePresetService.js';
import type { ParameterTreeService } from '../../../application/services/ParameterTreeService.js';
import type { LogService } from '../../../application/services/LogService.js';
import type { SecurityService } from '../../../application/services/SecurityService.js';
import type { PrismaDeviceRepository } from '../../../infrastructure/database/repositories/PrismaDeviceRepository.js';
import type { InformScheduler } from '../../../infrastructure/cwmp/InformScheduler.js';
import { getConnectionRequestInfo } from '../../../config/connectionRequest.js';

import { z } from 'zod';
import { DEVICE_PRESETS, clampPeriodicInformInterval } from '@routergui/shared';

const acsConfigSchema = z.object({
  url: z.string(),
  username: z.string().optional(),
  password: z.string().optional(),
  periodicInformEnabled: z.boolean().optional(),
  periodicInformInterval: z.coerce.number().int().min(10).optional(),
});

const applyPresetSchema = z.object({
  presetId: z.enum(['factory-default', 'isp-home', 'bridge-mode', 'secure-guest']),
});

export function createManagementRoutes(
  backupService: ConfigBackupService,
  deviceRepo: PrismaDeviceRepository,
  parameterTree: ParameterTreeService,
  logService: LogService,
  informScheduler: InformScheduler,
  securityService: SecurityService,
  devicePresetService: DevicePresetService,
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
      const result = await devicePresetService.apply(device.id, 'factory-default');
      res.json({ ...result, ssid: (await securityService.getSettingsRow(device.id)).factorySsid });
    } catch (e) {
      next(e);
    }
  });

  router.get('/presets', (_req, res) => {
    res.json(DEVICE_PRESETS);
  });

  router.post('/apply-preset', async (req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      const { presetId } = applyPresetSchema.parse(req.body);
      const result = await devicePresetService.apply(device.id, presetId);
      res.json(result);
    } catch (e) {
      if (e instanceof Error && e.message.includes('Unknown')) {
        return res.status(400).json({ error: 'Bad Request', message: e.message });
      }
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
  parameterTree: ParameterTreeService,
) {
  const router = Router();

  router.get('/status', async (_req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      const { prisma } = await import('../../../infrastructure/database/prisma.js');
      const session = await prisma.cwmpSession.findUnique({ where: { deviceId: device.id } });
      const cr = getConnectionRequestInfo();
      res.json({
        url: session?.acsUrl ?? '',
        configured: Boolean(session?.acsUrl),
        lastInform: session?.lastInform?.toISOString() ?? null,
        lastEventCodes: JSON.parse(session?.lastEventCodes ?? '[]'),
        sessionState: session?.sessionState ?? 'idle',
        periodicInformEnabled: session?.periodicInformEnabled ?? false,
        periodicInformInterval: session?.periodicInformInterval ?? 300,
        connectionRequestUrl: cr.url,
        connectionRequestBlocked: cr.blocked,
        connectionRequestWarning: cr.warning,
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
      const { url, username, password, periodicInformEnabled, periodicInformInterval } = acsConfigSchema.parse(req.body);
      const current = await prisma.cwmpSession.findUnique({ where: { deviceId: device.id } });
      const urlChanged = current?.acsUrl !== url;
      const interval = periodicInformInterval !== undefined
        ? clampPeriodicInformInterval(periodicInformInterval)
        : current?.periodicInformInterval ?? 300;
      await prisma.cwmpSession.update({
        where: { deviceId: device.id },
        data: {
          acsUrl: url,
          acsUsername: username ?? '',
          acsPassword: password ?? '',
          periodicInformEnabled: periodicInformEnabled ?? current?.periodicInformEnabled ?? true,
          periodicInformInterval: interval,
          // Re-announce (0 BOOTSTRAP) when pointed at a different ACS.
          ...(urlChanged ? { bootstrapSent: false } : {}),
        },
      });
      await informScheduler.restart(device.id);
      await parameterTree.syncFromDomainModels(device.id);
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

  router.post('/connection-request', async (_req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      await cwmpClient.runSession(device.id, [{ eventCode: '6 CONNECTION REQUEST' }]);
      res.json({ success: true, message: 'Connection request session completed' });
    } catch (e) {
      next(e);
    }
  });

  return router;
}
