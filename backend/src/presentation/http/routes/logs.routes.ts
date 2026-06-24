import { Router } from 'express';
import type { LogService } from '../../../application/services/LogService.js';
import type { PrismaDeviceRepository } from '../../../infrastructure/database/repositories/PrismaDeviceRepository.js';

export function createLogsRoutes(logService: LogService, deviceRepo: PrismaDeviceRepository) {
  const router = Router();

  router.get('/', async (req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      const type = req.query.type as string | undefined;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const { entries, total } = await logService.getLogs(device.id, { type, page, limit });
      res.json({
        entries: entries.map((e) => ({
          id: e.id,
          type: e.type,
          message: e.message,
          details: e.details,
          createdAt: e.createdAt.toISOString(),
        })),
        total,
        page,
        limit,
      });
    } catch (e) {
      next(e);
    }
  });

  return router;
}
