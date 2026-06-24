import jwt from 'jsonwebtoken';
import { prisma } from '../../infrastructure/database/prisma.js';
import { env } from '../../config/env.js';
import { verifyPassword, hashPassword } from '../../infrastructure/security/passwordHashing.js';
import type { LoginResponse, PasswordHashAlgorithm } from '@routergui/shared';

export class AuthService {
  async login(username: string, password: string): Promise<LoginResponse | null> {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return null;
    }

    const token = jwt.sign({ userId: user.id, username: user.username }, env.jwtSecret, {
      expiresIn: '24h',
    });

    return {
      token,
      user: { id: user.id, username: user.username, role: user.role as LoginResponse['user']['role'] },
      mustChangePassword: user.mustChangePassword,
    };
  }

  async changePassword(
    username: string,
    currentPassword: string,
    newPassword: string,
    algorithm: PasswordHashAlgorithm,
  ): Promise<{ ok: boolean; error?: string }> {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return { ok: false, error: 'User not found' };
    if (!(await verifyPassword(currentPassword, user.passwordHash))) {
      return { ok: false, error: 'Current password is incorrect' };
    }
    const passwordHash = await hashPassword(algorithm, newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, mustChangePassword: false },
    });
    return { ok: true };
  }

  verifyToken(token: string): { userId: string; username: string } | null {
    try {
      const decoded = jwt.verify(token, env.jwtSecret) as { userId: string; username: string };
      return decoded;
    } catch {
      return null;
    }
  }
}
