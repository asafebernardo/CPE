export interface ITransportAdapter {
  readonly transportName: 'CWMP' | 'USP-MQTT' | 'USP-WebSocket';
  connect(deviceId: string): Promise<void>;
  disconnect(deviceId: string): Promise<void>;
  send(deviceId: string, message: unknown): Promise<unknown>;
}

/** Active CWMP transport — implemented by CwmpClient */
export class CwmpTransportAdapter implements ITransportAdapter {
  readonly transportName = 'CWMP' as const;

  async connect(_deviceId: string): Promise<void> {
    // CWMP uses HTTP sessions initiated by Inform
  }

  async disconnect(_deviceId: string): Promise<void> {
    // No persistent connection in CWMP
  }

  async send(_deviceId: string, _message: unknown): Promise<unknown> {
    throw new Error('Use CwmpClient.runSession for CWMP transport');
  }
}

/** Stub for TR-369 USP MQTT transport */
export class UspMqttTransportAdapter implements ITransportAdapter {
  readonly transportName = 'USP-MQTT' as const;

  async connect(_deviceId: string): Promise<void> {
    // Future: mqtt.js connection
  }

  async disconnect(_deviceId: string): Promise<void> {
    // Future implementation
  }

  async send(_deviceId: string, _message: unknown): Promise<unknown> {
    throw new Error('USP MQTT transport not implemented in v1');
  }
}
