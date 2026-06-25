/**
 * Security compliance profiles and password policy engine.
 *
 * Models three operating profiles for the virtual CPE — Legacy, ISP Standard
 * and ANATEL Compliance (Ato nº 2436/2023) — and the reusable, pure validation
 * logic shared between the backend (enforcement) and frontend (live feedback).
 *
 * The architecture is intentionally data-driven so new regulatory profiles
 * (other countries, per-operator custom profiles) can be added by extending
 * SECURITY_PROFILES without touching enforcement code.
 */

import type { WifiSecurityMode } from './security.js';

export type SecurityProfile = 'legacy' | 'isp-standard' | 'anatel';

export type ComplianceBadge = 'Legacy' | 'Recommended' | 'Modern';

export interface SecurityProfileMeta {
  id: SecurityProfile;
  label: string;
  description: string;
  badge: ComplianceBadge;
  /** Wi-Fi security modes permitted under this profile. */
  allowedWifiModes: WifiSecurityMode[];
  /** Require upper/lower/digit/special in Wi-Fi passphrase. */
  wifiPasswordComplexity: boolean;
  /** Require upper/lower/digit/special in admin password. */
  adminPasswordComplexity: boolean;
  /** Minimum admin password length. */
  minAdminPasswordLength: number;
  /** Enforce the common-password blocklist. */
  enforceBlocklist: boolean;
  /** Allow weak/legacy certificate key types (RSA-1024). */
  allowLegacyCerts: boolean;
}

export const SECURITY_PROFILES: SecurityProfileMeta[] = [
  {
    id: 'legacy',
    label: 'Legacy',
    description: 'Permite configurações antigas e inseguras para testes e equipamentos legados.',
    badge: 'Legacy',
    allowedWifiModes: [
      'open', 'wep-64', 'wep-128', 'wpa-psk-tkip', 'wpa-psk-aes', 'wpa-wpa2-mixed',
      'wpa2-psk-aes', 'wpa2-enterprise', 'wpa2-wpa3-mixed', 'wpa3-personal', 'wpa3-enterprise',
    ],
    wifiPasswordComplexity: false,
    adminPasswordComplexity: false,
    minAdminPasswordLength: 4,
    enforceBlocklist: false,
    allowLegacyCerts: true,
  },
  {
    id: 'isp-standard',
    label: 'ISP Standard',
    description: 'Permite configurações comuns em provedores, bloqueando Open e WEP.',
    badge: 'Recommended',
    allowedWifiModes: [
      'wpa-psk-tkip', 'wpa-psk-aes', 'wpa-wpa2-mixed',
      'wpa2-psk-aes', 'wpa2-enterprise', 'wpa2-wpa3-mixed', 'wpa3-personal', 'wpa3-enterprise',
    ],
    wifiPasswordComplexity: false,
    adminPasswordComplexity: false,
    minAdminPasswordLength: 6,
    enforceBlocklist: true,
    allowLegacyCerts: false,
  },
  {
    id: 'anatel',
    label: 'ANATEL Compliance',
    description: 'Aplica todas as restrições de segurança exigidas para homologação moderna (Ato nº 2436/2023).',
    badge: 'Modern',
    allowedWifiModes: ['wpa2-psk-aes', 'wpa2-wpa3-mixed', 'wpa3-personal', 'wpa3-enterprise'],
    wifiPasswordComplexity: true,
    adminPasswordComplexity: true,
    minAdminPasswordLength: 8,
    enforceBlocklist: true,
    allowLegacyCerts: false,
  },
];

export function getSecurityProfile(id: string): SecurityProfileMeta {
  return SECURITY_PROFILES.find((p) => p.id === id) ?? SECURITY_PROFILES[1];
}

export function isWifiModeAllowed(profileId: string, modeId: WifiSecurityMode): boolean {
  return getSecurityProfile(profileId).allowedWifiModes.includes(modeId);
}

