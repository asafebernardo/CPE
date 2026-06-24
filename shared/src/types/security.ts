/**
 * Central security catalog for the RouterGui Virtual CPE.
 *
 * Single source of truth for every Wi-Fi security mode, password hashing
 * algorithm, credential encryption scheme, certificate type and backup
 * encryption method the simulator can emulate — from legacy provider gear
 * (WEP, MD5, RSA-1024) to modern equipment (WPA3, Argon2id, AES-256, ECDSA).
 */

/** Visual security rating shown across the UI. */
export type SecurityLevel = 'critical' | 'weak' | 'legacy' | 'recommended' | 'modern';

/** Grouping category for selection lists. */
export type SecurityCategory = 'modern' | 'recommended' | 'legacy' | 'obsolete';

export interface SecurityLevelMeta {
  level: SecurityLevel;
  label: string;
  /** Hex color (theme-agnostic) used for chips/badges. */
  color: string;
  /** 0-100 numeric weight used for scoring. */
  score: number;
}

export const SECURITY_LEVELS: Record<SecurityLevel, SecurityLevelMeta> = {
  critical: { level: 'critical', label: 'Critical', color: '#ef4444', score: 10 },
  weak: { level: 'weak', label: 'Weak', color: '#f97316', score: 35 },
  legacy: { level: 'legacy', label: 'Legacy', color: '#eab308', score: 55 },
  recommended: { level: 'recommended', label: 'Recommended', color: '#22c55e', score: 85 },
  modern: { level: 'modern', label: 'Modern', color: '#06b6d4', score: 100 },
};

/* ============================================================
 * WI-FI SECURITY
 * ========================================================== */

export type WifiSecurityMode =
  | 'open'
  | 'wep-64'
  | 'wep-128'
  | 'wpa-psk-tkip'
  | 'wpa-psk-aes'
  | 'wpa-wpa2-mixed'
  | 'wpa2-psk-aes'
  | 'wpa2-enterprise'
  | 'wpa2-wpa3-mixed'
  | 'wpa3-personal'
  | 'wpa3-enterprise';

/** How the Wi-Fi passphrase/key must be validated for a given mode. */
export type WifiKeyRule = 'none' | 'wep64' | 'wep128' | 'psk' | 'sae' | 'enterprise';

export interface WifiSecurityModeMeta {
  id: WifiSecurityMode;
  label: string;
  encryption: string;
  level: SecurityLevel;
  category: SecurityCategory;
  compatibility: string;
  keyRule: WifiKeyRule;
  /** Whether this mode requires legacy compatibility to be enabled. */
  legacyOnly: boolean;
}

export const WIFI_SECURITY_MODES: WifiSecurityModeMeta[] = [
  { id: 'open', label: 'Open (No Security)', encryption: 'None', level: 'critical', category: 'obsolete', compatibility: 'All devices', keyRule: 'none', legacyOnly: true },
  { id: 'wep-64', label: 'WEP 64-bit', encryption: 'WEP / RC4 (40-bit)', level: 'critical', category: 'obsolete', compatibility: 'Very old devices (pre-2003)', keyRule: 'wep64', legacyOnly: true },
  { id: 'wep-128', label: 'WEP 128-bit', encryption: 'WEP / RC4 (104-bit)', level: 'critical', category: 'obsolete', compatibility: 'Old devices (pre-2004)', keyRule: 'wep128', legacyOnly: true },
  { id: 'wpa-psk-tkip', label: 'WPA-PSK (TKIP)', encryption: 'TKIP', level: 'weak', category: 'legacy', compatibility: 'Legacy devices (2003+)', keyRule: 'psk', legacyOnly: true },
  { id: 'wpa-psk-aes', label: 'WPA-PSK (AES)', encryption: 'AES-CCMP', level: 'legacy', category: 'legacy', compatibility: 'Legacy devices (2004+)', keyRule: 'psk', legacyOnly: false },
  { id: 'wpa-wpa2-mixed', label: 'WPA/WPA2 Mixed', encryption: 'TKIP + AES-CCMP', level: 'legacy', category: 'legacy', compatibility: 'Broad compatibility', keyRule: 'psk', legacyOnly: false },
  { id: 'wpa2-psk-aes', label: 'WPA2-PSK (AES)', encryption: 'AES-CCMP', level: 'recommended', category: 'recommended', compatibility: 'Most devices (2006+)', keyRule: 'psk', legacyOnly: false },
  { id: 'wpa2-enterprise', label: 'WPA2 Enterprise', encryption: 'AES-CCMP + 802.1X', level: 'recommended', category: 'recommended', compatibility: 'Enterprise / RADIUS', keyRule: 'enterprise', legacyOnly: false },
  { id: 'wpa2-wpa3-mixed', label: 'WPA2/WPA3 Mixed', encryption: 'AES-CCMP + SAE', level: 'recommended', category: 'recommended', compatibility: 'Transitional (2018+)', keyRule: 'psk', legacyOnly: false },
  { id: 'wpa3-personal', label: 'WPA3 Personal (SAE)', encryption: 'AES-CCMP + SAE', level: 'modern', category: 'modern', compatibility: 'Modern devices (2019+)', keyRule: 'sae', legacyOnly: false },
  { id: 'wpa3-enterprise', label: 'WPA3 Enterprise', encryption: 'AES-GCMP-256 + 802.1X', level: 'modern', category: 'modern', compatibility: 'Modern enterprise', keyRule: 'enterprise', legacyOnly: false },
];

