import type { CwmpParameterValue } from '@routergui/shared';

export interface IDataModelAdapter {
  readonly modelName: 'TR-098' | 'TR-181';
  getRootPath(): string;
  mapDomainToParameters(deviceId: string): Promise<CwmpParameterValue[]>;
  applyParameterChanges(deviceId: string, paths: string[]): Promise<void>;
}
