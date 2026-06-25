import {
  getWifiSecurityMode,
  normalizeWifiSecurityMode,
  evaluatePasswordStrength,
  isCommonPassword,
  type AuditReportDto,
  type AuditCheckDto,
  type AuditStatus,
  type SecurityProfile,
  DEFAULT_ADMIN_PASSWORD,
} from '@aerobrry/shared';
import { prisma } from '../../../infrastructure/database/prisma.js';
import { verifyPassword } from '../../../infrastructure/security/passwordHashing.js';
import type { SecurityService } from '../SecurityService.js';

/**
 * Audits the running configuration against common security weaknesses:
 * weak passwords, WEP, legacy WPA, default admin credentials and ACS without TLS.
 */
export class SecurityAuditService {
  constructor(private readonly securityService: SecurityService) {}

  async generateReport(deviceId: string): Promise<AuditReportDto> {
    const settings = await this.securityService.getSettingsRow(deviceId);
    const wlans = await prisma.wlanConfig.findMany({ where: { deviceId } });
    const session = await prisma.cwmpSession.findUnique({ where: { deviceId } });
    const admin = await prisma.user.findUnique({ where: { username: 'admin' } });

    const checks: AuditCheckDto[] = [];

    // WEP enabled
    const wepBands = wlans.filter((w) => {
      const m = getWifiSecurityMode(normalizeWifiSecurityMode(w.security));
      return m?.id === 'wep-64' || m?.id === 'wep-128';
    });
    checks.push({
      id: 'wep',
      label: 'WEP encryption',
      status: wepBands.length ? 'fail' : 'pass',
      detail: wepBands.length ? `WEP enabled on: ${wepBands.map((w) => `${w.band} GHz`).join(', ')}` : 'No WEP networks detected.',
    });

    // Legacy WPA / TKIP
    const legacyBands = wlans.filter((w) => {
      const m = getWifiSecurityMode(normalizeWifiSecurityMode(w.security));
      return m && (m.id === 'wpa-psk-tkip' || m.level === 'legacy' || m.id === 'open');
    });
    checks.push({
      id: 'wpa-legacy',
      label: 'Legacy WPA / open networks',
      status: legacyBands.length ? 'warn' : 'pass',
      detail: legacyBands.length ? `Legacy modes on: ${legacyBands.map((w) => `${w.band} GHz`).join(', ')}` : 'All Wi-Fi networks use modern encryption.',
    });

    // Weak Wi-Fi password
    const weakWifi = wlans.filter((w) => {
      if (!w.enabled || !w.password) return false;
      return isCommonPassword(w.password) || evaluatePasswordStrength(w.password).score < 40;
    });
    checks.push({
      id: 'wifi-password',
      label: 'Wi-Fi password strength',
      status: weakWifi.length ? 'warn' : 'pass',
      detail: weakWifi.length ? `Weak passphrase on: ${weakWifi.map((w) => `${w.band} GHz`).join(', ')}` : 'Wi-Fi passphrases are sufficiently strong.',
    });

    // Default admin password
    const isDefaultAdmin = admin ? await verifyPassword(DEFAULT_ADMIN_PASSWORD, admin.passwordHash) : false;
    checks.push({
      id: 'admin-default',
      label: 'Default admin credentials',
      status: isDefaultAdmin ? 'fail' : 'pass',
      detail: isDefaultAdmin ? 'The admin account still uses the default password.' : 'Admin password has been changed from default.',
    });

    // ACS without TLS
    const acsUrl = session?.acsUrl ?? '';
    let acsStatus: AuditStatus = 'pass';
    let acsDetail = 'No ACS configured.';
    if (acsUrl) {
      const isHttps = acsUrl.toLowerCase().startsWith('https://');
      acsStatus = isHttps ? 'pass' : 'fail';
      acsDetail = isHttps ? 'ACS communication uses HTTPS/TLS.' : 'ACS communication is not encrypted (HTTP).';
    }
    checks.push({ id: 'acs-tls', label: 'ACS transport security', status: acsStatus, detail: acsDetail });

    // Password hashing
    const weakHash = ['plain', 'md5', 'sha1'].includes(settings.passwordHashAlgorithm);
    checks.push({
      id: 'password-hash',
      label: 'Password storage algorithm',
      status: weakHash ? 'fail' : 'pass',
      detail: weakHash ? `Login passwords are stored using ${settings.passwordHashAlgorithm}.` : `Passwords stored using ${settings.passwordHashAlgorithm}.`,
    });

    const passed = checks.filter((c) => c.status === 'pass').length;
    const warnings = checks.filter((c) => c.status === 'warn').length;
    const failed = checks.filter((c) => c.status === 'fail').length;

    return {
      profile: settings.securityProfile as SecurityProfile,
      generatedAt: new Date().toISOString(),
      passed,
      warnings,
      failed,
      checks,
    };
  }
}
