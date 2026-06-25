import { v4 as uuidv4 } from 'uuid';
import type { EventEmitter } from 'events';
import { SoapBuilder, SoapParser } from './soap/SoapBuilder.js';
import type { ParameterTreeService } from '../../application/services/ParameterTreeService.js';
import type { LogService } from '../../application/services/LogService.js';
import type { CwmpDiagnosticsService } from '../../application/services/CwmpDiagnosticsService.js';
import { prisma } from '../database/prisma.js';
import {
  GetParameterValuesHandler,
  SetParameterValuesHandler,
  GetParameterNamesHandler,
  GetRpcMethodsHandler,
  AddObjectHandler,
  DeleteObjectHandler,
  RebootHandler,
  FactoryResetHandler,
} from './handlers/index.js';
import { CwmpHttpSession, parseCwmpNextLevel } from './CwmpHttpSession.js';

const MAX_SESSION_ITERATIONS = 100;

export class CwmpClient {
  private soapBuilder = new SoapBuilder();
  private soapParser = new SoapParser();
  private getHandler: GetParameterValuesHandler;
  private setHandler: SetParameterValuesHandler;
  private namesHandler: GetParameterNamesHandler;
  private rpcMethodsHandler: GetRpcMethodsHandler;
  private addObjectHandler: AddObjectHandler;
  private deleteObjectHandler: DeleteObjectHandler;
  private rebootHandler: RebootHandler;
  private factoryResetHandler: FactoryResetHandler;
  private valueChangeTimers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(
    private readonly parameterTree: ParameterTreeService,
    private readonly logService: LogService,
    private readonly eventBus: EventEmitter,
    onReboot: (deviceId: string) => Promise<void>,
    onFactoryReset: (deviceId: string) => Promise<void>,
    private readonly diagnostics?: CwmpDiagnosticsService,
  ) {
    this.getHandler = new GetParameterValuesHandler(parameterTree, logService, eventBus);
    this.setHandler = new SetParameterValuesHandler(parameterTree, logService, eventBus);
    this.namesHandler = new GetParameterNamesHandler(parameterTree, logService, eventBus);
    this.rpcMethodsHandler = new GetRpcMethodsHandler(parameterTree, logService, eventBus);
    this.addObjectHandler = new AddObjectHandler(parameterTree, logService, eventBus);
    this.deleteObjectHandler = new DeleteObjectHandler(parameterTree, logService, eventBus);
    this.rebootHandler = new RebootHandler(logService, eventBus, onReboot);
    this.factoryResetHandler = new FactoryResetHandler(logService, eventBus, onFactoryReset);

    this.eventBus.on('param.changed', (payload: { deviceId: string; source?: string }) => {
      if (payload.source === 'acs') return;
      void this.scheduleValueChangeInform(payload.deviceId);
    });

    this.eventBus.on('cwmp.diagnostics.complete', (payload: { deviceId: string }) => {
      void this.sendDiagnosticsCompleteInform(payload.deviceId);
    });
  }

  async queueValueChange(deviceId: string): Promise<void> {
    const session = await prisma.cwmpSession.findUnique({ where: { deviceId } });
    if (!session) return;
    const pending = JSON.parse(session.pendingEvents || '[]') as Array<{ eventCode: string }>;
    if (!pending.some((e) => e.eventCode === '4 VALUE CHANGE')) {
      pending.push({ eventCode: '4 VALUE CHANGE' });
      await prisma.cwmpSession.update({
        where: { deviceId },
        data: { pendingEvents: JSON.stringify(pending) },
      });
    }
  }

  private async sendDiagnosticsCompleteInform(deviceId: string): Promise<void> {
    await this.queueDiagnosticsCompleteInform(deviceId);

    const session = await prisma.cwmpSession.findUnique({ where: { deviceId } });
    if (!session?.acsUrl || session.sessionState === 'active') return;

    try {
      await this.runSession(deviceId, [{ eventCode: '8 DIAGNOSTICS COMPLETE' }]);
    } catch (err) {
      console.error('DIAGNOSTICS COMPLETE Inform failed:', err instanceof Error ? err.message : err);
    }
  }

  private async queueDiagnosticsCompleteInform(deviceId: string): Promise<void> {
    const session = await prisma.cwmpSession.findUnique({ where: { deviceId } });
    if (!session?.acsUrl) return;

    await this.parameterTree.syncFromDomainModels(deviceId);

    const pending = JSON.parse(session.pendingEvents || '[]') as Array<{ eventCode: string }>;
    if (!pending.some((e) => e.eventCode === '8 DIAGNOSTICS COMPLETE')) {
      pending.push({ eventCode: '8 DIAGNOSTICS COMPLETE' });
      await prisma.cwmpSession.update({
        where: { deviceId },
        data: { pendingEvents: JSON.stringify(pending) },
      });
    }
  }

