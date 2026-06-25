import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import type { CpeSimulatorService } from '../../../application/services/CpeSimulatorService.js';
import type { PrismaDeviceRepository } from '../../../infrastructure/database/repositories/PrismaDeviceRepository.js';
import type { CapabilitiesService } from '../../../application/services/CapabilitiesService.js';
import { prisma } from '../../../infrastructure/database/prisma.js';
import {
  validateBandSteeringMembership,
  type WirelessInterfaceType,
} from '@aerobrry/shared';

const FIRMWARE_UPLOAD_EXTENSIONS = new Set(['.bin', '.img', '.trx', '.fw', '.zip']);

const firmwareUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 64 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (FIRMWARE_UPLOAD_EXTENSIONS.has(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid firmware file type. Allowed: .bin, .img, .trx, .fw, .zip'));
    }
  },
});

export function createHostsRoutes(cpe: CpeSimulatorService, deviceRepo: PrismaDeviceRepository) {
  const router = Router();

  router.get('/', async (_req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      res.json(await cpe.getHosts(device.id));
    } catch (e) {
      next(e);
    }
  });

  return router;
}

export function createWifiAdvancedRoutes(cpe: CpeSimulatorService, deviceRepo: PrismaDeviceRepository) {
  const router = Router();

  router.get('/neighbors', async (_req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      res.json(await cpe.getNeighbors(device.id));
    } catch (e) {
      next(e);
    }
  });

  router.post('/neighbors/scan', async (_req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      res.json(await cpe.scanNeighbors(device.id));
    } catch (e) {
      next(e);
    }
  });

  router.get('/band-steering', async (_req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      res.json(await cpe.getBandSteering(device.id));
    } catch (e) {
      next(e);
    }
  });

  router.put('/band-steering', async (req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });

      const interfaceIds = req.body?.interfaceIds as string[] | undefined;
      if (interfaceIds?.length) {
        for (const interfaceId of interfaceIds) {
          const iface = await prisma.wirelessInterface.findUnique({
            where: { deviceId_interfaceId: { deviceId: device.id, interfaceId } },
          });
          if (!iface) {
            return res.status(400).json({ error: 'Bad Request', message: `Interface ${interfaceId} not found` });
          }
          const check = validateBandSteeringMembership(iface.interfaceType as WirelessInterfaceType);
          if (!check.valid) {
            return res.status(400).json({ error: 'Bad Request', message: check.error });
          }
          if (!iface.enabled) {
            return res.status(400).json({
              error: 'Bad Request',
              message: 'Main interface must be enabled to participate in Band Steering',
            });
          }
        }
      }

      const { interfaceIds: _omit, ...steeringData } = req.body ?? {};
      res.json(await cpe.updateBandSteering(device.id, steeringData));
    } catch (e) {
      next(e);
    }
  });

  return router;
}

export function createCpeRoutes(
  cpe: CpeSimulatorService,
  deviceRepo: PrismaDeviceRepository,
  capabilitiesService?: CapabilitiesService,
) {
  const router = Router();

  router.get('/capabilities', async (_req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      if (!capabilitiesService) return res.status(503).json({ error: 'Capabilities service unavailable' });
      res.json(await capabilitiesService.getCapabilities(device.id));
    } catch (e) {
      next(e);
    }
  });

  router.get('/ipv6', async (_req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      res.json(await cpe.getIpv6(device.id));
    } catch (e) {
      next(e);
    }
  });

  router.put('/ipv6', async (req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      res.json(await cpe.updateIpv6(device.id, req.body));
    } catch (e) {
      next(e);
    }
  });

  router.get('/guest-wifi', async (_req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      res.json(await cpe.getGuestWlan(device.id));
    } catch (e) {
      next(e);
    }
  });

  router.put('/guest-wifi', async (req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      res.json(await cpe.updateGuestWlan(device.id, req.body));
    } catch (e) {
      next(e);
    }
  });

  router.get('/upnp', async (_req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      res.json(await cpe.getUpnp(device.id));
    } catch (e) {
      next(e);
    }
  });

  router.put('/upnp', async (req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      res.json(await cpe.updateUpnp(device.id, req.body.enabled));
    } catch (e) {
      next(e);
    }
  });

  router.get('/vpn', async (_req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      res.json(await cpe.getVpn(device.id));
    } catch (e) {
      next(e);
    }
  });

  router.put('/vpn', async (req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      res.json(await cpe.updateVpn(device.id, req.body));
    } catch (e) {
      next(e);
    }
  });

  router.get('/qos', async (_req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      res.json(await cpe.getQosRules(device.id));
    } catch (e) {
      next(e);
    }
  });

  router.post('/qos', async (req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      res.status(201).json(await cpe.createQosRule(device.id, req.body));
    } catch (e) {
      next(e);
    }
  });

  router.delete('/qos/:id', async (req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      await cpe.deleteQosRule(device.id, req.params.id);
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  });

  router.get('/routes', async (_req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      res.json(await cpe.getRoutes(device.id));
    } catch (e) {
      next(e);
    }
  });

  router.post('/routes', async (req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      res.status(201).json(await cpe.createRoute(device.id, req.body));
    } catch (e) {
      next(e);
    }
  });

  router.delete('/routes/:id', async (req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      await cpe.deleteRoute(device.id, req.params.id);
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  });

  router.get('/dhcp/reservations', async (_req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      res.json(await cpe.getReservations(device.id));
    } catch (e) {
      next(e);
    }
  });

  router.post('/dhcp/reservations', async (req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      res.status(201).json(await cpe.createReservation(device.id, req.body));
    } catch (e) {
      next(e);
    }
  });

  router.delete('/dhcp/reservations/:id', async (req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      await cpe.deleteReservation(device.id, req.params.id);
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  });

  router.get('/ntp', async (_req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      res.json(await cpe.getNtp(device.id));
    } catch (e) {
      next(e);
    }
  });

  router.put('/ntp', async (req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      res.json(await cpe.updateNtp(device.id, req.body));
    } catch (e) {
      next(e);
    }
  });

  router.get('/optical', async (_req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      res.json(await cpe.getOptical(device.id));
    } catch (e) {
      next(e);
    }
  });

  router.get('/voip', async (_req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      res.json(await cpe.getVoipLines(device.id));
    } catch (e) {
      next(e);
    }
  });

  router.get('/firmware', async (_req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      res.json(await cpe.getFirmware(device.id));
    } catch (e) {
      next(e);
    }
  });

  router.post('/firmware/upgrade', async (_req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      res.json(await cpe.upgradeFirmware(device.id));
    } catch (e) {
      next(e);
    }
  });

  router.post('/firmware/upload', (req, res, next) => {
    firmwareUpload.single('firmware')(req, res, (err) => {
      if (err) return res.status(400).json({ error: err.message });
      next();
    });
  }, async (req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      if (!req.file) return res.status(400).json({ error: 'No firmware file provided' });

      const result = await cpe.upgradeFirmwareFromFile(device.id, {
        originalname: req.file.originalname,
        size: req.file.size,
      });

      res.json({
        ...result,
        fileName: req.file.originalname,
        fileSize: req.file.size,
      });
    } catch (e) {
      next(e);
    }
  });

  return router;
}