/** Compliance badge for a given Wi-Fi security mode. */
export function wifiModeBadge(modeId: WifiSecurityMode): ComplianceBadge {
  if (getSecurityProfile('anatel').allowedWifiModes.includes(modeId)) return 'Modern';
  if (getSecurityProfile('isp-standard').allowedWifiModes.includes(modeId)) return 'Recommended';
  return 'Legacy';
}

export const COMPLIANCE_BADGE_COLORS: Record<ComplianceBadge, string> = {
  Legacy: '#f97316',
  Recommended: '#22c55e',
  Modern: '#06b6d4',
};

/* ============================================================
 * COMMON PASSWORD BLOCKLIST
 * ========================================================== */

export const COMMON_PASSWORDS: string[] = [
  '12345678', '123456789', '1234567890', '123456', 'password', 'password1', 'passw0rd',
  'admin', 'admin123', 'administrator', 'root', 'qwerty123', 'qwertyuiop', 'qwerty',
  'welcome', 'welcome1', 'internet', 'wifi12345', 'wifipassword', 'changeme',
  'abcdefgh', 'abc12345', 'letmein', 'iloveyou', 'sunshine', 'master', 'dragon',
  'monkey', '11111111', '00000000', 'senha123', 'mudar123', 'roteador', 'router',
];

const COMMON_SET = new Set(COMMON_PASSWORDS.map((p) => p.toLowerCase()));

export function isCommonPassword(password: string): boolean {
  return COMMON_SET.has(password.toLowerCase().trim());
}

export const COMMON_PASSWORD_MESSAGE = 'This password is commonly used and cannot be selected.';

/* ============================================================
 * COMPLEXITY + STRENGTH
 * ========================================================== */

export interface ComplexityResult {
  hasUpper: boolean;
  hasLower: boolean;
  hasDigit: boolean;
  hasSpecial: boolean;
  length: number;
}

export function analyzeComplexity(password: string): ComplexityResult {
  return {
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasDigit: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
    length: password.length,
  };
}

export type PasswordStrengthLevel = 'very-weak' | 'weak' | 'medium' | 'strong' | 'very-strong';

export interface PasswordStrengthResult {
  score: number; // 0-100
  level: PasswordStrengthLevel;
  entropyBits: number;
  feedback: string[];
}

const STRENGTH_LABELS: Record<PasswordStrengthLevel, string> = {
  'very-weak': 'Very Weak',
  weak: 'Weak',
  medium: 'Medium',
  strong: 'Strong',
  'very-strong': 'Very Strong',
};

export function passwordStrengthLabel(level: PasswordStrengthLevel): string {
  return STRENGTH_LABELS[level];
}

function hasSequentialOrRepeated(password: string): boolean {
  const lower = password.toLowerCase();
  if (/(.)\1{2,}/.test(lower)) return true; // 3+ repeated chars
  const sequences = ['abcdefghijklmnopqrstuvwxyz', '0123456789', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
  for (const seq of sequences) {
    for (let i = 0; i + 4 <= seq.length; i++) {
      const chunk = seq.slice(i, i + 4);
      if (lower.includes(chunk)) return true;
    }
  }
  return false;
}

/** Estimates password strength from charset entropy, complexity and patterns. */
export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  const feedback: string[] = [];
  if (!password) {
    return { score: 0, level: 'very-weak', entropyBits: 0, feedback: ['Enter a password'] };
  }

  const c = analyzeComplexity(password);
  let pool = 0;
  if (c.hasLower) pool += 26;
  if (c.hasUpper) pool += 26;
  if (c.hasDigit) pool += 10;
  if (c.hasSpecial) pool += 33;
  const entropyBits = pool > 0 ? Math.round(password.length * Math.log2(pool)) : 0;

  let score = Math.min(100, Math.round((entropyBits / 80) * 100));

  const classes = [c.hasLower, c.hasUpper, c.hasDigit, c.hasSpecial].filter(Boolean).length;
  if (c.length < 8) { score -= 30; feedback.push('Use at least 8 characters'); }
  if (classes < 3) feedback.push('Mix uppercase, lowercase, numbers and symbols');
  if (!c.hasSpecial) feedback.push('Add a special character');

  if (isCommonPassword(password)) { score = Math.min(score, 10); feedback.push('Common password — easily guessed'); }
  if (hasSequentialOrRepeated(password)) { score -= 20; feedback.push('Avoid sequences and repeated characters'); }

  score = Math.max(0, Math.min(100, score));

  let level: PasswordStrengthLevel;
  if (score < 20) level = 'very-weak';
  else if (score < 40) level = 'weak';
  else if (score < 60) level = 'medium';
  else if (score < 85) level = 'strong';
  else level = 'very-strong';

  if (feedback.length === 0) feedback.push('Strong password');
  return { score, level, entropyBits, feedback };
}

