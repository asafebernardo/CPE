import { Router } from 'express';
import { z } from 'zod';
import type { WirelessInterfaceService } from '../../../application/services/WirelessInterfaceService.js';
import type { SecurityService } from '../../../application/services/SecurityService.js';
import type { WifiSecurityValidator } from '../../../application/services/security/WifiSecurityValidator.js';
import type { PrismaDeviceRepository } from '../../../infrastructure/database/repositories/PrismaDeviceRepository.js';

const guestSchema = z.object({
  name: z.string().min(1).max(40),
  ssid: z.string().min(1).max(32),
  band: z.enum(['2.4', '5', '6']),
  enabled: z.boolean().optional(),
  security: z.string(),
  password: z.string(),
  isolated: z.boolean().optional(),
  vlanId: z.number().int().min(1).max(4094).optional(),
  bandwidthLimitMbps: z.number().int().min(1).max(10000).optional(),
  captivePortal: z.boolean().optional(),
  scheduleEnabled: z.boolean().optional(),
  scheduleStart: z.string().optional(),
  scheduleEnd: z.string().optional(),
  ipv4Enabled: z.boolean().optional(),
  ipv6Enabled: z.boolean().optional(),
});

const meshSchema = z.object({
  name: z.string().min(1).max(40).optional(),
  band: z.enum(['2.4', '5', '6']),
  enabled: z.boolean().optional(),
  channel: z.number().int(),
  channelWidth: z.string(),
  backhaulMode: z.enum(['wired', 'wireless']),
});

const updateSchema = z.object({
  name: z.string().min(1).max(40).optional(),
  enabled: z.boolean().optional(),
  hidden: z.boolean().optional(),
  ssid: z.string().min(1).max(32).optional(),
  channel: z.number().int().optional(),
  channelWidth: z.string().optional(),
  security: z.string().optional(),
  password: z.string().optional(),
  isolated: z.boolean().optional(),
  vlanId: z.number().int().min(1).max(4094).nullable().optional(),
  bandwidthLimitMbps: z.number().int().min(1).max(10000).nullable().optional(),
  captivePortal: z.boolean().optional(),
  scheduleEnabled: z.boolean().optional(),
  scheduleStart: z.string().nullable().optional(),
  scheduleEnd: z.string().nullable().optional(),
  ipv4Enabled: z.boolean().optional(),
  ipv6Enabled: z.boolean().optional(),
  backhaulMode: z.enum(['wired', 'wireless']).optional(),
  bandSteeringMember: z.boolean().optional(),
});

export function createWirelessRoutes(
  deviceRepo: PrismaDeviceRepository,
  wirelessService: WirelessInterfaceService,
  securityService: SecurityService,
  wifiValidator: WifiSecurityValidator,
) {
  const router = Router();

  router.get('/interfaces', async (_req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      res.json(await wirelessService.list(device.id));
    } catch (e) {
      next(e);
    }
  });

  router.get('/interfaces/client-facing', async (_req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      res.json(await wirelessService.listClientFacing(device.id));
    } catch (e) {
      next(e);
    }
  });

  router.get('/interfaces/band-steering-eligible', async (_req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      res.json(await wirelessService.listBandSteeringEligible(device.id));
    } catch (e) {
      next(e);
    }
  });

  router.post('/interfaces/guest', async (req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      const data = guestSchema.parse(req.body);

      const settings = await securityService.getSettings(device.id);
      const result = wifiValidator.validate(settings.securityProfile, data.security, data.password, data.enabled ?? true);
      if (!result.valid) {
        return res.status(400).json({ error: 'Bad Request', message: result.errors.join('. ') });
      }

      const created = await wirelessService.createGuest(device.id, data);
      res.status(201).json(created);
    } catch (e) {
      next(e);
    }
  });

  router.put('/interfaces/:interfaceId', async (req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      const data = updateSchema.parse(req.body);

      if (data.bandSteeringMember === true) {
        try {
          const joined = await wirelessService.attemptBandSteeringJoin(device.id, req.params.interfaceId);
          return res.json(joined);
        } catch (err) {
          return res.status(400).json({
            error: 'Bad Request',
            message: err instanceof Error ? err.message : 'Band Steering validation failed',
          });
        }
      }

      const iface = await wirelessService.getByInterfaceId(device.id, req.params.interfaceId);
      if (!iface) return res.status(404).json({ error: 'Not Found' });

      if (iface.interfaceType === 'mesh_backhaul') {
        const meshData = meshSchema.partial().parse({
          band: data.channel ? iface.band : undefined,
          channel: data.channel,
          channelWidth: data.channelWidth,
          enabled: data.enabled,
          backhaulMode: data.backhaulMode,
          name: data.name,
        });
        const updated = await wirelessService.updateMesh(device.id, req.params.interfaceId, {
          band: meshData.band ?? iface.band,
          channel: meshData.channel ?? iface.channel,
          channelWidth: meshData.channelWidth ?? iface.channelWidth,
          backhaulMode: meshData.backhaulMode ?? iface.backhaulMode ?? 'wireless',
          enabled: meshData.enabled,
          name: meshData.name,
        });
        return res.json(updated);
      }

      if (data.security && data.password !== undefined) {
        const settings = await securityService.getSettings(device.id);
        const result = wifiValidator.validate(
          settings.securityProfile,
          data.security,
          data.password,
          data.enabled ?? iface.enabled,
        );
        if (!result.valid) {
          return res.status(400).json({ error: 'Bad Request', message: result.errors.join('. ') });
        }
      }

      const updated = await wirelessService.update(device.id, req.params.interfaceId, data);
      res.json(updated);
    } catch (e) {
      next(e);
    }
  });

  router.delete('/interfaces/:interfaceId', async (req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      await wirelessService.deleteGuest(device.id, req.params.interfaceId);
      res.status(204).end();
    } catch (e) {
      next(e);
    }
  });

  router.post('/interfaces/:interfaceId/band-steering/join', async (req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      try {
        const result = await wirelessService.attemptBandSteeringJoin(device.id, req.params.interfaceId);
        res.json(result);
      } catch (err) {
        return res.status(400).json({
          error: 'Bad Request',
          message: err instanceof Error ? err.message : 'Band Steering validation failed',
        });
      }
    } catch (e) {
      next(e);
    }
  });

  return router;
}
