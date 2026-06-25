import type { UserRole } from './auth.js';

export interface SystemUserDto {
  id: string;
  username: string;
  role: UserRole;
  enabled: boolean;
  mustChangePassword: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateSystemUserInput {
  username?: string;
  role?: UserRole;
  password?: string;
  enabled?: boolean;
  mustChangePassword?: boolean;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  USER: 'User',
  TECHNICIAN: 'Technician',
  ADMIN: 'Admin',
};
