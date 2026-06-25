import { prisma } from '../../infrastructure/database/prisma.js';
import { hashPassword } from '../../infrastructure/security/passwordHashing.js';
import { validateAdminPasswordPolicy } from '@aerobrry/shared';
import type {
  PasswordHashAlgorithm,
  SecurityProfile,
  SystemUserDto,
  UpdateSystemUserInput,
  UserRole,
} from '@aerobrry/shared';
import type { LogService } from './LogService.js';

const USERNAME_PATTERN = /^[a-zA-Z0-9._-]{3,32}$/;

export class UserManagementService {
  constructor(private readonly logService?: LogService) {}

  async list(): Promise<SystemUserDto[]> {
    const rows = await prisma.user.findMany({ orderBy: { username: 'asc' } });
    return rows.map((r) => this.toDto(r));
  }

  async update(
    id: string,
    data: UpdateSystemUserInput,
    options: {
      passwordHashAlgorithm: PasswordHashAlgorithm;
      securityProfile: SecurityProfile;
      deviceId?: string;
    },
  ): Promise<SystemUserDto> {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) throw new Error('User not found');

    if (data.username !== undefined && data.username !== existing.username) {
      if (!USERNAME_PATTERN.test(data.username)) {
        throw new Error('Username must be 3–32 characters (letters, numbers, . _ -)');
      }
      const taken = await prisma.user.findUnique({ where: { username: data.username } });
      if (taken && taken.id !== id) {
        throw new Error('Username is already in use');
      }
    }

    if (data.enabled === false && existing.role === 'ADMIN') {
      throw new Error('Administrator accounts cannot be disabled');
    }

    if (data.role && data.role !== existing.role && existing.role === 'ADMIN') {
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
      if (adminCount <= 1) {
        throw new Error('Cannot change role of the only administrator');
      }
    }

    const updateData: {
      username?: string;
      role?: string;
      enabled?: boolean;
      mustChangePassword?: boolean;
      passwordHash?: string;
    } = {};

    if (data.username !== undefined) updateData.username = data.username;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.enabled !== undefined) updateData.enabled = data.enabled;
    if (data.mustChangePassword !== undefined) updateData.mustChangePassword = data.mustChangePassword;

    if (data.password !== undefined && data.password.length > 0) {
      const policy = validateAdminPasswordPolicy(options.securityProfile, data.password);
      if (!policy.valid) {
        throw new Error(policy.errors.join('. '));
      }
      updateData.passwordHash = await hashPassword(options.passwordHashAlgorithm, data.password);
    }

    const row = await prisma.user.update({ where: { id }, data: updateData });

    if (options.deviceId && this.logService) {
      await this.logService.log(
        options.deviceId,
        'SECURITY',
        `System user updated: ${row.username}`,
      );
    }

    return this.toDto(row);
  }

  private toDto(row: {
    id: string;
    username: string;
    role: string;
    enabled: boolean;
    mustChangePassword: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): SystemUserDto {
    return {
      id: row.id,
      username: row.username,
      role: row.role as UserRole,
      enabled: row.enabled,
      mustChangePassword: row.mustChangePassword,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
