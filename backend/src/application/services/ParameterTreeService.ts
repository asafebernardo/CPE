import type { IParameterTreeService, IParameterRepository } from '../../domain/services/IParameterTreeService.js';
import type { CwmpParameterInfo, CwmpParameterValue } from '@routergui/shared';
import { Tr098Adapter } from '../../infrastructure/adapters/Tr098Adapter.js';
import type { EventEmitter } from 'events';

export class ParameterTreeService implements IParameterTreeService {
  private cache: Map<string, Map<string, string>> = new Map();
  private adapter = new Tr098Adapter();

  constructor(
    private readonly parameterRepo: IParameterRepository,
    private readonly eventBus?: EventEmitter,
  ) {}

  async load(deviceId: string): Promise<void> {
    const params = await this.parameterRepo.findByDevice(deviceId);
    const map = new Map<string, string>();
    for (const p of params) {
      map.set(p.path, p.value);
    }
    this.cache.set(deviceId, map);
  }

  async getParameterValues(deviceId: string, paths: string[]): Promise<CwmpParameterValue[]> {
    await this.ensureLoaded(deviceId);
    const cache = this.cache.get(deviceId)!;
    const result: CwmpParameterValue[] = [];

    for (const path of paths) {
      if (cache.has(path)) {
        result.push({ name: path, value: cache.get(path)! });
      } else {
        const param = await this.parameterRepo.findByPath(deviceId, path);
        if (param) {
          cache.set(path, param.value);
          result.push({ name: path, value: param.value });
        }
      }
    }
    return result;
  }

  async setParameterValues(deviceId: string, params: CwmpParameterValue[]): Promise<void> {
    await this.ensureLoaded(deviceId);
    const cache = this.cache.get(deviceId)!;
    const changedPaths: string[] = [];

    for (const { name, value } of params) {
      const existing = await this.parameterRepo.findByPath(deviceId, name);
      if (existing && !existing.writable) {
        throw new Error(`Parameter ${name} is not writable`);
      }
      await this.parameterRepo.upsert(deviceId, name, value, existing?.writable ?? true);
      cache.set(name, value);
      changedPaths.push(name);
    }

    await this.syncToDomainModels(deviceId, changedPaths);
    this.eventBus?.emit('param.changed', { deviceId, paths: changedPaths });
  }

  async getParameterNames(deviceId: string, path: string, nextLevel: boolean): Promise<CwmpParameterInfo[]> {
    const allParams = await this.parameterRepo.findByDevice(deviceId);
    const prefix = path.endsWith('.') ? path : path + '.';
    const names: CwmpParameterInfo[] = [];

    if (nextLevel) {
      const seen = new Set<string>();
      for (const p of allParams) {
        if (p.path.startsWith(prefix) || (path === 'InternetGatewayDevice' && p.path.startsWith(path))) {
          const relative = path === 'InternetGatewayDevice' ? p.path : p.path.slice(prefix.length);
          const firstSegment = relative.split('.')[0];
          const childPath = path === 'InternetGatewayDevice' && !p.path.includes('.', path.length)
            ? p.path
            : prefix + firstSegment;
          if (!seen.has(childPath) && childPath !== path) {
            seen.add(childPath);
            const isObject = allParams.some((x) => x.path.startsWith(childPath + '.'));
            names.push({ name: isObject ? childPath : p.path, writable: p.writable });
          }
        }
      }
      if (path === 'InternetGatewayDevice') {
        const directChildren = new Set<string>();
        for (const p of allParams) {
          const parts = p.path.split('.');
          if (parts.length >= 2) {
            directChildren.add(parts.slice(0, 2).join('.'));
          }
        }
        for (const child of directChildren) {
          if (!seen.has(child)) {
            names.push({ name: child, writable: false });
          }
        }
      }
    } else {
      for (const p of allParams) {
        if (p.path.startsWith(path)) {
          names.push({ name: p.path, writable: p.writable });
        }
      }
    }

    return names;
  }

  async buildInformParameterList(deviceId: string): Promise<CwmpParameterValue[]> {
    const domainParams = await this.adapter.mapDomainToParameters(deviceId);
    const stored = await this.parameterRepo.findByDevice(deviceId);
    const map = new Map<string, string>();
    for (const p of stored) map.set(p.path, p.value);
    for (const p of domainParams) map.set(p.name, p.value);
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }

  async syncFromDomainModels(deviceId: string): Promise<void> {
    const params = await this.adapter.mapDomainToParameters(deviceId);
    await this.parameterRepo.bulkUpsert(
      deviceId,
      params.map((p) => ({
        path: p.name,
        value: p.value,
        writable: this.isWritablePath(p.name),
        type: this.getTypeForPath(p.name),
      })),
    );
    await this.load(deviceId);
  }

  async syncToDomainModels(deviceId: string, changedPaths: string[]): Promise<void> {
    await this.adapter.applyParameterChanges(deviceId, changedPaths);
  }

  private async ensureLoaded(deviceId: string): Promise<void> {
    if (!this.cache.has(deviceId)) {
      await this.load(deviceId);
    }
  }

  private isWritablePath(path: string): boolean {
    const readOnly = [
      'DeviceInfo.Manufacturer',
      'DeviceInfo.ModelName',
      'DeviceInfo.SerialNumber',
      'DeviceInfo.HardwareVersion',
    ];
    return !readOnly.some((r) => path.endsWith(r));
  }

  private getTypeForPath(path: string): string {
    if (path.includes('Enable') || path.includes('PeriodicInform')) return 'boolean';
    if (path.includes('Interval') || path.includes('Channel') || path.includes('UpTime')) return 'unsignedInt';
    return 'string';
  }
}
