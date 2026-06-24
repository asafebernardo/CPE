import type { ILogRepository } from '../../domain/repositories/ILogRepository.js';
import type { LogType } from '@routergui/shared';
import type { EventEmitter } from 'events';

export class LogService {
  constructor(
    private readonly logRepo: ILogRepository,
    private readonly eventBus?: EventEmitter,
  ) {}

  async log(deviceId: string, type: LogType, message: string, details?: string) {
    const entry = await this.logRepo.create(deviceId, type, message, details);
    this.eventBus?.emit('log.new', {
      id: entry.id,
      type: entry.type,
      message: entry.message,
      createdAt: entry.createdAt.toISOString(),
    });
    return entry;
  }

  async getLogs(deviceId: string, options?: { type?: string; page?: number; limit?: number }) {
    return this.logRepo.findByDevice(deviceId, options);
  }
}
