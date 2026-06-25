import { Router } from 'express';
import { z } from 'zod';
import type { ParameterTreeService } from '../../../application/services/ParameterTreeService.js';
import type { LogService } from '../../../application/services/LogService.js';
import type { SecurityService } from '../../../application/services/SecurityService.js';
import type { WifiSecurityValidator } from '../../../application/services/security/WifiSecurityValidator.js';
import type { PrismaDeviceRepository } from '../../../infrastructure/database/repositories/PrismaDeviceRepository.js';
import { prisma } from '../../../infrastructure/database/prisma.js';
import type { WirelessInterfaceService } from '../../../application/services/WirelessInterfaceService.js';

const wlanSchema = z.object({
  enabled: z.boolean(),
  ssid: z.string(),
  channel: z.number(),
  channelWidth: z.string(),
  security: z.string(),
  password: z.string(),
});

export function createWlanRoutes(
  deviceRepo: PrismaDeviceRepository,
  parameterTree: ParameterTreeService,
  logService: LogService,
  securityService: SecurityService,
  wifiValidator: WifiSecurityValidator,
  wirelessService: WirelessInterfaceService,
) {
  const router = Router();

  router.get('/', async (_req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      const wlans = await deviceRepo.getWlanConfigs(device.id);
      res.json(wlans);
    } catch (e) {
      next(e);
    }
  });

  router.put('/:band', async (req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      const band = req.params.band;
      if (band !== '2.4' && band !== '5') {
        return res.status(400).json({ error: 'Bad Request', message: 'Invalid band' });
      }
      const data = wlanSchema.parse(req.body);

      const steering = await prisma.bandSteeringConfig.findUnique({ where: { deviceId: device.id } });
      if (steering?.enabled && !data.enabled) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Cannot disable Wi-Fi radios while band steering is enabled.',
        });
      }
      if (steering?.enabled) {
        data.enabled = true;
      }

      const settings = await securityService.getSettings(device.id);
      const result = wifiValidator.validate(settings.securityProfile, data.security, data.password, data.enabled);
      if (!result.valid) {
        return res.status(400).json({ error: 'Bad Request', message: result.errors.join('. '), warnings: result.warnings });
      }

      const wlan = await deviceRepo.updateWlanConfig(device.id, band, data);
      await wirelessService.syncPrimaryFromWlan(device.id, band, data);

      if (steering?.enabled) {
        const otherBand = band === '2.4' ? '5' : '2.4';
        await deviceRepo.updateWlanConfig(device.id, otherBand, {
          ssid: data.ssid,
          security: data.security,
          password: data.password,
          enabled: true,
        });
      }

      await parameterTree.syncFromDomainModels(device.id);
      await logService.log(device.id, 'PARAM_CHANGE', `WLAN ${band} GHz updated`, JSON.stringify(data));
      res.json(wlan);
    } catch (e) {
      next(e);
    }
  });

  return router;
}
