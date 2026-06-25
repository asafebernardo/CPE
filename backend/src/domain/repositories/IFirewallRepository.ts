import type { FirewallRule, PortForward, DmzConfig } from '@aerobrry/shared';

export interface IFirewallRepository {
  getRules(deviceId: string): Promise<FirewallRule[]>;
  createRule(deviceId: string, data: Omit<FirewallRule, 'id' | 'deviceId'>): Promise<FirewallRule>;
  updateRule(deviceId: string, ruleId: string, data: Omit<FirewallRule, 'id' | 'deviceId'>): Promise<FirewallRule>;
  deleteRule(deviceId: string, ruleId: string): Promise<void>;
  getPortForwards(deviceId: string): Promise<PortForward[]>;
  createPortForward(deviceId: string, data: Omit<PortForward, 'id' | 'deviceId'>): Promise<PortForward>;
  updatePortForward(deviceId: string, id: string, data: Omit<PortForward, 'id' | 'deviceId'>): Promise<PortForward>;
  deletePortForward(deviceId: string, id: string): Promise<void>;
  getDmz(deviceId: string): Promise<DmzConfig | null>;
  updateDmz(deviceId: string, data: Partial<DmzConfig>): Promise<DmzConfig>;
}
