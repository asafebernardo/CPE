import type { ILogRepository } from '../../../domain/repositories/ILogRepository.js';
import type { LogEntryEntity } from '../../../domain/entities/LogEntry.js';
import type { LogType } from '@routergui/shared';
import { prisma } from '../prisma.js';

export class PrismaLogRepository implements ILogRepository {
  async create(deviceId: string, type: LogType, message: string, details?: string): Promise<LogEntryEntity> {
    const row = await prisma.logEntry.create({
      data: { deviceId, type, message, details },
    });
    return {
      id: row.id,
      deviceId: row.deviceId,
      type: row.type as LogType,
      message: row.message,
      details: row.details ?? undefined,
      createdAt: row.createdAt,
    };
  }

  async findByDevice(
    deviceId: string,
    options?: { type?: string; page?: number; limit?: number },
  ): Promise<{ entries: LogEntryEntity[]; total: number }> {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 50;
    const where = {
      deviceId,
      ...(options?.type ? { type: options.type } : {}),
    };

    const [rows, total] = await prisma.$transaction([
      prisma.logEntry.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.logEntry.count({ where }),
    ]);

    return {
      entries: rows.map((r) => ({
        id: r.id,
        deviceId: r.deviceId,
        type: r.type as LogType,
        message: r.message,
        details: r.details ?? undefined,
        createdAt: r.createdAt,
      })),
      total,
    };
  }
}
