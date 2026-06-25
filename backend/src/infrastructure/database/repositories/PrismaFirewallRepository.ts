import type { IFirewallRepository } from '../../../domain/repositories/IFirewallRepository.js';
import type { FirewallRule, PortForward, DmzConfig } from '@routergui/shared';
import { isProtectedFirewallRule } from '@routergui/shared';
import { prisma } from '../prisma.js';

export class PrismaFirewallRepository implements IFirewallRepository {
  async getRules(deviceId: string): Promise<FirewallRule[]> {
    const rows = await prisma.firewallRule.findMany({ where: { deviceId } });
    return rows.map((r) => this.toRule(r));
  }

  async createRule(deviceId: string, data: Omit<FirewallRule, 'id' | 'deviceId'>): Promise<FirewallRule> {
    const row = await prisma.firewallRule.create({ data: { deviceId, ...data } });
    return this.toRule(row);
  }

  async updateRule(deviceId: string, ruleId: string, data: Omit<FirewallRule, 'id' | 'deviceId'>): Promise<FirewallRule> {
    const existing = await prisma.firewallRule.findFirst({ where: { id: ruleId, deviceId } });
    if (!existing) throw new Error('Firewall rule not found');
    const row = await prisma.firewallRule.update({ where: { id: ruleId }, data });
    return this.toRule(row);
  }

  async deleteRule(deviceId: string, ruleId: string): Promise<void> {
    const existing = await prisma.firewallRule.findFirst({ where: { id: ruleId, deviceId } });
    if (!existing) throw new Error('Firewall rule not found');
    if (isProtectedFirewallRule(existing)) {
      throw new Error('HTTP and HTTPS firewall rules cannot be removed');
    }
    await prisma.firewallRule.deleteMany({ where: { id: ruleId, deviceId } });
  }

  private toRule(row: {
    id: string;
    deviceId: string;
    name: string;
    direction: string;
    protocol: string;
    sourceIp: string;
    destIp: string;
    sourcePort: string;
    destPort: string;
    action: string;
    enabled: boolean;
  }): FirewallRule {
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

  async getPortForwards(deviceId: string): Promise<PortForward[]> {
    const rows = await prisma.portForward.findMany({ where: { deviceId } });
    return rows.map((r) => this.toPortForward(r));
  }

  async createPortForward(deviceId: string, data: Omit<PortForward, 'id' | 'deviceId'>): Promise<PortForward> {
    const row = await prisma.portForward.create({ data: { deviceId, ...data } });
    return this.toPortForward(row);
  }

  async updatePortForward(deviceId: string, id: string, data: Omit<PortForward, 'id' | 'deviceId'>): Promise<PortForward> {
    const existing = await prisma.portForward.findFirst({ where: { id, deviceId } });
    if (!existing) throw new Error('Port forward rule not found');
    const row = await prisma.portForward.update({ where: { id }, data });
    return this.toPortForward(row);
  }

  async deletePortForward(deviceId: string, id: string): Promise<void> {
    await prisma.portForward.deleteMany({ where: { id, deviceId } });
  }

  private toPortForward(row: {
    id: string;
    deviceId: string;
    name: string;
    externalPort: number;
    internalIp: string;
    internalPort: number;
    protocol: string;
    enabled: boolean;
  }): PortForward {
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
