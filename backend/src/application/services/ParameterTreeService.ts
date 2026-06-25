import type { IParameterTreeService, IParameterRepository } from '../../domain/services/IParameterTreeService.js';
import type { CwmpParameterInfo, CwmpParameterValue } from '@routergui/shared';
import {
  TR098_ROOT,
  TR098_MANAGEMENT_SERVER,
  CWMP_SUPPORTED_RPC_METHODS,
  clampPeriodicInformInterval,
} from '@routergui/shared';
import { Tr098Adapter } from '../../infrastructure/adapters/Tr098Adapter.js';
import { prisma } from '../../infrastructure/database/prisma.js';
import type { EventEmitter } from 'events';
import type { CwmpDiagnosticsService } from './CwmpDiagnosticsService.js';
import { compareCwmpPaths, expandCwmpParameterPaths } from '../../infrastructure/cwmp/cwmpPathUtils.js';
import { normalizeAcsParameterPath } from '../../infrastructure/adapters/wlanTr098Mapper.js';

interface LiveParameter {
  value: string;
  writable: boolean;
}

export class ParameterTreeService implements IParameterTreeService {
  private cache: Map<string, Map<string, string>> = new Map();
  private adapter: Tr098Adapter;

  constructor(
    private readonly parameterRepo: IParameterRepository,
    private readonly eventBus?: EventEmitter,
    diagnostics?: CwmpDiagnosticsService,
  ) {
    this.adapter = new Tr098Adapter(diagnostics);
  }

  async load(deviceId: string): Promise<void> {
    const params = await this.parameterRepo.findByDevice(deviceId);
    const map = new Map<string, string>();
    for (const p of params) {
      map.set(p.path, p.value);
    }
    this.cache.set(deviceId, map);
  }

  /**
   * Merge persisted TR-098 rows with live domain state so ACS reads always reflect
   * current WAN/WLAN/hosts/diagnostics without waiting for a DB round-trip.
   */
  private async getLiveParameterMap(deviceId: string): Promise<Map<string, LiveParameter>> {
    const [domainParams, stored] = await Promise.all([
      this.adapter.mapDomainToParameters(deviceId),
      this.parameterRepo.findByDevice(deviceId),
    ]);

    const map = new Map<string, LiveParameter>();
    for (const p of stored) {
      map.set(p.path, { value: p.value, writable: p.writable });
    }
    for (const p of domainParams) {
      map.set(p.name, {
        value: p.value,
        writable: this.isWritablePath(p.name),
      });
    }

    const cache = new Map<string, string>();
    for (const [path, entry] of map) cache.set(path, entry.value);
    this.cache.set(deviceId, cache);

    return map;
  }

  async getParameterValues(deviceId: string, paths: string[]): Promise<CwmpParameterValue[]> {
    const paramMap = await this.getLiveParameterMap(deviceId);
    const allPaths = Array.from(paramMap.keys());
    const expandedPaths = expandCwmpParameterPaths(paths, allPaths);

    const result: CwmpParameterValue[] = [];
    for (const path of expandedPaths) {
      const entry = paramMap.get(path);
      if (entry) {
        result.push({ name: path, value: entry.value });
      }
    }
    return result;
  }

  async setParameterValues(deviceId: string, params: CwmpParameterValue[]): Promise<void> {
    await this.ensureLoaded(deviceId);
    const cache = this.cache.get(deviceId)!;
    const changedPaths: CwmpParameterValue[] = [];

    for (const { name, value } of params) {
      const canonicalName = normalizeAcsParameterPath(name);
      let finalValue = value;
      if (canonicalName === TR098_MANAGEMENT_SERVER.PERIODIC_INFORM_INTERVAL) {
        finalValue = String(clampPeriodicInformInterval(parseInt(value, 10) || 300));
      }
      const existing = await this.parameterRepo.findByPath(deviceId, canonicalName);
      if (existing && !existing.writable) {
        throw new Error(`Parameter ${canonicalName} is not writable`);
      }
      await this.parameterRepo.upsert(deviceId, canonicalName, finalValue, existing?.writable ?? true);
      if (canonicalName !== name) {
        await this.parameterRepo.upsert(deviceId, name, finalValue, true);
      }
      cache.set(canonicalName, finalValue);
      changedPaths.push({ name: canonicalName, value: finalValue });
    }

    await this.syncToDomainModels(deviceId, changedPaths);
    this.eventBus?.emit('param.changed', { deviceId, paths: changedPaths.map((p) => p.name), source: 'acs' });

    const periodicChanged = changedPaths.some(
      (p) =>
        p.name === TR098_MANAGEMENT_SERVER.PERIODIC_INFORM_INTERVAL ||
        p.name === TR098_MANAGEMENT_SERVER.PERIODIC_INFORM_ENABLE,
    );
    if (periodicChanged) {
      this.eventBus?.emit('cwmp.periodic-inform.changed', { deviceId });
    }
  }