  private async handleDiagnosticsAfterSet(deviceId: string): Promise<boolean> {
    if (!this.diagnostics) return false;
    return this.diagnostics.processPending(deviceId);
  }

  private scheduleValueChangeInform(deviceId: string): void {
    const existing = this.valueChangeTimers.get(deviceId);
    if (existing) clearTimeout(existing);
    this.valueChangeTimers.set(
      deviceId,
      setTimeout(() => {
        this.valueChangeTimers.delete(deviceId);
        void this.sendValueChangeInform(deviceId);
      }, 2000),
    );
  }

  private async sendValueChangeInform(deviceId: string): Promise<void> {
    const session = await prisma.cwmpSession.findUnique({ where: { deviceId } });
    if (!session?.acsUrl || session.sessionState === 'active') return;
    await this.queueValueChange(deviceId);
    try {
      await this.runSession(deviceId, []);
    } catch (err) {
      console.error('VALUE CHANGE Inform failed:', err instanceof Error ? err.message : err);
    }
  }

  async runSession(deviceId: string, events: Array<{ eventCode: string; commandKey?: string }>) {
    const session = await prisma.cwmpSession.findUnique({ where: { deviceId } });
    if (!session?.acsUrl) {
      throw new Error('ACS URL not configured');
    }

    const device = await prisma.virtualDevice.findUnique({ where: { id: deviceId } });
    if (!device) throw new Error('Device not found');

    const finalEvents = [...events];
    const pending = JSON.parse(session.pendingEvents || '[]') as Array<{ eventCode: string; commandKey?: string }>;
    for (const pendingEvent of pending) {
      if (!finalEvents.some((e) => e.eventCode === pendingEvent.eventCode)) {
        finalEvents.push(pendingEvent);
      }
    }

    const includeBootstrap = !session.bootstrapSent;
    if (includeBootstrap && !finalEvents.some((e) => e.eventCode === '0 BOOTSTRAP')) {
      finalEvents.unshift({ eventCode: '0 BOOTSTRAP' });
    }

    if (finalEvents.length === 0) {
      finalEvents.push({ eventCode: '2 PERIODIC' });
    }

    this.eventBus.emit('cwmp.session.started', { deviceId });

    await prisma.cwmpSession.update({
      where: { deviceId },
      data: { sessionState: 'active' },
    });

    try {
      await this.parameterTree.syncFromDomainModels(deviceId);
      const parameters = await this.parameterTree.buildInformParameterList(deviceId);
      const informId = uuidv4();
      const informXml = this.soapBuilder.buildInform(
        informId,
        device.serialNumber,
        finalEvents,
        parameters,
        { manufacturer: device.manufacturer, productClass: device.modelName },
      );

      const httpSession = new CwmpHttpSession(session.acsUrl, session.acsUsername, session.acsPassword);
      const informResult = await httpSession.post(informXml);
      const rpcCount = await this.runSessionLoop(deviceId, httpSession, informResult.body);

      const freshSession = await prisma.cwmpSession.findUnique({ where: { deviceId } });
      const pendingToKeep = JSON.parse(freshSession?.pendingEvents || '[]') as Array<{ eventCode: string }>;
      const needsDiagnosticsInform = pendingToKeep.some((e) => e.eventCode === '8 DIAGNOSTICS COMPLETE');
      const remainingPending = pendingToKeep.filter((e) => e.eventCode !== '8 DIAGNOSTICS COMPLETE');

      await prisma.cwmpSession.update({
        where: { deviceId },
        data: {
          sessionState: 'idle',
          lastInform: new Date(),
          lastEventCodes: JSON.stringify(finalEvents.map((e) => e.eventCode)),
          pendingEvents: JSON.stringify(remainingPending),
          ...(includeBootstrap ? { bootstrapSent: true } : {}),
        },
      });

      await this.logService.log(
        deviceId,
        'INFORM',
        `Inform sent with events: ${finalEvents.map((e) => e.eventCode).join(', ')} (${rpcCount} ACS RPCs handled)`,
      );
      this.eventBus.emit('cwmp.session.completed', { deviceId });

      if (needsDiagnosticsInform) {
        setImmediate(() => {
          void this.runSession(deviceId, [{ eventCode: '8 DIAGNOSTICS COMPLETE' }]).catch((err: unknown) =>
            console.error('DIAGNOSTICS COMPLETE Inform failed:', err instanceof Error ? err.message : err),
          );
        });
      }
    } catch (error) {
      await prisma.cwmpSession.update({
        where: { deviceId },
        data: { sessionState: 'error' },
      });
      await this.logService.log(deviceId, 'INFORM', `Inform failed: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * TR-069 HTTP binding: after InformResponse the CPE must send empty POSTs
   * until the ACS has no more RPCs (HTTP 204 or empty body).
   */
  private async runSessionLoop(
    deviceId: string,
    httpSession: CwmpHttpSession,
    initialResponse: string,
  ): Promise<number> {
    let response: string | null = initialResponse;
    let rpcCount = 0;

    for (let i = 0; i < MAX_SESSION_ITERATIONS; i++) {
      if (!response || response.trim() === '') {
        const empty = await httpSession.post('');
        if (!empty.body || empty.body.trim() === '') break;
        response = empty.body;
        continue;
      }

      const parsed = this.soapParser.parse(response);
      if (!parsed) {
        const empty = await httpSession.post('');
        response = empty.body || null;
        continue;
      }

      if (parsed.method === 'InformResponse') {
        const empty = await httpSession.post('');
        response = empty.body || null;
        continue;
      }

      rpcCount++;
      const responseXml = await this.handleAcsMethod(deviceId, parsed);
      if (!responseXml) break;

      const next = await httpSession.post(responseXml);
      response = next.body || null;
    }

    return rpcCount;
  }

  private async handleAcsMethod(deviceId: string, parsed: { method: string; id: string; body: Record<string, unknown> }): Promise<string | null> {
    const method = parsed.method.replace(/Response$/, '');

    switch (method) {
      case 'GetRPCMethods': {
        const methods = this.rpcMethodsHandler.handle(deviceId);
        return this.soapBuilder.buildEnvelope('GetRPCMethodsResponse', parsed.id, {
          MethodList: methods,
        });
      }
      case 'GetParameterValues': {
        const names = this.soapParser.extractParameterNames(parsed.body);
        if (names.length === 0) {
          await this.logService.log(
            deviceId,
            'ACS_COMMAND',
            'GetParameterValues: no ParameterNames parsed from ACS request',
            JSON.stringify(parsed.body),
          );
        }
        const values = await this.getHandler.handle(deviceId, names);
        return this.soapBuilder.buildEnvelope('GetParameterValuesResponse', parsed.id, {
          ParameterList: values.map((v) => ({ name: v.name, value: v.value })),
        });
      }
      case 'SetParameterValues': {
        const params = this.soapParser.extractSetParameters(parsed.body);
        await this.setHandler.handle(deviceId, params);
        const diagnosticsRan = await this.handleDiagnosticsAfterSet(deviceId);
        if (diagnosticsRan) {
          await this.parameterTree.syncFromDomainModels(deviceId);
          await this.queueDiagnosticsCompleteInform(deviceId);
        }
        return this.soapBuilder.buildEnvelope('SetParameterValuesResponse', parsed.id, { Status: 0 });
      }
      case 'GetParameterNames': {
        const path = String(parsed.body.ParameterPath ?? 'InternetGatewayDevice');
        const nextLevel = parseCwmpNextLevel(parsed.body.NextLevel);
        const names = await this.namesHandler.handle(deviceId, path, nextLevel);
        return this.soapBuilder.buildEnvelope('GetParameterNamesResponse', parsed.id, {
          ParameterList: names.map((n) => ({ name: n.name, writable: n.writable })),
        });
      }
      case 'AddObject': {
        const objectName = String(parsed.body.ObjectName ?? '');
        const instanceNumber = await this.addObjectHandler.handle(deviceId, objectName);
        return this.soapBuilder.buildEnvelope('AddObjectResponse', parsed.id, {
          InstanceNumber: instanceNumber,
          Status: 0,
        });
      }
      case 'DeleteObject': {
        const objectPath = String(parsed.body.ObjectName ?? '');
        await this.deleteObjectHandler.handle(deviceId, objectPath);
        return this.soapBuilder.buildEnvelope('DeleteObjectResponse', parsed.id, { Status: 0 });
      }
      case 'Reboot': {
        await this.rebootHandler.handle(deviceId, String(parsed.body.CommandKey ?? ''));
        return this.soapBuilder.buildEnvelope('RebootResponse', parsed.id, {});
      }
      case 'FactoryReset': {
        await this.factoryResetHandler.handle(deviceId);
        return this.soapBuilder.buildEnvelope('FactoryResetResponse', parsed.id, {});
      }
      default:
        await this.logService.log(deviceId, 'ACS_COMMAND', `Unsupported method: ${method}`);
        return null;
    }
  }
}
