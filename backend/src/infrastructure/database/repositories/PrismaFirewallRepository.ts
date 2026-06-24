import type { IFirewallRepository } from '../../../domain/repositories/IFirewallRepository.js';
import type { FirewallRule, PortForward, DmzConfig } from '@routergui/shared';
import { prisma } from '../prisma.js';

export class PrismaFirewallRepository implements IFirewallRepository {
  async getRules(deviceId: string): Promise<FirewallRule[]> {
    const rows = await prisma.firewallRule.findMany({ where: { deviceId } });
    return rows.map((r) => ({
      id: r.id,
      deviceId: r.deviceId,
      name: r.name,
      direction: r.direction as FirewallRule['direction'],
      protocol: r.protocol as FirewallRule['protocol'],
      sourceIp: r.sourceIp,
      destIp: r.destIp,
      sourcePort: r.sourcePort,
      destPort: r.destPort,
      action: r.action as FirewallRule['action'],
      enabled: r.enabled,
    }));
  }

  async createRule(deviceId: string, data: Omit<FirewallRule, 'id' | 'deviceId'>): Promise<FirewallRule> {
    const row = await prisma.firewallRule.create({ data: { deviceId, ...data } });
    return {
      id: row.id,
      deviceId: row.deviceId,
      name: row.name,
      direction: row.direction as FirewallRule['direction'],
      protocol: row.protocol as FirewallRule['protocol'],
      sourceIp: row.sourceIp,
      destIp: row.destIp,
      sourcePort: row.sourcePort,
      destPort: row.destPort,
      action: row.action as FirewallRule['action'],
      enabled: row.enabled,
    };
  }

  async deleteRule(deviceId: string, ruleId: string): Promise<void> {
    await prisma.firewallRule.deleteMany({ where: { id: ruleId, deviceId } });
  }

  async getPortForwards(deviceId: string): Promise<PortForward[]> {
    const rows = await prisma.portForward.findMany({ where: { deviceId } });
    return rows.map((r) => ({
      id: r.id,
      deviceId: r.deviceId,
      name: r.name,
      externalPort: r.externalPort,
      internalIp: r.internalIp,
      internalPort: r.internalPort,
      protocol: r.protocol as PortForward['protocol'],
      enabled: r.enabled,
    }));
  }

  async createPortForward(deviceId: string, data: Omit<PortForward, 'id' | 'deviceId'>): Promise<PortForward> {
    const row = await prisma.portForward.create({ data: { deviceId, ...data } });
    return {
      id: row.id,
      deviceId: row.deviceId,
      name: row.name,
      externalPort: row.externalPort,
      internalIp: row.internalIp,
      internalPort: row.internalPort,
      protocol: row.protocol as PortForward['protocol'],
      enabled: row.enabled,
    };
  }

  async deletePortForward(deviceId: string, id: string): Promise<void> {
    await prisma.portForward.deleteMany({ where: { id, deviceId } });
  }

  async getDmz(deviceId: string): Promise<DmzConfig | null> {
    const row = await prisma.dmzConfig.findUnique({ where: { deviceId } });
    if (!row) return null;
    return { deviceId: row.deviceId, enabled: row.enabled, hostIp: row.hostIp };
  }

  async updateDmz(deviceId: string, data: Partial<DmzConfig>): Promise<DmzConfig> {
    const row = await prisma.dmzConfig.update({ where: { deviceId }, data });
    return { deviceId: row.deviceId, enabled: row.enabled, hostIp: row.hostIp };
  }
}