export function getWifiSecurityMode(id: string): WifiSecurityModeMeta | undefined {
  return WIFI_SECURITY_MODES.find((m) => m.id === id);
}

/** Normalizes legacy/free-form security values (e.g. "WPA2") to a known mode id. */
export function normalizeWifiSecurityMode(value: string | undefined | null): WifiSecurityMode {
  if (!value) return 'wpa2-psk-aes';
  if (getWifiSecurityMode(value)) return value as WifiSecurityMode;
  const v = value.toUpperCase().replace(/[\s_-]/g, '');
  if (v === 'OPEN' || v === 'NONE') return 'open';
  if (v.includes('WEP') && v.includes('64')) return 'wep-64';
  if (v.includes('WEP')) return 'wep-128';
  if (v.includes('WPA3') && v.includes('ENTERPRISE')) return 'wpa3-enterprise';
  if (v.includes('WPA3')) return 'wpa3-personal';
  if (v.includes('WPA2') && v.includes('WPA3')) return 'wpa2-wpa3-mixed';
  if (v.includes('WPA2') && v.includes('ENTERPRISE')) return 'wpa2-enterprise';
  if (v.includes('WPA2')) return 'wpa2-psk-aes';
  if (v.includes('WPA') && v.includes('TKIP')) return 'wpa-psk-tkip';
  if (v.includes('WPA')) return 'wpa-psk-aes';
  return 'wpa2-psk-aes';
}

export interface WifiPasswordValidation {
  valid: boolean;
  message: string;
}

const HEX_RE = /^[0-9a-fA-F]+$/;

/** Validates a Wi-Fi key/passphrase according to the selected security mode. */
export function validateWifiPassword(modeId: string, password: string): WifiPasswordValidation {
  const mode = getWifiSecurityMode(modeId);
  if (!mode) return { valid: false, message: 'Unknown security mode' };

  switch (mode.keyRule) {
    case 'none':
    case 'enterprise':
      return { valid: true, message: 'No PSK required for this mode' };
    case 'wep64':
      if (password.length === 5) return { valid: true, message: '5 ASCII characters (40-bit)' };
      if (password.length === 10 && HEX_RE.test(password)) return { valid: true, message: '10 HEX digits (40-bit)' };
      return { valid: false, message: 'WEP 64-bit requires 5 ASCII chars or 10 HEX digits' };
    case 'wep128':
      if (password.length === 13) return { valid: true, message: '13 ASCII characters (104-bit)' };
      if (password.length === 26 && HEX_RE.test(password)) return { valid: true, message: '26 HEX digits (104-bit)' };
      return { valid: false, message: 'WEP 128-bit requires 13 ASCII chars or 26 HEX digits' };
    case 'psk':
      if (password.length < 8 || password.length > 63) return { valid: false, message: 'WPA passphrase must be 8–63 characters' };
      return { valid: true, message: 'Valid WPA passphrase' };
    case 'sae':
      if (password.length < 8 || password.length > 63) return { valid: false, message: 'WPA3 SAE passphrase must be 8–63 characters' };
      return { valid: true, message: 'Valid SAE passphrase' };
    default:
      return { valid: true, message: '' };
  }
}

/* ============================================================
 * WEB LOGIN PASSWORD STORAGE
 * ========================================================== */

export type PasswordHashAlgorithm =
  | 'plain'
  | 'md5'
  | 'sha1'
  | 'sha256'
  | 'sha512'
  | 'pbkdf2'
  | 'bcrypt'
  | 'argon2i'
  | 'argon2id';

