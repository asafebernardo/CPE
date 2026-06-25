import {
  SECURITY_LEVELS,
  getWifiSecurityMode,
  getPasswordHashAlgorithm,
  getCredentialEncryption,
  getCertificateType,
  getBackupEncryption,
  normalizeWifiSecurityMode,
  scoreToLevel,
  type SecuritySettingsDto,
  type SecuritySettingsInput,
  type SecurityScoreDto,
  type SecurityAlertDto,
  type CertificateInfoDto,
  type CertificateType,
  type PasswordHashAlgorithm,
  type SecurityProfile,
  type HashPreviewDto,
  DEFAULT_ADMIN_PASSWORD,
} from '@routergui/shared';
import { prisma } from '../../infrastructure/database/prisma.js';
import { generateCertificate } from '../../infrastructure/security/certificate.js';
import { hashPassword, verifyPassword } from '../../infrastructure/security/passwordHashing.js';
import { CredentialGeneratorService } from './security/CredentialGeneratorService.js';
import type { LogService } from './LogService.js';

type SecurityRow = NonNullable<Awaited<ReturnType<typeof prisma.securitySettings.findUnique>>>;

export class SecurityService {
  private readonly credentialGenerator = new CredentialGeneratorService();

  constructor(private readonly logService?: LogService) {}

  async getSettingsRow(deviceId: string): Promise<SecurityRow> {
    const existing = await prisma.securitySettings.findUnique({ where: { deviceId } });
    if (existing) {
      if (!existing.factorySsid || !existing.factoryWifiPassword) {
        const creds = this.credentialGenerator.generateCredentials();
        return prisma.securitySettings.update({
          where: { deviceId },
          data: { factorySsid: creds.ssid, factoryWifiPassword: creds.password },
        });
      }
      return existing;
    }

    const cert = generateCertificate('rsa-2048');
    const creds = this.credentialGenerator.generateCredentials();
    return prisma.securitySettings.create({
      data: {
        deviceId,
        securityProfile: 'isp-standard',
        forcePasswordChange: false,
        factorySsid: creds.ssid,
        factoryWifiPassword: creds.password,
        passwordHashAlgorithm: 'bcrypt',
        credentialEncryptionType: 'aes-256',
        backupEncryptionType: 'aes-256',
        legacyCompatibility: false,
        certType: cert.type,
        certAlgorithm: cert.algorithm,
        certBits: cert.bits,
        certIssuer: cert.issuer,
        certSubject: cert.subject,
        certSerial: cert.serial,
        certFingerprint: cert.fingerprint,
        certValidFrom: cert.validFrom,
        certValidTo: cert.validTo,
        certPublicKey: cert.publicKey,
      },
    });
  }

  async getSettings(deviceId: string): Promise<SecuritySettingsDto> {
    const row = await this.getSettingsRow(deviceId);
    return this.toDto(row);
  }

  async updateSettings(deviceId: string, input: SecuritySettingsInput): Promise<SecuritySettingsDto> {
    await this.getSettingsRow(deviceId);
    const row = await prisma.securitySettings.update({
      where: { deviceId },
      data: {
        securityProfile: input.securityProfile,
        forcePasswordChange: input.forcePasswordChange,
        passwordHashAlgorithm: input.passwordHashAlgorithm,
        credentialEncryptionType: input.credentialEncryptionType,
        backupEncryptionType: input.backupEncryptionType,
        legacyCompatibility: input.securityProfile === 'legacy' ? true : input.legacyCompatibility,
      },
    });

    if (input.forcePasswordChange) {
      await prisma.user.updateMany({ where: { role: 'ADMIN' }, data: { mustChangePassword: true } });
    }
    if (this.logService) {
      await this.logService.log(deviceId, 'PARAM_CHANGE', 'Security settings updated');
      if (input.legacyCompatibility) {
        await this.logService.log(deviceId, 'SECURITY', 'Legacy compatibility mode ENABLED — insecure');
      }
    }
    return this.toDto(row);
  }

