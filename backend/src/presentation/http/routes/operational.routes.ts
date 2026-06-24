import { Router } from 'express';
import type { OperationalDashboardService } from '../../../application/services/OperationalDashboardService.js';
import type { PrismaDeviceRepository } from '../../../infrastructure/database/repositories/PrismaDeviceRepository.js';

export function createOperationalRoutes(
  operational: OperationalDashboardService,
  deviceRepo: PrismaDeviceRepository,
) {
  const router = Router();

  router.get('/dashboard', async (_req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      res.json(await operational.getOperationalDashboard(device.id));
    } catch (e) {
      next(e);
    }
  });

  router.get('/tr069/management', async (_req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      res.json(await operational.getTr069Management(device.id));
    } catch (e) {
      next(e);
    }
  });

  router.get('/tr069/events', async (req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      const search = req.query.search as string | undefined;
      res.json(await operational.getTr069Events(device.id, search));
    } catch (e) {
      next(e);
    }
  });

  router.get('/tr069/parameters', async (req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      const search = req.query.search as string | undefined;
      res.json(await operational.getParameterTree(device.id, search));
    } catch (e) {
      next(e);
    }
  });

  router.put('/tr069/parameters', async (req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      const { path, value } = req.body;
      await operational.updateParameter(device.id, path, value);
      res.json({ success: true });
    } catch (e) {
      next(e);
    }
  });

  router.get('/pon/status', async (_req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      res.json(await operational.getPonStatus(device.id));
    } catch (e) {
      next(e);
    }
  });

  router.get('/hosts/extended', async (_req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      res.json(await operational.getExtendedHosts(device.id));
    } catch (e) {
      next(e);
    }
  });

  return router;
}
