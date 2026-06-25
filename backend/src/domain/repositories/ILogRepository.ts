import type { LogEntryEntity } from '../entities/LogEntry.js';
import type { LogType } from '@aerobrry/shared';

export interface ILogRepository {
  create(deviceId: string, type: LogType, message: string, details?: string): Promise<LogEntryEntity>;
  findByDevice(deviceId: string, options?: { type?: string; page?: number; limit?: number }): Promise<{ entries: LogEntryEntity[]; total: number }>;
}
