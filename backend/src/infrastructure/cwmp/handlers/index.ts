import type { ParameterTreeService } from '../../../application/services/ParameterTreeService.js';
import type { LogService } from '../../../application/services/LogService.js';
import type { EventEmitter } from 'events';

export class GetParameterValuesHandler {
  constructor(
    private readonly parameterTree: ParameterTreeService,
    private readonly logService: LogService,
    private readonly eventBus?: EventEmitter,
  ) {}

  async handle(deviceId: string, paths: string[]) {
    await this.logService.log(deviceId, 'ACS_COMMAND', `GetParameterValues: ${paths.join(', ')}`);
    this.eventBus?.emit('cwmp.command', { method: 'GetParameterValues', parameters: paths });
    return await this.parameterTree.getParameterValues(deviceId, paths);
  }
}

export class SetParameterValuesHandler {
  constructor(
    private readonly parameterTree: ParameterTreeService,
    private readonly logService: LogService,
    private readonly eventBus?: EventEmitter,
  ) {}

  async handle(deviceId: string, params: Array<{ name: string; value: string }>) {
    await this.logService.log(
      deviceId,
      'ACS_COMMAND',
      `SetParameterValues: ${params.map((p) => p.name).join(', ')}`,
      JSON.stringify(params),
    );
    this.eventBus?.emit('cwmp.command', { method: 'SetParameterValues', parameters: params.map((p) => p.name) });
    await this.parameterTree.setParameterValues(deviceId, params);
    await this.parameterTree.syncFromDomainModels(deviceId);
  }
}

export class GetParameterNamesHandler {
  constructor(
    private readonly parameterTree: ParameterTreeService,
    private readonly logService: LogService,
    private readonly eventBus?: EventEmitter,
  ) {}

  async handle(deviceId: string, path: string, nextLevel: boolean) {
    await this.logService.log(deviceId, 'ACS_COMMAND', `GetParameterNames: ${path} nextLevel=${nextLevel}`);
    this.eventBus?.emit('cwmp.command', { method: 'GetParameterNames', parameters: [path] });
    return await this.parameterTree.getParameterNames(deviceId, path, nextLevel);
  }
}

export class RebootHandler {
  constructor(
    private readonly logService: LogService,
    private readonly eventBus?: EventEmitter,
    private readonly onReboot?: (deviceId: string) => Promise<void>,
  ) {}

  async handle(deviceId: string, commandKey?: string) {
    await this.logService.log(deviceId, 'ACS_COMMAND', 'Reboot requested', commandKey);
    this.eventBus?.emit('cwmp.command', { method: 'Reboot' });
    this.eventBus?.emit('device.reboot', { deviceId });
    if (this.onReboot) await this.onReboot(deviceId);
  }
}

export class FactoryResetHandler {
  constructor(
    private readonly logService: LogService,
    private readonly eventBus?: EventEmitter,
    private readonly onFactoryReset?: (deviceId: string) => Promise<void>,
  ) {}

  async handle(deviceId: string) {
    await this.logService.log(deviceId, 'ACS_COMMAND', 'FactoryReset requested');
    this.eventBus?.emit('cwmp.command', { method: 'FactoryReset' });
    this.eventBus?.emit('device.factory-reset', { deviceId });
    if (this.onFactoryReset) await this.onFactoryReset(deviceId);
  }
}
