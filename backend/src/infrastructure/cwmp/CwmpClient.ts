import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import type { EventEmitter } from 'events';
import { SoapBuilder, SoapParser } from './soap/SoapBuilder.js';
import { parseDigestChallenge, buildDigestAuthHeader } from './soap/digestAuth.js';
import type { ParameterTreeService } from '../../application/services/ParameterTreeService.js';
import type { LogService } from '../../application/services/LogService.js';
import { prisma } from '../database/prisma.js';
import {
  GetParameterValuesHandler,
  SetParameterValuesHandler,
  GetParameterNamesHandler,
  RebootHandler,
  FactoryResetHandler,
} from './handlers/index.js';

export class CwmpClient {
  private soapBuilder = new SoapBuilder();
  private soapParser = new SoapParser();
  private getHandler: GetParameterValuesHandler;
  private setHandler: SetParameterValuesHandler;
  private namesHandler: GetParameterNamesHandler;
  private rebootHandler: RebootHandler;
  private factoryResetHandler: FactoryResetHandler;

  constructor(
    private readonly parameterTree: ParameterTreeService,
    private readonly logService: LogService,
    private readonly eventBus: EventEmitter,
    onReboot: (deviceId: string) => Promise<void>,
    onFactoryReset: (deviceId: string) => Promise<void>,
  ) {
    this.getHandler = new GetParameterValuesHandler(parameterTree, logService, eventBus);
    this.setHandler = new SetParameterValuesHandler(parameterTree, logService, eventBus);
    this.namesHandler = new GetParameterNamesHandler(parameterTree, logService, eventBus);
    this.rebootHandler = new RebootHandler(logService, eventBus, onReboot);
    this.factoryResetHandler = new FactoryResetHandler(logService, eventBus, onFactoryReset);
  }

  async runSession(deviceId: string, events: Array<{ eventCode: string; commandKey?: string }>) {
    const session = await prisma.cwmpSession.findUnique({ where: { deviceId } });
    if (!session?.acsUrl) {
      throw new Error('ACS URL not configured');
    }

    const device = await prisma.virtualDevice.findUnique({ where: { id: deviceId } });
    if (!device) throw new Error('Device not found');

    // On first ever contact with an ACS, a CPE must send "0 BOOTSTRAP" so the
    // ACS registers/provisions the device. Inject it until it succeeds once.
    const finalEvents = [...events];
    const includeBootstrap = !session.bootstrapSent;
    if (includeBootstrap && !finalEvents.some((e) => e.eventCode === '0 BOOTSTRAP')) {
      finalEvents.unshift({ eventCode: '0 BOOTSTRAP' });
    }

    this.eventBus.emit('cwmp.session.started', { deviceId });

    await prisma.cwmpSession.update({
      where: { deviceId },
      data: { sessionState: 'active' },
    });

    try {
      const parameters = await this.parameterTree.buildInformParameterList(deviceId);
      const informId = uuidv4();
      const informXml = this.soapBuilder.buildInform(
        informId,
        device.serialNumber,
        finalEvents,
        parameters,
      );

      let response = await this.postSoap(session.acsUrl, informXml, session.acsUsername, session.acsPassword);
      let emptyCount = 0;

      while (response && emptyCount < 3) {
        const parsed = this.soapParser.parse(response);
        if (!parsed || parsed.method === 'InformResponse') {
          emptyCount++;
          if (emptyCount >= 1) break;
          continue;
        }

        const responseXml = await this.handleAcsMethod(deviceId, parsed);
        if (!responseXml) break;

        response = await this.postSoap(session.acsUrl, responseXml, session.acsUsername, session.acsPassword);
      }

      await prisma.cwmpSession.update({
        where: { deviceId },
        data: {
          sessionState: 'idle',
          lastInform: new Date(),
          lastEventCodes: JSON.stringify(finalEvents.map((e) => e.eventCode)),
          ...(includeBootstrap ? { bootstrapSent: true } : {}),
        },
      });

      await this.logService.log(deviceId, 'INFORM', `Inform sent with events: ${finalEvents.map((e) => e.eventCode).join(', ')}`);
      this.eventBus.emit('cwmp.session.completed', { deviceId });
    } catch (error) {
      await prisma.cwmpSession.update({
        where: { deviceId },
        data: { sessionState: 'error' },
      });
      await this.logService.log(deviceId, 'INFORM', `Inform failed: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  private async handleAcsMethod(deviceId: string, parsed: { method: string; id: string; body: Record<string, unknown> }): Promise<string | null> {
    const method = parsed.method.replace(/Response$/, '');

    switch (method) {
      case 'GetParameterValues': {
        const names = this.extractStringArray(parsed.body.ParameterNames);
        const values = await this.getHandler.handle(deviceId, names);
        return this.soapBuilder.buildEnvelope('GetParameterValuesResponse', parsed.id, {
          ParameterList: values.map((v) => ({ name: v.name, value: v.value })),
        });
      }
      case 'SetParameterValues': {
        const params = this.soapParser.extractSetParameters(parsed.body);
        await this.setHandler.handle(deviceId, params);
        return this.soapBuilder.buildEnvelope('SetParameterValuesResponse', parsed.id, { Status: 0 });
      }
      case 'GetParameterNames': {
        const path = String(parsed.body.ParameterPath ?? 'InternetGatewayDevice');
        const nextLevel = String(parsed.body.NextLevel) === 'true' || parsed.body.NextLevel === true;
        const names = await this.namesHandler.handle(deviceId, path, nextLevel);
        return this.soapBuilder.buildEnvelope('GetParameterNamesResponse', parsed.id, {
          ParameterList: names.map((n) => ({ name: n.name, writable: n.writable })),
        });
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
        return null;
    }
  }

  private extractStringArray(value: unknown): string[] {
    if (!value) return [];
    if (Array.isArray(value)) return value.map(String);
    if (typeof value === 'object' && value !== null) {
      const obj = value as Record<string, unknown>;
      if ('#text' in obj) return [String(obj['#text'])];
      if ('string' in obj) {
        const s = obj.string;
        return Array.isArray(s) ? s.map(String) : [String(s)];
      }
    }
    return [String(value)];
  }

  private async postSoap(url: string, xml: string, username: string, password: string): Promise<string> {
    const baseHeaders: Record<string, string> = {
      'Content-Type': 'text/xml; charset=utf-8',
      SOAPAction: '',
    };

    const send = (headers: Record<string, string>) =>
      axios.post(url, xml, { headers, timeout: 30000, validateStatus: () => true });

    let response = await send({ ...baseHeaders });

    // Handle authentication challenge (Digest is what IXC/most ACS require).
    if (response.status === 401 && username) {
      const wwwAuth = String(
        response.headers['www-authenticate'] ?? response.headers['WWW-Authenticate'] ?? '',
      );
      const challenge = parseDigestChallenge(wwwAuth);
      if (challenge) {
        const target = new URL(url);
        const uri = `${target.pathname}${target.search}`;
        const authHeader = buildDigestAuthHeader(challenge, username, password, 'POST', uri);
        response = await send({ ...baseHeaders, Authorization: authHeader });
      } else {
        // Fall back to Basic auth if the server did not offer Digest.
        const basic = Buffer.from(`${username}:${password}`).toString('base64');
        response = await send({ ...baseHeaders, Authorization: `Basic ${basic}` });
      }
    }

    if (response.status >= 400) {
      const body = typeof response.data === 'string' ? response.data.slice(0, 300) : '';
      throw new Error(`ACS returned HTTP ${response.status}${body ? `: ${body}` : ''}`);
    }

    return typeof response.data === 'string' ? response.data : String(response.data);
  }
}
