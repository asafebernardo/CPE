import { Router } from 'express';
import { z } from 'zod';
import type { ParameterTreeService } from '../../../application/services/ParameterTreeService.js';
import type { LogService } from '../../../application/services/LogService.js';
import type { PrismaDeviceRepository } from '../../../infrastructure/database/repositories/PrismaDeviceRepository.js';

const lanSchema = z.object({
  ipAddress: z.string(),
  subnetMask: z.string(),
  dhcpEnabled: z.boolean(),
  dhcpRangeStart: z.string(),
  dhcpRangeEnd: z.string(),
});

export function createLanRoutes(
  deviceRepo: PrismaDeviceRepository,
  parameterTree: ParameterTreeService,
  logService: LogService,
) {
  const router = Router();

  router.get('/', async (_req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      const lan = await deviceRepo.getLanConfig(device.id);
      res.json(lan);
    } catch (e) {
      next(e);
    }
  });

  router.put('/', async (req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      const data = lanSchema.parse(req.body);
      const lan = await deviceRepo.updateLanConfig(device.id, data);
      await parameterTree.syncFromDomainModels(device.id);
      await logService.log(device.id, 'PARAM_CHANGE', 'LAN configuration updated', JSON.stringify(data));
      res.json(lan);
    } catch (e) {
      next(e);
    }
  });

  return router;
}
