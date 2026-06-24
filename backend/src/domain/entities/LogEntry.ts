import type { LogType } from '@routergui/shared';

export interface LogEntryEntity {
  id: string;
  deviceId: string;
  type: LogType;
  message: string;
  details?: string;
  createdAt: Date;
}
