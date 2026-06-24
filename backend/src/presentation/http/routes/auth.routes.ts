import { Router } from 'express';
import { z } from 'zod';
import { validateAdminPasswordPolicy } from '@routergui/shared';
import type { AuthService } from '../../../application/services/AuthService.js';
import type { LogService } from '../../../application/services/LogService.js';
import type { SecurityService } from '../../../application/services/SecurityService.js';
import type { PrismaDeviceRepository } from '../../../infrastructure/database/repositories/PrismaDeviceRepository.js';

export function createAuthRoutes(
  authService: AuthService,
  logService: LogService,
  deviceRepo: PrismaDeviceRepository,
  securityService: SecurityService,
) {
  const router = Router();

  router.post('/login', async (req, res, next) => {
    try {
      const schema = z.object({ username: z.string(), password: z.string() });
      const { username, password } = schema.parse(req.body);
      const result = await authService.login(username, password);
      if (!result) {
        res.status(401).json({ error: 'Unauthorized', message: 'Invalid credentials' });
        return;
      }
      const device = await deviceRepo.findDefault();
      if (device) {
        await logService.log(device.id, 'LOGIN', `User ${username} logged in`);
      }
      res.json(result);
    } catch (e) {
      next(e);
    }
  });

  router.post('/change-password', async (req, res, next) => {
    try {
      const schema = z.object({
        username: z.string(),
        currentPassword: z.string(),
        newPassword: z.string().min(1).max(128),
      });
      const { username, currentPassword, newPassword } = schema.parse(req.body);

      const device = await deviceRepo.findDefault();
      const settings = device ? await securityService.getSettings(device.id) : null;
      const profile = settings?.securityProfile ?? 'isp-standard';

      const policy = validateAdminPasswordPolicy(profile, newPassword);
      if (!policy.valid) {
        return res.status(400).json({ error: 'Bad Request', message: policy.errors.join('. ') });
      }

      const result = await authService.changePassword(
        username,
        currentPassword,
        newPassword,
        settings?.passwordHashAlgorithm ?? 'bcrypt',
      );
      if (!result.ok) {
        return res.status(400).json({ error: 'Bad Request', message: result.error });
      }
      if (device) await logService.log(device.id, 'SECURITY', `Password changed for ${username}`);
      res.json({ success: true });
    } catch (e) {
      next(e);
    }
  });

  return router;
}
