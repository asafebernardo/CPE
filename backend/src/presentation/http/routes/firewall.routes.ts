import { Router } from 'express';
import { z } from 'zod';
import type { PrismaFirewallRepository } from '../../../infrastructure/database/repositories/PrismaFirewallRepository.js';
import type { LogService } from '../../../application/services/LogService.js';
import type { PrismaDeviceRepository } from '../../../infrastructure/database/repositories/PrismaDeviceRepository.js';

const firewallRuleSchema = z.object({
  name: z.string().min(1),
  direction: z.enum(['inbound', 'outbound']),
  protocol: z.enum(['TCP', 'UDP', 'BOTH', 'ICMP', 'ANY']),
  sourceIp: z.string().min(1),
  destIp: z.string().min(1),
  sourcePort: z.string().min(1),
  destPort: z.string().min(1),
  action: z.enum(['allow', 'deny']),
  enabled: z.boolean(),
});

const portForwardSchema = z.object({
  name: z.string().min(1),
  externalPort: z.number().int().min(1).max(65535),
  internalIp: z.string().min(1),
  internalPort: z.number().int().min(1).max(65535),
  protocol: z.enum(['TCP', 'UDP', 'BOTH']),
  enabled: z.boolean(),
});

export function createFirewallRoutes(
  firewallRepo: PrismaFirewallRepository,
  deviceRepo: PrismaDeviceRepository,
  logService: LogService,
) {
  const router = Router();

  router.get('/rules', async (_req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      res.json(await firewallRepo.getRules(device.id));
    } catch (e) {
      next(e);
    }
  });

  router.post('/rules', async (req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      const data = firewallRuleSchema.parse(req.body);
      const rule = await firewallRepo.createRule(device.id, data);
      await logService.log(device.id, 'PARAM_CHANGE', `Firewall rule created: ${rule.name}`);
      res.status(201).json(rule);
    } catch (e) {
      next(e);
    }
  });

  router.put('/rules/:id', async (req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      const data = firewallRuleSchema.parse(req.body);
      const rule = await firewallRepo.updateRule(device.id, req.params.id, data);
      await logService.log(device.id, 'PARAM_CHANGE', `Firewall rule updated: ${rule.name}`);
      res.json(rule);
    } catch (e) {
      next(e);
    }
  });

  router.delete('/rules/:id', async (req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      await firewallRepo.deleteRule(device.id, req.params.id);
      await logService.log(device.id, 'PARAM_CHANGE', `Firewall rule deleted: ${req.params.id}`);
      res.status(204).send();
    } catch (e) {
      if (e instanceof Error && e.message.includes('cannot be removed')) {
        return res.status(400).json({ error: 'Bad Request', message: e.message });
      }
      next(e);
    }
  });

  router.get('/port-forward', async (_req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      res.json(await firewallRepo.getPortForwards(device.id));
    } catch (e) {
      next(e);
    }
  });

  router.post('/port-forward', async (req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      const data = portForwardSchema.parse(req.body);
      const pf = await firewallRepo.createPortForward(device.id, data);
      await logService.log(device.id, 'PARAM_CHANGE', `Port forward created: ${pf.name}`);
      res.status(201).json(pf);
    } catch (e) {
      next(e);
    }
  });

  router.put('/port-forward/:id', async (req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      const data = portForwardSchema.parse(req.body);
      const pf = await firewallRepo.updatePortForward(device.id, req.params.id, data);
      await logService.log(device.id, 'PARAM_CHANGE', `Port forward updated: ${pf.name}`);
      res.json(pf);
    } catch (e) {
      next(e);
    }
  });

  router.delete('/port-forward/:id', async (req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      await firewallRepo.deletePortForward(device.id, req.params.id);
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  });

  router.get('/dmz', async (_req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      res.json(await firewallRepo.getDmz(device.id));
    } catch (e) {
      next(e);
    }
  });

  router.put('/dmz', async (req, res, next) => {
    try {
      const device = await deviceRepo.findDefault();
      if (!device) return res.status(404).json({ error: 'Not Found' });
      const schema = z.object({ enabled: z.boolean(), hostIp: z.string() });
      const data = schema.parse(req.body);
      const dmz = await firewallRepo.updateDmz(device.id, data);
      await logService.log(device.id, 'PARAM_CHANGE', 'DMZ configuration updated');
      res.json(dmz);
    } catch (e) {
      next(e);
    }
  });

  return router;
}
