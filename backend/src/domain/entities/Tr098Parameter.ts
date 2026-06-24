import type { ParameterType } from '@routergui/shared';

export interface Tr098ParameterEntity {
  id: string;
  deviceId: string;
  path: string;
  value: string;
  type: ParameterType;
  writable: boolean;
  notification: number;
}
