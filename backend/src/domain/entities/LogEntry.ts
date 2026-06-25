import type { LogType } from '@aerobrry/shared';

export interface LogEntryEntity {
  id: string;
  deviceId: string;
  type: LogType;
  message: string;
  details?: string;
  createdAt: Date;
}