export interface PasswordHashAlgorithmMeta {
  id: PasswordHashAlgorithm;
  label: string;
  level: SecurityLevel;
  category: SecurityCategory;
  /** Approximate year the algorithm became common for password storage. */
  year: number;
  /** Whether the simulator performs a real hash (vs. visual simulation only). */
  real: boolean;
  description: string;
}

export const PASSWORD_HASH_ALGORITHMS: PasswordHashAlgorithmMeta[] = [
  { id: 'plain', label: 'Plain Text', level: 'critical', category: 'obsolete', year: 1980, real: true, description: 'No protection — stored as-is (simulation only)' },
  { id: 'md5', label: 'MD5', level: 'critical', category: 'obsolete', year: 1992, real: true, description: 'Broken — collisions and fast brute-force' },
  { id: 'sha1', label: 'SHA-1', level: 'weak', category: 'obsolete', year: 1995, real: true, description: 'Deprecated — unsalted and fast' },
  { id: 'sha256', label: 'SHA-256', level: 'weak', category: 'legacy', year: 2001, real: true, description: 'Fast hash — not designed for passwords' },
  { id: 'sha512', label: 'SHA-512', level: 'legacy', category: 'legacy', year: 2001, real: true, description: 'Fast hash — better than SHA-256 but unsuitable alone' },
  { id: 'pbkdf2', label: 'PBKDF2', level: 'recommended', category: 'recommended', year: 2000, real: true, description: 'Key derivation with iterations and salt' },
  { id: 'bcrypt', label: 'bcrypt', level: 'recommended', category: 'recommended', year: 1999, real: true, description: 'Adaptive cost, salted — solid default' },
  { id: 'argon2i', label: 'Argon2i', level: 'modern', category: 'modern', year: 2015, real: true, description: 'Memory-hard, side-channel resistant' },
  { id: 'argon2id', label: 'Argon2id', level: 'modern', category: 'modern', year: 2015, real: true, description: 'Hybrid Argon2 — current best practice' },
];

export function getPasswordHashAlgorithm(id: string): PasswordHashAlgorithmMeta | undefined {
  return PASSWORD_HASH_ALGORITHMS.find((a) => a.id === id);
}

/* ============================================================
 * TR-069 CREDENTIAL STORAGE
 * ========================================================== */

export type CredentialEncryptionType = 'plain' | 'base64' | 'aes-128' | 'aes-256';

export interface CredentialEncryptionMeta {
  id: CredentialEncryptionType;
  label: string;
  level: SecurityLevel;
  category: SecurityCategory;
  real: boolean;
  warning?: string;
}

export const CREDENTIAL_ENCRYPTION_TYPES: CredentialEncryptionMeta[] = [
  { id: 'plain', label: 'Plain Text', level: 'critical', category: 'obsolete', real: true, warning: 'Credentials stored in clear text' },
  { id: 'base64', label: 'Base64 (Encoding)', level: 'critical', category: 'obsolete', real: true, warning: 'Base64 is encoding, not encryption' },
  { id: 'aes-128', label: 'AES-128', level: 'recommended', category: 'recommended', real: true },
  { id: 'aes-256', label: 'AES-256', level: 'modern', category: 'modern', real: true },
];

export function getCredentialEncryption(id: string): CredentialEncryptionMeta | undefined {
  return CREDENTIAL_ENCRYPTION_TYPES.find((c) => c.id === id);
}

/* ============================================================
 * HTTPS / CERTIFICATES
 * ========================================================== */

export type CertificateType =
  | 'rsa-1024'
  | 'rsa-2048'
  | 'rsa-4096'
  | 'ecdsa-p256'
  | 'ecdsa-p384'
  | 'ecdsa-p521';

export interface CertificateTypeMeta {
  id: CertificateType;
  label: string;
  algorithm: 'RSA' | 'ECDSA';
  bits: number;
  level: SecurityLevel;
  category: SecurityCategory;
  legacyOnly: boolean;
}