  async generateCertificate(deviceId: string, typeId: CertificateType): Promise<SecuritySettingsDto> {
    const row = await this.getSettingsRow(deviceId);
    const meta = getCertificateType(typeId);
    if (!meta) throw new Error('Unknown certificate type');
    if (meta.legacyOnly && !row.legacyCompatibility) {
      throw new Error(`${meta.label} requires Legacy Compatibility mode to be enabled`);
    }

    const cert = generateCertificate(typeId);
    const updated = await prisma.securitySettings.update({
      where: { deviceId },
      data: {
        certType: cert.type,
        certAlgorithm: cert.algorithm,
        certBits: cert.bits,
        certIssuer: cert.issuer,
        certSubject: cert.subject,
        certSerial: cert.serial,
        certFingerprint: cert.fingerprint,
        certValidFrom: cert.validFrom,
        certValidTo: cert.validTo,
        certPublicKey: cert.publicKey,
      },
    });
    if (this.logService) {
      await this.logService.log(deviceId, 'SECURITY', `Certificate regenerated: ${meta.label}`);
    }
    return this.toDto(updated);
  }

  async hashPreview(algo: PasswordHashAlgorithm, input: string): Promise<HashPreviewDto> {
    const meta = getPasswordHashAlgorithm(algo);
    const output = await hashPassword(algo, input || 'demo-password');
    return {
      algorithm: algo,
      input: input || 'demo-password',
      output,
      level: meta?.level ?? 'critical',
      year: meta?.year ?? 0,
    };
  }