  async getParameterNames(deviceId: string, path: string, nextLevel: boolean): Promise<CwmpParameterInfo[]> {
    const paramMap = await this.getLiveParameterMap(deviceId);
    const allPaths = Array.from(paramMap.keys()).sort(compareCwmpPaths);
    const normalizedPath = path.endsWith('.') ? path.slice(0, -1) : path;

    if (nextLevel) {
      const prefix = `${normalizedPath}.`;
      const children = new Map<string, boolean>();

      for (const p of allPaths) {
        if (!p.startsWith(prefix)) continue;
        const relative = p.slice(prefix.length);
        if (!relative) continue;

        const firstSegment = relative.split('.')[0];
        const childPath = `${prefix}${firstSegment}`;
        const isObject = allPaths.some((x) => x.startsWith(`${childPath}.`));
        const leafWritable = paramMap.get(p)?.writable ?? false;

        if (!children.has(childPath)) {
          children.set(childPath, isObject ? false : leafWritable);
        } else if (!isObject && leafWritable) {
          children.set(childPath, true);
        }
      }

      // Exact leaf at requested path (no trailing dot)
      const exact = paramMap.get(normalizedPath);
      if (exact && !allPaths.some((p) => p.startsWith(`${normalizedPath}.`))) {
        children.set(normalizedPath, exact.writable);
      }

      return Array.from(children.entries())
        .map(([name, writable]) => ({ name, writable }))
        .sort((a, b) => compareCwmpPaths(a.name, b.name));
    }

    const prefix = `${normalizedPath}.`;
    const names: CwmpParameterInfo[] = [];
    for (const p of allPaths) {
      if (p === normalizedPath || p.startsWith(prefix)) {
        names.push({ name: p, writable: paramMap.get(p)?.writable ?? false });
      }
    }
    return names;
  }

  async buildInformParameterList(deviceId: string): Promise<CwmpParameterValue[]> {
    const paramMap = await this.getLiveParameterMap(deviceId);
    return Array.from(paramMap.entries()).map(([name, entry]) => ({
      name,
      value: entry.value,
    }));
  }

  async syncFromDomainModels(deviceId: string, options?: { notifyChange?: boolean }): Promise<void> {
    const params = await this.adapter.mapDomainToParameters(deviceId);
    await this.parameterRepo.deleteByPathPrefix(deviceId, `${TR098_ROOT}.`);
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
    if (options?.notifyChange) {
      this.eventBus?.emit('param.changed', { deviceId, paths: [], source: 'local' });
    }
  }

  async syncToDomainModels(deviceId: string, changes: CwmpParameterValue[]): Promise<void> {
    await this.adapter.applyParameterChanges(deviceId, changes);
    await this.syncFromDomainModels(deviceId);
  }

  getSupportedRpcMethods(): string[] {
    return [...CWMP_SUPPORTED_RPC_METHODS];
  }

  async addObject(deviceId: string, objectName: string): Promise<number> {
    const normalized = objectName.endsWith('.') ? objectName : `${objectName}.`;

    if (/WANDevice\.1\.WANConnectionDevice\.$/.test(normalized)) {
      const count = await prisma.wanInterface.count({ where: { deviceId } });
      await prisma.wanInterface.create({
        data: {
          deviceId,
          name: `WAN${count + 2}`,
          serviceType: 'OTHER',
          connectionType: 'DHCP',
          enabled: true,
          status: 'connected',
        },
      });
      await this.syncFromDomainModels(deviceId);
      this.eventBus?.emit('param.changed', { deviceId, paths: [], source: 'addObject' });
      return 1 + count + 1;
    }

    const pppMatch = normalized.match(/WANConnectionDevice\.(\d+)\.WANPPPConnection\.$/);
    if (pppMatch) {
      const cd = parseInt(pppMatch[1], 10);
      if (cd === 1) {
        await prisma.wanConfig.update({ where: { deviceId }, data: { connectionType: 'PPPoE' } });
      } else {
        const extra = await this.findExtraByConnIndex(deviceId, cd);
        if (extra) {
          await prisma.wanInterface.update({ where: { id: extra.id }, data: { connectionType: 'PPPoE' } });
        } else {
          await prisma.wanInterface.create({
            data: {
              deviceId,
              name: `PPP-${cd}`,
              serviceType: 'INTERNET',
              connectionType: 'PPPoE',
              enabled: true,
              status: 'connected',
            },
          });
        }
      }
      await this.syncFromDomainModels(deviceId);
      this.eventBus?.emit('param.changed', { deviceId, paths: [], source: 'addObject' });
      return 1;
    }

    const ipMatch = normalized.match(/WANConnectionDevice\.(\d+)\.WANIPConnection\.$/);
    if (ipMatch) {
      const cd = parseInt(ipMatch[1], 10);
      if (cd === 1) {
        await prisma.wanConfig.update({ where: { deviceId }, data: { connectionType: 'DHCP' } });
      } else {
        const extra = await this.findExtraByConnIndex(deviceId, cd);
        if (extra) {
          await prisma.wanInterface.update({ where: { id: extra.id }, data: { connectionType: 'DHCP' } });
        } else {
          await prisma.wanInterface.create({
            data: {
              deviceId,
              name: `IP-${cd}`,
              serviceType: 'OTHER',
              connectionType: 'DHCP',
              enabled: true,
              status: 'connected',
            },
          });
        }
      }
      await this.syncFromDomainModels(deviceId);
      this.eventBus?.emit('param.changed', { deviceId, paths: [], source: 'addObject' });
      return 1;
    }

    throw new Error(`Unsupported AddObject path: ${objectName}`);
  }

