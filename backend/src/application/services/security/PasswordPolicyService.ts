import {
  validateAdminPasswordPolicy,
  validateWifiPasswordPolicy,
  evaluatePasswordStrength,
  type PolicyValidation,
  type PasswordStrengthResult,
} from '@aerobrry/shared';

/**
 * Central password policy engine for admin and Wi-Fi credentials.
 * Pure rules live in the shared catalog so the frontend mirrors them exactly.
 */
export class PasswordPolicyService {
  validateAdmin(profileId: string, password: string): PolicyValidation {
    return validateAdminPasswordPolicy(profileId, password);
  }

  validateWifi(profileId: string, password: string): PolicyValidation {
    return validateWifiPasswordPolicy(profileId, password);
  }

  strength(password: string): PasswordStrengthResult {
    return evaluatePasswordStrength(password);
  }
}