  async computeScore(deviceId: string): Promise<SecurityScoreDto> {
    const row = await this.getSettingsRow(deviceId);
    const wlans = await prisma.wlanConfig.findMany({ where: { deviceId } });
    const session = await prisma.cwmpSession.findUnique({ where: { deviceId } });
    const admin = await prisma.user.findUnique({ where: { username: 'admin' } });
    const alerts: SecurityAlertDto[] = [];

    // ---- Wi-Fi score ----
    const enabled = wlans.filter((w) => w.enabled);
    const wifiScores: number[] = [];
    for (const w of enabled) {
      const modeId = normalizeWifiSecurityMode(w.security);
      const mode = getWifiSecurityMode(modeId)!;
      wifiScores.push(SECURITY_LEVELS[mode.level].score);
      if (mode.id === 'open') {
        alerts.push({ id: `wifi-open-${w.band}`, severity: 'critical', area: 'wifi', title: 'Open Wi-Fi detected', detail: `${w.band} GHz network "${w.ssid}" has no encryption.` });
      } else if (mode.id === 'wep-64' || mode.id === 'wep-128') {
        alerts.push({ id: `wifi-wep-${w.band}`, severity: 'critical', area: 'wifi', title: 'WEP detected', detail: `${w.band} GHz network "${w.ssid}" uses WEP, which is trivially broken.` });
      } else if (mode.encryption.includes('TKIP') && mode.level === 'weak') {
        alerts.push({ id: `wifi-tkip-${w.band}`, severity: 'warning', area: 'wifi', title: 'WPA-TKIP in use', detail: `${w.band} GHz network "${w.ssid}" uses legacy TKIP encryption.` });
      }
    }
    const wifiScore = wifiScores.length ? Math.round(wifiScores.reduce((a, b) => a + b, 0) / wifiScores.length) : 100;

    // ---- Password storage score ----
    const algoMeta = getPasswordHashAlgorithm(row.passwordHashAlgorithm);
    const passwordScore = algoMeta ? SECURITY_LEVELS[algoMeta.level].score : 10;
    if (algoMeta && (algoMeta.id === 'plain' || algoMeta.id === 'md5')) {
      alerts.push({ id: 'pw-obsolete', severity: 'critical', area: 'password', title: 'Obsolete password hashing', detail: `Web login passwords are stored using ${algoMeta.label}.` });
    } else if (algoMeta && algoMeta.id === 'sha1') {
      alerts.push({ id: 'pw-weak', severity: 'warning', area: 'password', title: 'Weak password hashing', detail: 'SHA-1 is deprecated for password storage.' });
    }

    // ---- Admin password ----
    const isDefaultAdmin = admin ? await verifyPassword(DEFAULT_ADMIN_PASSWORD, admin.passwordHash) : false;
    let adminPasswordScore = 90;
    if (isDefaultAdmin) {
      adminPasswordScore = 10;
      alerts.push({ id: 'admin-default', severity: 'critical', area: 'system', title: 'Default admin password', detail: 'The admin account still uses the factory default password.' });
    } else if (admin?.mustChangePassword) {
      adminPasswordScore = 40;
      alerts.push({ id: 'admin-change', severity: 'warning', area: 'system', title: 'Admin password change pending', detail: 'A password change is required on next login.' });
    }

    // ---- TR-069 security ----
    const credMeta = getCredentialEncryption(row.credentialEncryptionType);
    const acsUrl = session?.acsUrl ?? '';
    const acsHttps = acsUrl.toLowerCase().startsWith('https://');
    let tr069Score = 100;
    if (credMeta && (credMeta.id === 'plain' || credMeta.id === 'base64')) {
      tr069Score -= 40;
      alerts.push({ id: 'cred-weak', severity: 'warning', area: 'credential', title: 'ACS credentials not encrypted', detail: credMeta.warning ?? 'Credentials are not protected.' });
    }
    if (acsUrl && !acsHttps) {
      tr069Score -= 40;
      alerts.push({ id: 'acs-http', severity: 'warning', area: 'credential', title: 'ACS communication is not encrypted', detail: 'The ACS URL uses HTTP. Use HTTPS to protect TR-069 traffic.' });
    }
    tr069Score = Math.max(0, tr069Score);

    // ---- Backup ----
    const backupMeta = getBackupEncryption(row.backupEncryptionType);
    const backupScore = backupMeta ? SECURITY_LEVELS[backupMeta.level].score : 35;
    if (backupMeta && backupMeta.id === 'none') {
      alerts.push({ id: 'backup-none', severity: 'info', area: 'backup', title: 'Unencrypted backups', detail: 'Configuration backups are exported without encryption.' });
    }

    // ---- Certificate score ----
    const certMeta = getCertificateType(row.certType as CertificateType);
    const expired = row.certValidTo.getTime() < Date.now();
    let certificateScore = certMeta ? SECURITY_LEVELS[certMeta.level].score : 35;
    if (expired) {
      certificateScore = 20;
      alerts.push({ id: 'cert-expired', severity: 'critical', area: 'certificate', title: 'Expired certificate', detail: `The HTTPS certificate expired on ${row.certValidTo.toISOString().slice(0, 10)}.` });
    } else if (certMeta && certMeta.id === 'rsa-1024') {
      alerts.push({ id: 'cert-weak', severity: 'warning', area: 'certificate', title: 'Weak certificate key', detail: 'RSA-1024 is below current minimum key strength.' });
    }

    // ---- Legacy mode banner ----
    if (row.legacyCompatibility) {
      alerts.push({ id: 'legacy-mode', severity: 'warning', area: 'system', title: 'Legacy compatibility enabled', detail: 'Insecure legacy algorithms are permitted. Use only for testing.' });
    }

    const overallScore = Math.round(
      (wifiScore + passwordScore + certificateScore + adminPasswordScore + tr069Score + backupScore) / 6,
    );

    return {
      wifiScore,
      passwordScore,
      certificateScore,
      adminPasswordScore,
      tr069Score,
      backupScore,
      overallScore,
      wifiLevel: scoreToLevel(wifiScore),
      passwordLevel: scoreToLevel(passwordScore),
      certificateLevel: scoreToLevel(certificateScore),
      adminPasswordLevel: scoreToLevel(adminPasswordScore),
      tr069Level: scoreToLevel(tr069Score),
      backupLevel: scoreToLevel(backupScore),
      overallLevel: scoreToLevel(overallScore),
      alerts: alerts.sort((a, b) => severityRank(b.severity) - severityRank(a.severity)),
    };
  }

  private toDto(row: SecurityRow): SecuritySettingsDto {
    const certificate: CertificateInfoDto = {
      type: row.certType as CertificateType,
      algorithm: row.certAlgorithm,
      bits: row.certBits,
      issuer: row.certIssuer,
      subject: row.certSubject,
      validFrom: row.certValidFrom.toISOString(),
      validTo: row.certValidTo.toISOString(),
      fingerprintSha256: row.certFingerprint,
      serialNumber: row.certSerial,
      expired: row.certValidTo.getTime() < Date.now(),
    };
    return {
      securityProfile: row.securityProfile as SecurityProfile,
      forcePasswordChange: row.forcePasswordChange,
      passwordHashAlgorithm: row.passwordHashAlgorithm as SecuritySettingsDto['passwordHashAlgorithm'],
      credentialEncryptionType: row.credentialEncryptionType as SecuritySettingsDto['credentialEncryptionType'],
      backupEncryptionType: row.backupEncryptionType as SecuritySettingsDto['backupEncryptionType'],
      legacyCompatibility: row.legacyCompatibility,
      certificate,
    };
  }
}

function severityRank(s: SecurityAlertDto['severity']): number {
  return s === 'critical' ? 3 : s === 'warning' ? 2 : 1;
}
