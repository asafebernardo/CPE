import { Router } from 'express';
import { z } from 'zod';
import type { ParameterTreeService } from '../../../application/services/ParameterTreeService.js';
import type { LogService } from '../../../application/services/LogService.js';
import type { WanOperationalService } from '../../../application/services/WanOperationalService.js';
import type { PrismaDeviceRepository } from '../../../infrastructure/database/repositories/PrismaDeviceRepository.js';

const wanSchema = z.object({
  connectionType: z.enum(['DHCP', 'PPPoE', 'Static', 'Bridge']).optional(),
  ipAddress: z.string().optional(),
  subnetMask: z.string().optional(),
  gateway: z.string().optional(),
  dnsPrimary: z.string().optional(),
  dnsSecondary: z.string().optional(),
  dnsAuto: z.boolean().optional(),
  mtu: z.number().int().optional(),
  pppoeUsername: z.string().optional(),
  pppoePassword: z.string().optional(),
  pppoeServiceName: z.string().optional(),
  pppoeAcName: z.string().optional(),
  pppoeMtu: z.number().int().optional(),
  vlanEnabled: z.boolean().optional(),
  vlanId: z.number().int().optional(),
  vlanPriority: z.number().int().optional(),
  natEnabled: z.boolean().optional(),
  natType: z.string().optional(),
  ipv6Enabled: z.boolean().optional(),
  slaacEnabled: z.boolean().optional(),
  dhcpv6Enabled: z.boolean().optional(),
  prefixDelegation: z.boolean().optional(),
  wanAddress: z.string().optional(),
  wanGateway: z.string().optional(),
  wanDns: z.string().optional(),
  prefixLength: z.number().int().optional(),
});

const wanInterfaceSchema = z.object({
  name: z.string().min(1).max(40),
  serviceType: z.enum([
    'INTERNET', 'VOIP', 'TR069', 'IPTV', 'OTHER', 'BRIDGE',
    'INTERNET_TR069', 'INTERNET_VOIP', 'INTERNET_IPTV', 'TR069_VOIP', 'INTERNET_TR069_VOIP',
  ]),
  connectionType: z.enum(['DHCP', 'PPPoE', 'Static', 'Bridge']),
  enabled: z.boolean(),
  ipAddress: z.string(),
  subnetMask: z.string(),
  gateway: z.string(),
  dnsPrimary: z.string(),
  dnsSecondary: z.string(),
  mtu: z.number().int().min(576).max(9000),
  vlanEnabled: z.boolean(),
  vlanId: z.number().int().min(0).max(4094),
  natEnabled: z.boolean(),
  pppoeUsername: z.string(),
  pppoePassword: z.string(),
});

export function createWanRoutes(
  deviceRepo: PrismaDeviceRepository,
  parameterTree: ParameterTreeService,
  logService: LogService,
  wanOperational: WanOperationalService,
) {
  const router = Router();

  router.get('/dashboard', async (_req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      res.json(await wanOperational.getDashboard(device.id));
    } catch (e) {
      next(e);
    }
  });

  router.get('/', async (_req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      const dashboard = await wanOperational.getDashboard(device.id);
      res.json(dashboard.config);
    } catch (e) {
      next(e);
    }
  });

  router.put('/', async (req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      const data = wanSchema.parse(req.body);
      await wanOperational.updateConfig(device.id, data);
      await parameterTree.syncFromDomainModels(device.id);
      await logService.log(device.id, 'PARAM_CHANGE', 'WAN configuration updated', JSON.stringify(data));
      res.json(await wanOperational.getDashboard(device.id));
    } catch (e) {
      next(e);
    }
  });

  router.get('/interfaces', async (_req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      res.json(await wanOperational.listInterfaces(device.id));
    } catch (e) {
      next(e);
    }
  });

  router.post('/interfaces', async (req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      const data = wanInterfaceSchema.parse(req.body);
      const created = await wanOperational.createInterface(device.id, data);
      res.status(201).json(created);
    } catch (e) {
      next(e);
    }
  });

  router.put('/interfaces/:id', async (req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      if (req.params.id === 'primary') {
        return res.status(400).json({ error: 'The default Internet WAN is managed in the Configuration tab.' });
      }
      const data = wanInterfaceSchema.parse(req.body);
      const updated = await wanOperational.updateInterface(device.id, req.params.id, data);
      res.json(updated);
    } catch (e) {
      next(e);
    }
  });

  router.delete('/interfaces/:id', async (req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      if (req.params.id === 'primary') {
        return res.status(400).json({ error: 'The default Internet WAN cannot be removed.' });
      }
      await wanOperational.deleteInterface(device.id, req.params.id);
      res.status(204).end();
    } catch (e) {
      next(e);
    }
  });

  router.post('/actions/renew-dhcp', async (_req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      await wanOperational.renewDhcp(device.id);
      res.json(await wanOperational.getDashboard(device.id));
    } catch (e) {
      next(e);
    }
  });

  router.post('/actions/release-dhcp', async (_req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      await wanOperational.releaseDhcp(device.id);
      res.json(await wanOperational.getDashboard(device.id));
    } catch (e) {
      next(e);
    }
  });

  router.post('/actions/reconnect', async (_req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      await wanOperational.reconnect(device.id);
      res.json(await wanOperational.getDashboard(device.id));
    } catch (e) {
      next(e);
    }
  });

  router.post('/actions/test-connection', async (_req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      const result = await wanOperational.testConnection(device.id);
      res.json({ ...result, dashboard: await wanOperational.getDashboard(device.id) });
    } catch (e) {
      next(e);
    }
  });

  router.post('/actions/ping-gateway', async (_req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      const result = await wanOperational.pingGateway(device.id);
      res.json({ ...result, dashboard: await wanOperational.getDashboard(device.id) });
    } catch (e) {
      next(e);
    }
  });

  router.post('/actions/pppoe-connect', async (_req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      await wanOperational.pppoeConnect(device.id);
      res.json(await wanOperational.getDashboard(device.id));
    } catch (e) {
      next(e);
    }
  });

  router.post('/actions/pppoe-disconnect', async (_req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      await wanOperational.pppoeDisconnect(device.id);
      res.json(await wanOperational.getDashboard(device.id));
    } catch (e) {
      next(e);
    }
  });

  return router;
}