  async deleteObject(deviceId: string, objectPath: string): Promise<void> {
    const connDevOnly = objectPath.match(/WANConnectionDevice\.(\d+)$/);
    if (connDevOnly) {
      const cd = parseInt(connDevOnly[1], 10);
      if (cd === 1) throw new Error('Cannot delete primary WAN connection device');
      const extra = await this.findExtraByConnIndex(deviceId, cd);
      if (extra) await prisma.wanInterface.delete({ where: { id: extra.id } });
      await this.syncFromDomainModels(deviceId);
      this.eventBus?.emit('param.changed', { deviceId, paths: [], source: 'deleteObject' });
      return;
    }

    const ppp = objectPath.match(/WANConnectionDevice\.(\d+)\.WANPPPConnection\.(\d+)$/);
    if (ppp) {
      const cd = parseInt(ppp[1], 10);
      if (cd === 1) {
        await prisma.wanConfig.update({ where: { deviceId }, data: { connectionType: 'DHCP' } });
      } else {
        const extra = await this.findExtraByConnIndex(deviceId, cd);
        if (extra) await prisma.wanInterface.delete({ where: { id: extra.id } });
      }
      await this.syncFromDomainModels(deviceId);
      this.eventBus?.emit('param.changed', { deviceId, paths: [], source: 'deleteObject' });
      return;
    }

    const ip = objectPath.match(/WANConnectionDevice\.(\d+)\.WANIPConnection\.(\d+)$/);
    if (ip) {
      const cd = parseInt(ip[1], 10);
      if (cd === 1) throw new Error('Cannot delete primary WAN IP connection');
      const extra = await this.findExtraByConnIndex(deviceId, cd);
      if (extra) await prisma.wanInterface.delete({ where: { id: extra.id } });
      await this.syncFromDomainModels(deviceId);
      this.eventBus?.emit('param.changed', { deviceId, paths: [], source: 'deleteObject' });
      return;
    }

    throw new Error(`Unsupported DeleteObject path: ${objectPath}`);
  }

  private async findExtraByConnIndex(deviceId: string, connDeviceIndex: number) {
    const extras = await prisma.wanInterface.findMany({
      where: { deviceId },
      orderBy: { createdAt: 'asc' },
    });
    return extras[connDeviceIndex - 2] ?? null;
  }

  private async ensureLoaded(deviceId: string): Promise<void> {
    if (!this.cache.has(deviceId)) {
      await this.load(deviceId);
    }
  }

  private isWritablePath(path: string): boolean {
    const readOnlySuffixes = [
      'DeviceInfo.Manufacturer',
      'DeviceInfo.ModelName',
      'DeviceInfo.SerialNumber',
      'DeviceInfo.HardwareVersion',
      'NumberOfEntries',
      'ConnectionStatus',
      'MACAddress',
      'CurrentLocalTime',
      'Status',
    ];
    return !readOnlySuffixes.some((r) => path.endsWith(r) || path.includes(`.${r}`));
  }

  private getTypeForPath(path: string): string {
    if (path.includes('Enable') || path.includes('PeriodicInform') || path.includes('NATEnabled')) return 'boolean';
    if (path.includes('Interval') || path.includes('Channel') || path.includes('UpTime') || path.includes('NumberOfEntries')) {
      return 'unsignedInt';
    }
    return 'string';
  }
}
