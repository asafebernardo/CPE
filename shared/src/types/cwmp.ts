export type CwmpMethod =
  | 'Inform'
  | 'InformResponse'
  | 'GetRPCMethods'
  | 'GetRPCMethodsResponse'
  | 'GetParameterValues'
  | 'GetParameterValuesResponse'
  | 'SetParameterValues'
  | 'SetParameterValuesResponse'
  | 'GetParameterNames'
  | 'GetParameterNamesResponse'
  | 'AddObject'
  | 'AddObjectResponse'
  | 'DeleteObject'
  | 'DeleteObjectResponse'
  | 'Reboot'
  | 'RebootResponse'
  | 'FactoryReset'
  | 'FactoryResetResponse';

export interface CwmpParameterValue {
  name: string;
  value: string;
}

export interface CwmpParameterInfo {
  name: string;
  writable: boolean;
}

export interface CwmpInformEvent {
  eventCode: string;
  commandKey?: string;
}

export interface CwmpSessionState {
  deviceId: string;
  acsUrl: string;
  sessionState: 'idle' | 'active' | 'error';
  lastInform: Date | null;
  lastEventCodes: string[];
  pendingEvents: CwmpInformEvent[];
}

export interface CwmpSoapMessage {
  method: CwmpMethod;
  id: string;
  body: Record<string, unknown>;
}

export type ParameterType = 'string' | 'int' | 'unsignedInt' | 'boolean';

export interface Tr098ParameterDto {
  path: string;
  value: string;
  type: ParameterType;
  writable: boolean;
  notification: number;
}
