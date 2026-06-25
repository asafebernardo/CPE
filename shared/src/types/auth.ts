import { DEFAULT_ACCOUNT_PASSWORD } from '../constants/credentials.js';

export type UserRole = 'USER' | 'TECHNICIAN' | 'ADMIN';

export const USER_ROLES: UserRole[] = ['USER', 'TECHNICIAN', 'ADMIN'];

export const ROLE_LEVEL: Record<UserRole, number> = {
  USER: 1,
  TECHNICIAN: 2,
  ADMIN: 3,
};

export const DEFAULT_USER_USERNAME = 'user';
export const DEFAULT_USER_PASSWORD = DEFAULT_ACCOUNT_PASSWORD;
export const DEFAULT_TECH_USERNAME = 'tech';
export const DEFAULT_TECH_PASSWORD = DEFAULT_ACCOUNT_PASSWORD;