/* ============================================================
 * POLICY VALIDATION (Wi-Fi + Admin)
 * ========================================================== */

export interface PolicyValidation {
  valid: boolean;
  errors: string[];
}

function complexityErrors(password: string, minLength: number): string[] {
  const errors: string[] = [];
  const c = analyzeComplexity(password);
  if (c.length < minLength) errors.push(`At least ${minLength} characters`);
  if (!c.hasUpper) errors.push('At least one uppercase letter');
  if (!c.hasLower) errors.push('At least one lowercase letter');
  if (!c.hasDigit) errors.push('At least one number');
  if (!c.hasSpecial) errors.push('At least one special character');
  return errors;
}

/**
 * Validates a Wi-Fi passphrase against the active profile.
 * Note: length-by-mode rules (WEP/WPA) are validated separately via
 * validateWifiPassword in security.ts; this layer adds profile policy.
 */
export function validateWifiPasswordPolicy(profileId: string, password: string): PolicyValidation {
  const profile = getSecurityProfile(profileId);
  const errors: string[] = [];

  if (profile.enforceBlocklist && isCommonPassword(password)) {
    errors.push(COMMON_PASSWORD_MESSAGE);
  }
  if (profile.wifiPasswordComplexity) {
    errors.push(...complexityErrors(password, 8));
  }
  return { valid: errors.length === 0, errors };
}

export function validateAdminPasswordPolicy(profileId: string, password: string): PolicyValidation {
  const profile = getSecurityProfile(profileId);
  const errors: string[] = [];

  if (profile.enforceBlocklist && isCommonPassword(password)) {
    errors.push(COMMON_PASSWORD_MESSAGE);
  }
  if (profile.adminPasswordComplexity) {
    errors.push(...complexityErrors(password, profile.minAdminPasswordLength));
  } else if (password.length < profile.minAdminPasswordLength) {
    errors.push(`At least ${profile.minAdminPasswordLength} characters`);
  }
  return { valid: errors.length === 0, errors };
}

/* ============================================================
 * CONFIGURATION AUDIT
 * ========================================================== */

export type AuditStatus = 'pass' | 'warn' | 'fail';

export interface AuditCheckDto {
  id: string;
  label: string;
  status: AuditStatus;
  detail: string;
}

export interface AuditReportDto {
  profile: SecurityProfile;
  generatedAt: string;
  passed: number;
  warnings: number;
  failed: number;
  checks: AuditCheckDto[];
}

/* ============================================================
 * SCORE CLASSIFICATION
 * ========================================================== */

export type ScoreClassification = 'Critical' | 'Poor' | 'Fair' | 'Good' | 'Excellent';

export function classifyScore(score: number): ScoreClassification {
  if (score >= 90) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Fair';
  if (score >= 30) return 'Poor';
  return 'Critical';
}

export const SCORE_CLASSIFICATION_COLORS: Record<ScoreClassification, string> = {
  Critical: '#ef4444',
  Poor: '#f97316',
  Fair: '#eab308',
  Good: '#22c55e',
  Excellent: '#06b6d4',
};
