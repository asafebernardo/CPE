import { Router } from 'express';
import { z } from 'zod';
import type { DeviceSimulatorService } from '../../../application/services/DeviceSimulatorService.js';
import type { CpeSimulatorService } from '../../../application/services/CpeSimulatorService.js';
import type { LogService } from '../../../application/services/LogService.js';
import type { PrismaDeviceRepository } from '../../../infrastructure/database/repositories/PrismaDeviceRepository.js';

export function createDiagnosticRoutes(
  simulator: DeviceSimulatorService,
  cpe: CpeSimulatorService,
  logService: LogService,
  deviceRepo: PrismaDeviceRepository,
) {
  const router = Router();

  router.post('/ping', async (req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      const schema = z.object({ target: z.string(), count: z.number().optional() });
      const { target, count } = schema.parse(req.body);
      const result = await simulator.runPing(target, count);
      await logService.log(device.id, 'DIAGNOSTIC', `Ping to ${target}`, JSON.stringify(result));
      res.json(result);
    } catch (e) {
      next(e);
    }
  });

  router.post('/traceroute', async (req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      const schema = z.object({ target: z.string(), maxHops: z.number().optional() });
      const { target, maxHops } = schema.parse(req.body);
      const result = await simulator.runTraceroute(target, maxHops);
      await logService.log(device.id, 'DIAGNOSTIC', `Traceroute to ${target}`, JSON.stringify(result));
      res.json(result);
    } catch (e) {
      next(e);
    }
  });

  router.post('/speedtest', async (_req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      res.json(await cpe.runSpeedTest(device.id));
    } catch (e) {
      next(e);
    }
  });

  router.get('/speedtest/history', async (_req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      res.json(await cpe.getSpeedTestHistory(device.id));
    } catch (e) {
      next(e);
    }
  });

  return router;
}
