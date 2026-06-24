import { Router } from 'express';
import type { DeviceSimulatorService } from '../../../application/services/DeviceSimulatorService.js';
import type { PrismaDeviceRepository } from '../../../infrastructure/database/repositories/PrismaDeviceRepository.js';

export function createDashboardRoutes(simulator: DeviceSimulatorService, deviceRepo: PrismaDeviceRepository) {
  const router = Router();

  router.get('/', async (_req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) {
        res.status(404).json({ error: 'Not Found', message: 'No device' });
        return;
      }
      const data = await simulator.getDashboard(device.id);
      res.json(data);
    } catch (e) {
      next(e);
    }
  });

  return router;
}
