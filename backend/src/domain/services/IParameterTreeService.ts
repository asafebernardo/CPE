import type { Tr098ParameterEntity } from '../entities/Tr098Parameter.js';
import type { CwmpParameterInfo, CwmpParameterValue } from '@routergui/shared';

export interface IParameterRepository {
  findByDevice(deviceId: string): Promise<Tr098ParameterEntity[]>;
  findByPath(deviceId: string, path: string): Promise<Tr098ParameterEntity | null>;
  findByPathPrefix(deviceId: string, prefix: string): Promise<Tr098ParameterEntity[]>;
  upsert(deviceId: string, path: string, value: string, writable?: boolean, type?: string): Promise<Tr098ParameterEntity>;
  bulkUpsert(deviceId: string, params: Array<{ path: string; value: string; writable?: boolean; type?: string }>): Promise<void>;
  deleteByDevice(deviceId: string): Promise<void>;
}

export interface IParameterTreeService {
  load(deviceId: string): Promise<void>;
  getParameterValues(deviceId: string, paths: string[]): Promise<CwmpParameterValue[]>;
  setParameterValues(deviceId: string, params: CwmpParameterValue[]): Promise<void>;
  getParameterNames(deviceId: string, path: string, nextLevel: boolean): Promise<CwmpParameterInfo[]>;
  buildInformParameterList(deviceId: string): Promise<CwmpParameterValue[]>;
  syncFromDomainModels(deviceId: string): Promise<void>;
  syncToDomainModels(deviceId: string, changedPaths: string[]): Promise<void>;
}
