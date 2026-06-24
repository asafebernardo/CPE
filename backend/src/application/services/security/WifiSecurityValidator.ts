import {
  getWifiSecurityMode,
  isWifiModeAllowed,
  validateWifiPassword,
  validateWifiPasswordPolicy,
  getSecurityProfile,
  type WifiSecurityMode,
} from '@routergui/shared';

export interface WifiValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Enforces Wi-Fi security rules for the active compliance profile:
 * - mode allowlist (ANATEL blocks WEP/TKIP, ISP blocks Open/WEP)
 * - key length rules per mode
 * - profile password policy (complexity + blocklist)
 */
export class WifiSecurityValidator {
  validate(profileId: string, modeId: string, password: string, enabled: boolean): WifiValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const mode = getWifiSecurityMode(modeId);
    if (!mode) {
      return { valid: false, errors: [`Unknown Wi-Fi security mode: ${modeId}`], warnings };
    }

    const profile = getSecurityProfile(profileId);
    if (!isWifiModeAllowed(profileId, modeId as WifiSecurityMode)) {
      errors.push(`${mode.label} is not permitted under the ${profile.label} profile.`);
    }

    if (mode.level === 'critical' || mode.level === 'weak') {
      warnings.push('This configuration does not meet modern security recommendations.');
    }

    if (enabled) {
      const lengthCheck = validateWifiPassword(modeId, password);
      if (!lengthCheck.valid) errors.push(lengthCheck.message);

      const requiresKey = !['none', 'enterprise'].includes(mode.keyRule);
      if (requiresKey) {
        const policy = validateWifiPasswordPolicy(profileId, password);
        errors.push(...policy.errors);
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }
}
