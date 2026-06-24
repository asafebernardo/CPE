import { XMLBuilder, XMLParser } from 'fast-xml-parser';
import { CWMP_NAMESPACE } from '@routergui/shared';

const builder = new XMLBuilder({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  format: true,
  suppressEmptyNode: true,
});

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  removeNSPrefix: true,
});

export class SoapBuilder {
  buildEnvelope(method: string, id: string, body: Record<string, unknown>): string {
    const envelope = {
      'soap:Envelope': {
        '@_xmlns:soap': 'http://schemas.xmlsoap.org/soap/envelope/',
        '@_xmlns:soap-enc': 'http://schemas.xmlsoap.org/soap/encoding/',
        '@_xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
        '@_xmlns:xsd': 'http://www.w3.org/2001/XMLSchema',
        '@_xmlns:cwmp': CWMP_NAMESPACE,
        'soap:Header': {
          'cwmp:ID': { '@_soap:mustUnderstand': '1', '#text': id },
        },
        'soap:Body': {
          [`cwmp:${method}`]: this.wrapBody(body),
        },
      },
    };
    return builder.build(envelope);
  }

  private wrapBody(body: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(body)) {
      if (Array.isArray(value)) {
        result[key] = value.map((item) => this.wrapValue(item));
      } else {
        result[key] = this.wrapValue(value);
      }
    }
    return result;
  }

  private wrapValue(value: unknown): unknown {
    if (value === null || value === undefined) return { '#text': '' };
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const obj = value as Record<string, unknown>;
      if ('name' in obj && 'value' in obj) {
        return {
          Name: obj.name,
          Value: { '@_xsi:type': 'xsd:string', '#text': String(obj.value) },
        };
      }
      return this.wrapBody(obj);
    }
    return { '#text': String(value) };
  }

  buildInform(
    id: string,
    deviceId: string,
    events: Array<{ eventCode: string; commandKey?: string }>,
    parameters: Array<{ name: string; value: string }>,
  ): string {
    const eventStructs = events.map((e) => ({
      EventStruct: {
        EventCode: e.eventCode,
        CommandKey: e.commandKey ?? '',
      },
    }));

    const paramStructs = parameters.map((p) => ({
      ParameterValueStruct: {
        Name: p.name,
        Value: { '@_xsi:type': 'xsd:string', '#text': p.value },
      },
    }));

    return this.buildEnvelope('Inform', id, {
      DeviceId: {
        Manufacturer: 'RouterGui',
        OUI: '001A2B',
        ProductClass: 'RGX-5000',
        SerialNumber: deviceId,
      },
      Event: eventStructs,
      MaxEnvelopes: 1,
      CurrentTime: new Date().toISOString(),
      RetryCount: 0,
      ParameterList: {
        '@_soap-enc:arrayType': `cwmp:ParameterValueStruct[${parameters.length}]`,
        ParameterValueStruct: paramStructs.map((p) => p.ParameterValueStruct),
      },
    });
  }
}

export class SoapParser {
  parse(xml: string): { method: string; id: string; body: Record<string, unknown> } | null {
    try {
      const parsed = parser.parse(xml);
      const envelope = parsed.Envelope ?? parsed['soap:Envelope'];
      if (!envelope) return null;

      const header = envelope.Header ?? envelope['soap:Header'];
      const id = header?.ID?.['#text'] ?? header?.ID ?? '';

      const body = envelope.Body ?? envelope['soap:Body'];
      if (!body) return null;

      const methodKeys = Object.keys(body).filter((k) => k !== 'Fault');
      if (methodKeys.length === 0) return null;

      const method = methodKeys[0].replace(/^cwmp:/, '');
      const methodBody = body[methodKeys[0]];

      return { method, id, body: this.flattenBody(methodBody) };
    } catch {
      return null;
    }
  }

  private flattenBody(body: unknown): Record<string, unknown> {
    if (!body || typeof body !== 'object') return {};
    const result: Record<string, unknown> = {};
    const obj = body as Record<string, unknown>;

    for (const [key, value] of Object.entries(obj)) {
      if (value && typeof value === 'object' && '#text' in (value as object)) {
        result[key] = (value as { '#text': string })['#text'];
      } else if (Array.isArray(value)) {
        result[key] = value;
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  extractParameterNames(body: Record<string, unknown>): string[] {
    const list = body.ParameterNames as Array<{ Name?: string }> | { Name?: string } | undefined;
    if (!list) return [];
    if (Array.isArray(list)) return list.map((p) => p.Name ?? '').filter(Boolean);
    if (typeof list === 'object' && 'Name' in list) {
      const names = list.Name;
      return Array.isArray(names) ? names : [names as string];
    }
    return [];
  }

  extractParameterValues(body: Record<string, unknown>): Array<{ name: string; value: string }> {
    const list = body.ParameterList as Record<string, unknown> | undefined;
    if (!list) return [];

    const structs = list.ParameterValueStruct;
    if (!structs) return [];

    const arr = Array.isArray(structs) ? structs : [structs];
    return arr.map((s: Record<string, unknown>) => ({
      name: String(s.Name ?? ''),
      value: this.extractValue(s.Value),
    }));
  }

  extractSetParameters(body: Record<string, unknown>): Array<{ name: string; value: string }> {
    return this.extractParameterValues(body);
  }

  private extractValue(value: unknown): string {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && '#text' in (value as object)) {
      return String((value as { '#text': unknown })['#text']);
    }
    return String(value);
  }
}
