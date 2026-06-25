import type { EventEmitter } from 'events';
import type { LogService } from './LogService.js';
import { DeviceSimulatorService } from './DeviceSimulatorService.js';
import { PrismaDeviceRepository } from '../../infrastructure/database/repositories/PrismaDeviceRepository.js';
import {
  applyDiagnosticsParameterChange,
  createDefaultDiagnosticsState,
  getRequestedDiagnostics,
  type DiagnosticsState,
} from '../../infrastructure/adapters/diagnosticsTr098Mapper.js';

export class CwmpDiagnosticsService {
  private states = new Map<string, DiagnosticsState>();
  private simulator = new DeviceSimulatorService(new PrismaDeviceRepository());

  constructor(
    private readonly logService: LogService,
    private readonly eventBus?: EventEmitter,
  ) {}

  getState(deviceId: string): DiagnosticsState {
    if (!this.states.has(deviceId)) {
      this.states.set(deviceId, createDefaultDiagnosticsState());
    }
    return this.states.get(deviceId)!;
  }

  applyParameterChanges(deviceId: string, paths: string[], values: Map<string, string>): string[] {
    const state = this.getState(deviceId);
    const changed: string[] = [];
    for (const path of paths) {
      const value = values.get(path);
      if (value !== undefined && applyDiagnosticsParameterChange(state, path, value)) {
        changed.push(path);
      }
    }
    return changed;
  }

  async processPending(deviceId: string): Promise<boolean> {
    const state = this.getState(deviceId);
    const kind = getRequestedDiagnostics(state);
    if (!kind) return false;

    await this.logService.log(deviceId, 'ACS_COMMAND', `Diagnostics started: ${kind}`);

    try {
      if (kind === 'ping') {
        const result = await this.simulator.runPing(state.ipPing.host || '8.8.8.8', state.ipPing.numberOfRepetitions);
        state.ipPing.successCount = result.packetsReceived;
        state.ipPing.failureCount = result.packetsSent - result.packetsReceived;
        state.ipPing.averageResponseTime = Math.round(result.avgMs);
        state.ipPing.minimumResponseTime = Math.round(result.minMs);
        state.ipPing.maximumResponseTime = Math.round(result.maxMs);
        state.ipPing.diagnosticsState = 'Complete';
      } else if (kind === 'trace') {
        const result = await this.simulator.runTraceroute(state.traceRoute.host || '8.8.8.8');
        state.traceRoute.hops = result.hops.map((h) => ({ host: h.ip || h.hostname, rtt: Math.round(h.timeMs) }));
        state.traceRoute.responseTime = result.hops.reduce((sum, h) => sum + h.timeMs, 0);
        state.traceRoute.diagnosticsState = 'Complete';
      } else if (kind === 'download') {
        const bytes = 52_428_800;
        const now = new Date().toISOString();
        state.download.romTime = now;
        state.download.bomTime = now;
        state.download.eomTime = new Date(Date.now() + 8000).toISOString();
        state.download.totalBytesReceived = bytes;
        state.download.testBytesReceived = bytes;
        state.download.diagnosticsState = 'Complete';
      } else if (kind === 'upload') {
        const bytes = 26_214_400;
        state.upload.totalBytesSent = bytes;
        state.upload.testBytesSent = bytes;
        state.upload.diagnosticsState = 'Complete';
      }

      await this.logService.log(deviceId, 'ACS_COMMAND', `Diagnostics completed: ${kind}`);
      this.eventBus?.emit('cwmp.diagnostics.complete', { deviceId });
      return true;
    } catch (err) {
      if (kind === 'ping') state.ipPing.diagnosticsState = 'Error';
      else if (kind === 'trace') state.traceRoute.diagnosticsState = 'Error';
      else if (kind === 'download') state.download.diagnosticsState = 'Error';
      else state.upload.diagnosticsState = 'Error';

      await this.logService.log(
        deviceId,
        'ACS_COMMAND',
        `Diagnostics failed: ${kind}`,
        err instanceof Error ? err.message : String(err),
      );
      this.eventBus?.emit('cwmp.diagnostics.complete', { deviceId });
      return true;
    }
  }
}
