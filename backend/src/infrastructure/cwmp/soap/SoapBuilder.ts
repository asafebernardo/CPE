import { XMLBuilder, XMLParser } from 'fast-xml-parser';
import { CWMP_NAMESPACE } from '@aerobrry/shared';

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
      if (key === 'MethodList' && Array.isArray(value)) {
        result[key] = {
          '@_soap-enc:arrayType': `xsd:string[${value.length}]`,
          string: value,
        };
      } else if (key === 'ParameterList' && Array.isArray(value)) {
        const isInfoStruct = value.length > 0 && typeof value[0] === 'object' && value[0] !== null && 'writable' in value[0];
        if (isInfoStruct) {
          result[key] = {
            '@_soap-enc:arrayType': `cwmp:ParameterInfoStruct[${value.length}]`,
            ...(value.length > 0 ? { ParameterInfoStruct: value.map((item) => this.wrapValue(item)) } : {}),
          };
        } else {
          result[key] = {
            '@_soap-enc:arrayType': `cwmp:ParameterValueStruct[${value.length}]`,
            ...(value.length > 0 ? { ParameterValueStruct: value.map((item) => this.wrapValue(item)) } : {}),
          };
        }
      } else if (Array.isArray(value)) {
        result[key] = value.map((item) => this.wrapValue(item));
      } else {
        result[key] = this.wrapScalarValue(key, value);
      }
    }
    return result;
  }

  /** Status and numeric CWMP fields use unsignedInt */
  private wrapScalarValue(key: string, value: unknown): unknown {
    if (key === 'Status' || key === 'InstanceNumber') {
      return { '@_xsi:type': 'xsd:unsignedInt', '#text': String(value) };
    }
    return this.wrapValue(value);
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
      if ('name' in obj && 'writable' in obj) {
        const writable = obj.writable === true || obj.writable === 'true' || obj.writable === '1' || obj.writable === 1;
        return {
          Name: obj.name,
          Writable: { '@_xsi:type': 'xsd:boolean', '#text': writable ? '1' : '0' },
        };
      }
      return this.wrapBody(obj);
    }
    return { '#text': String(value) };
  }

  buildInform(
    id: string,
    serialNumber: string,
    events: Array<{ eventCode: string; commandKey?: string }>,
    parameters: Array<{ name: string; value: string }>,
    deviceId?: { manufacturer?: string; oui?: string; productClass?: string },
  ): string {
    const eventStructs = events.map((e) => ({
      EventCode: e.eventCode,
      CommandKey: e.commandKey ?? '',
    }));

    const paramStructs = parameters.map((p) => ({
      Name: p.name,
      Value: { '@_xsi:type': 'xsd:string', '#text': p.value },
    }));

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
          'cwmp:Inform': {
            DeviceId: {
              Manufacturer: deviceId?.manufacturer ?? 'AeroBerry',
              OUI: deviceId?.oui ?? '001A2B',
              ProductClass: deviceId?.productClass ?? 'RGX-5000',
              SerialNumber: serialNumber,
            },
            Event: {
              '@_soap-enc:arrayType': `cwmp:EventStruct[${events.length}]`,
              EventStruct: eventStructs,
            },
            MaxEnvelopes: 1,
            CurrentTime: new Date().toISOString(),
            RetryCount: 0,
            ParameterList: {
              '@_soap-enc:arrayType': `cwmp:ParameterValueStruct[${parameters.length}]`,
              ParameterValueStruct: paramStructs,
            },
          },
        },
      },
    };

    return builder.build(envelope);
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
      if (key.startsWith('@')) continue;
      if (value && typeof value === 'object' && '#text' in (value as object)) {
        result[key] = (value as { '#text': string })['#text'];
      } else if (value && typeof value === 'object' && '#' in (value as object)) {
        result[key] = (value as { '#': string })['#'];
      } else if (Array.isArray(value)) {
        result[key] = value;
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  extractParameterNames(body: Record<string, unknown>): string[] {
    const list = body.ParameterNames;
    if (list === undefined || list === null) return [];
    return this.collectCwmpStringArray(list);
  }

  /** Unwrap IXC/ACS ParameterNames encodings (string array, SOAP-ENC array, single string). */
  private collectCwmpStringArray(node: unknown): string[] {
    if (typeof node === 'string') {
      const trimmed = node.trim();
      return trimmed ? [trimmed] : [];
    }

    if (Array.isArray(node)) {
      return node.flatMap((item) => this.collectCwmpStringArray(item));
    }

    if (typeof node === 'object' && node !== null) {
      const obj = node as Record<string, unknown>;
      if ('#text' in obj) {
        const text = String(obj['#text']).trim();
        return text ? [text] : [];
      }
      if ('string' in obj) return this.collectCwmpStringArray(obj.string);
      if ('Name' in obj) return this.collectCwmpStringArray(obj.Name);
      if ('ParameterPath' in obj) return this.collectCwmpStringArray(obj.ParameterPath);
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
      name: this.normalizeCwmpName(s.Name),
      value: this.extractCwmpValue(s.Value),
    }));
  }

  private normalizeCwmpName(name: unknown): string {
    if (Array.isArray(name)) return String(name[0] ?? '');
    if (name && typeof name === 'object' && '#text' in (name as object)) {
      return String((name as { '#text': unknown })['#text']);
    }
    return String(name ?? '');
  }

  private extractCwmpValue(value: unknown): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    if (typeof value === 'object') {
      const obj = value as Record<string, unknown>;
      if ('#text' in obj) return String(obj['#text']);
      if ('#' in obj) return String(obj['#']);
      if ('value' in obj) return String(obj.value);
    }
    return '';
  }

  extractSetParameters(body: Record<string, unknown>): Array<{ name: string; value: string }> {
    return this.extractParameterValues(body);
  }
}