export const CERTIFICATE_TYPES: CertificateTypeMeta[] = [
  { id: 'rsa-1024', label: 'RSA 1024', algorithm: 'RSA', bits: 1024, level: 'weak', category: 'obsolete', legacyOnly: true },
  { id: 'rsa-2048', label: 'RSA 2048', algorithm: 'RSA', bits: 2048, level: 'recommended', category: 'recommended', legacyOnly: false },
  { id: 'rsa-4096', label: 'RSA 4096', algorithm: 'RSA', bits: 4096, level: 'modern', category: 'modern', legacyOnly: false },
  { id: 'ecdsa-p256', label: 'ECDSA P-256', algorithm: 'ECDSA', bits: 256, level: 'recommended', category: 'recommended', legacyOnly: false },
  { id: 'ecdsa-p384', label: 'ECDSA P-384', algorithm: 'ECDSA', bits: 384, level: 'modern', category: 'modern', legacyOnly: false },
  { id: 'ecdsa-p521', label: 'ECDSA P-521', algorithm: 'ECDSA', bits: 521, level: 'modern', category: 'modern', legacyOnly: false },
];

export function getCertificateType(id: string): CertificateTypeMeta | undefined {
  return CERTIFICATE_TYPES.find((c) => c.id === id);
}

/* ============================================================
 * CONFIGURATION BACKUP ENCRYPTION
 * ========================================================== */

export type BackupEncryptionType = 'none' | 'zip-password' | 'aes-128' | 'aes-256';

export interface BackupEncryptionMeta {
  id: BackupEncryptionType;
  label: string;
  level: SecurityLevel;
  category: SecurityCategory;
  real: boolean;
  protection: string;
}

export const BACKUP_ENCRYPTION_TYPES: BackupEncryptionMeta[] = [
  { id: 'none', label: 'No Encryption', level: 'critical', category: 'obsolete', real: true, protection: 'None — readable by anyone' },
  { id: 'zip-password', label: 'ZIP Password', level: 'weak', category: 'legacy', real: false, protection: 'Weak — legacy ZIP cipher' },
  { id: 'aes-128', label: 'AES-128', level: 'recommended', category: 'recommended', real: true, protection: 'Strong symmetric encryption' },
  { id: 'aes-256', label: 'AES-256', level: 'modern', category: 'modern', real: true, protection: 'Maximum symmetric encryption' },
];

export function getBackupEncryption(id: string): BackupEncryptionMeta | undefined {
  return BACKUP_ENCRYPTION_TYPES.find((b) => b.id === id);
}

/* ============================================================
 * DTOs — settings, certificate, scoring, alerts
 * ========================================================== */

export interface CertificateInfoDto {
  type: CertificateType;
  algorithm: string;
  bits: number;
  issuer: string;
  subject: string;
  validFrom: string;
  validTo: string;
  fingerprintSha256: string;
  serialNumber: string;
  expired: boolean;
}

export interface SecuritySettingsDto {
  securityProfile: import('./securityPolicy.js').SecurityProfile;
  forcePasswordChange: boolean;
  passwordHashAlgorithm: PasswordHashAlgorithm;
  credentialEncryptionType: CredentialEncryptionType;
  backupEncryptionType: BackupEncryptionType;
  legacyCompatibility: boolean;
  certificate: CertificateInfoDto;
}

export interface SecuritySettingsInput {
  securityProfile: import('./securityPolicy.js').SecurityProfile;
  forcePasswordChange: boolean;
  passwordHashAlgorithm: PasswordHashAlgorithm;
  credentialEncryptionType: CredentialEncryptionType;
  backupEncryptionType: BackupEncryptionType;
  legacyCompatibility: boolean;
}

export type SecurityAlertSeverity = 'critical' | 'warning' | 'info';

export interface SecurityAlertDto {
  id: string;
  severity: SecurityAlertSeverity;
  title: string;
  detail: string;
  area: 'wifi' | 'password' | 'certificate' | 'credential' | 'backup' | 'system';
}

export interface SecurityScoreDto {
  wifiScore: number;
  passwordScore: number;
  certificateScore: number;
  adminPasswordScore: number;
  tr069Score: number;
  backupScore: number;
  overallScore: number;
  wifiLevel: SecurityLevel;
  passwordLevel: SecurityLevel;
  certificateLevel: SecurityLevel;
  adminPasswordLevel: SecurityLevel;
  tr069Level: SecurityLevel;
  backupLevel: SecurityLevel;
  overallLevel: SecurityLevel;
  alerts: SecurityAlertDto[];
}

export interface HashPreviewDto {
  algorithm: PasswordHashAlgorithm;
  input: string;
  output: string;
  level: SecurityLevel;
  year: number;
}

/** Maps a numeric 0-100 score back to a coarse security level. */
export function scoreToLevel(score: number): SecurityLevel {
  if (score >= 95) return 'modern';
  if (score >= 75) return 'recommended';
  if (score >= 50) return 'legacy';
  if (score >= 25) return 'weak';
  return 'critical';
}
