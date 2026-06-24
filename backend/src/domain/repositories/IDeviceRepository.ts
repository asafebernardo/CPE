import type { VirtualDeviceEntity } from '../entities/VirtualDevice.js';
import type { WanConfig, LanConfig, WlanConfig } from '../entities/NetworkConfig.js';

export interface IDeviceRepository {
  findDefault(): Promise<VirtualDeviceEntity | null>;
  findById(id: string): Promise<VirtualDeviceEntity | null>;
  create(data: Omit<VirtualDeviceEntity, 'id'>): Promise<VirtualDeviceEntity>;
  getWanConfig(deviceId: string): Promise<WanConfig | null>;
  updateWanConfig(deviceId: string, data: Partial<WanConfig>): Promise<WanConfig>;
  getLanConfig(deviceId: string): Promise<LanConfig | null>;
  updateLanConfig(deviceId: string, data: Partial<LanConfig>): Promise<LanConfig>;
  getWlanConfigs(deviceId: string): Promise<WlanConfig[]>;
  updateWlanConfig(deviceId: string, band: string, data: Partial<WlanConfig>): Promise<WlanConfig>;
  getMetrics(deviceId: string): Promise<{ cpuUsage: number; memoryUsage: number; uptime: number; bootTime: Date } | null>;
  updateMetrics(deviceId: string, data: Partial<{ cpuUsage: number; memoryUsage: number; uptime: number }>): Promise<void>;
  resetMetrics(deviceId: string): Promise<void>;
}
