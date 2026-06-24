import type { IParameterRepository } from '../../../domain/services/IParameterTreeService.js';
import type { Tr098ParameterEntity } from '../../../domain/entities/Tr098Parameter.js';
import type { ParameterType } from '@routergui/shared';
import { prisma } from '../prisma.js';

export class PrismaParameterRepository implements IParameterRepository {
  private map(row: {
    id: string;
    deviceId: string;
    path: string;
    value: string;
    type: string;
    writable: boolean;
    notification: number;
  }): Tr098ParameterEntity {
    return {
      id: row.id,
      deviceId: row.deviceId,
      path: row.path,
      value: row.value,
      type: row.type as ParameterType,
      writable: row.writable,
      notification: row.notification,
    };
  }

  async findByDevice(deviceId: string): Promise<Tr098ParameterEntity[]> {
    const rows = await prisma.tr098Parameter.findMany({ where: { deviceId } });
    return rows.map((r) => this.map(r));
  }

  async findByPath(deviceId: string, path: string): Promise<Tr098ParameterEntity | null> {
    const row = await prisma.tr098Parameter.findUnique({
      where: { deviceId_path: { deviceId, path } },
    });
    return row ? this.map(row) : null;
  }

  async findByPathPrefix(deviceId: string, prefix: string): Promise<Tr098ParameterEntity[]> {
    const rows = await prisma.tr098Parameter.findMany({
      where: {
        deviceId,
        path: { startsWith: prefix },
      },
    });
    return rows.map((r) => this.map(r));
  }

  async upsert(
    deviceId: string,
    path: string,
    value: string,
    writable = false,
    type = 'string',
  ): Promise<Tr098ParameterEntity> {
    const row = await prisma.tr098Parameter.upsert({
      where: { deviceId_path: { deviceId, path } },
      create: { deviceId, path, value, writable, type },
      update: { value, writable, type },
    });
    return this.map(row);
  }

  async bulkUpsert(
    deviceId: string,
    params: Array<{ path: string; value: string; writable?: boolean; type?: string }>,
  ): Promise<void> {
    for (const p of params) {
      await this.upsert(deviceId, p.path, p.value, p.writable ?? false, p.type ?? 'string');
    }
  }

  async deleteByDevice(deviceId: string): Promise<void> {
    await prisma.tr098Parameter.deleteMany({ where: { deviceId } });
  }
}
