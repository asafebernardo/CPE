import { Router } from 'express';
import { z } from 'zod';
import type { SecurityService } from '../../../application/services/SecurityService.js';
import type { SecurityProfileService } from '../../../application/services/security/SecurityProfileService.js';
import type { SecurityAuditService } from '../../../application/services/security/SecurityAuditService.js';
import type { PasswordPolicyService } from '../../../application/services/security/PasswordPolicyService.js';
import type { UserManagementService } from '../../../application/services/UserManagementService.js';
import type { PrismaDeviceRepository } from '../../../infrastructure/database/repositories/PrismaDeviceRepository.js';
import { prisma } from '../../../infrastructure/database/prisma.js';
import { ROLE_LEVEL, type UserRole } from '@routergui/shared';
import type { Request } from 'express';

const updateUserSchema = z.object({
  username: z.string().min(3).max(32).regex(/^[a-zA-Z0-9._-]+$/).optional(),
  role: z.enum(['USER', 'TECHNICIAN', 'ADMIN']).optional(),
  password: z.string().min(1).max(128).optional(),
  enabled: z.boolean().optional(),
  mustChangePassword: z.boolean().optional(),
});

async function getActorRole(req: Request): Promise<UserRole | null> {
  const authUser = (req as Request & { user?: { userId: string } }).user;
  if (!authUser?.userId) return null;
  const actor = await prisma.user.findUnique({ where: { id: authUser.userId } });
  return actor ? (actor.role as UserRole) : null;
}

function hasMinRole(actorRole: UserRole, minRole: UserRole): boolean {
  return ROLE_LEVEL[actorRole] >= ROLE_LEVEL[minRole];
}

const settingsSchema = z.object({
  securityProfile: z.enum(['legacy', 'isp-standard', 'anatel']),
  forcePasswordChange: z.boolean(),
  passwordHashAlgorithm: z.enum(['plain', 'md5', 'sha1', 'sha256', 'sha512', 'pbkdf2', 'bcrypt', 'argon2i', 'argon2id']),
  credentialEncryptionType: z.enum(['plain', 'base64', 'aes-128', 'aes-256']),
  backupEncryptionType: z.enum(['none', 'zip-password', 'aes-128', 'aes-256']),
  legacyCompatibility: z.boolean(),
});

const profileSchema = z.object({ profile: z.enum(['legacy', 'isp-standard', 'anatel']) });
const strengthSchema = z.object({ password: z.string().max(128) });

const certSchema = z.object({
  type: z.enum(['rsa-1024', 'rsa-2048', 'rsa-4096', 'ecdsa-p256', 'ecdsa-p384', 'ecdsa-p521']),
});

const hashPreviewSchema = z.object({
  algorithm: z.enum(['plain', 'md5', 'sha1', 'sha256', 'sha512', 'pbkdf2', 'bcrypt', 'argon2i', 'argon2id']),
  input: z.string().max(128).optional(),
});

export function createSecurityRoutes(
  deviceRepo: PrismaDeviceRepository,
  securityService: SecurityService,
  profileService: SecurityProfileService,
  auditService: SecurityAuditService,
  policyService: PasswordPolicyService,
  userManagementService: UserManagementService,
) {
  const router = Router();

  router.get('/profile', async (_req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      res.json({ profile: await profileService.getProfile(device.id) });
    } catch (e) {
      next(e);
    }
  });

  router.put('/profile', async (req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      const { profile } = profileSchema.parse(req.body);
      await profileService.setProfile(device.id, profile);
      res.json(await securityService.getSettings(device.id));
    } catch (e) {
      next(e);
    }
  });

  router.get('/audit', async (_req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      res.json(await auditService.generateReport(device.id));
    } catch (e) {
      next(e);
    }
  });

  router.post('/password-strength', async (req, res, next) => {
    try {
      const { password } = strengthSchema.parse(req.body);
      res.json(policyService.strength(password));
    } catch (e) {
      next(e);
    }
  });

  router.get('/settings', async (_req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      res.json(await securityService.getSettings(device.id));
    } catch (e) {
      next(e);
    }
  });

  router.put('/settings', async (req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      const data = settingsSchema.parse(req.body);
      res.json(await securityService.updateSettings(device.id, data));
    } catch (e) {
      next(e);
    }
  });

  router.get('/score', async (_req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      res.json(await securityService.computeScore(device.id));
    } catch (e) {
      next(e);
    }
  });

  router.post('/certificate', async (req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      const { type } = certSchema.parse(req.body);
      res.json(await securityService.generateCertificate(device.id, type));
    } catch (e) {
      next(e);
    }
  });

  router.post('/hash-preview', async (req, res, next) => {
    try {
      const { algorithm, input } = hashPreviewSchema.parse(req.body);
      res.json(await securityService.hashPreview(algorithm, input ?? ''));
    } catch (e) {
      next(e);
    }
  });

  router.get('/users', async (req, res, next) => {
    try {
      const actorRole = await getActorRole(req);
      if (!actorRole || !hasMinRole(actorRole, 'TECHNICIAN')) {
        return res.status(403).json({ error: 'Forbidden', message: 'Insufficient permissions' });
      }
      res.json(await userManagementService.list());
    } catch (e) {
      next(e);
    }
  });

  router.put('/users/:id', async (req, res, next) => {
    try {
      const actorRole = await getActorRole(req);
      if (!actorRole || !hasMinRole(actorRole, 'ADMIN')) {
        return res.status(403).json({ error: 'Forbidden', message: 'Admin role required' });
      }
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      const data = updateUserSchema.parse(req.body);
      const settings = await securityService.getSettings(device.id);
      const user = await userManagementService.update(req.params.id, data, {
        passwordHashAlgorithm: settings.passwordHashAlgorithm,
        securityProfile: settings.securityProfile,
        deviceId: device.id,
      });
      res.json(user);
    } catch (e) {
      if (e instanceof Error && (
        e.message.includes('not found') ||
        e.message.includes('administrator') ||
        e.message.includes('password') ||
        e.message.includes('Username') ||
        e.message.includes('disabled')
      )) {
        return res.status(400).json({ error: 'Bad Request', message: e.message });
      }
      next(e);
    }
  });

  return router;
}
