import { isCommonPassword, COMMON_PASSWORDS, COMMON_PASSWORD_MESSAGE } from '@aerobrry/shared';

/**
 * Validates passwords against a blocklist of commonly used passwords.
 * The list is sourced from the shared catalog and can be expanded centrally.
 */
export class CommonPasswordValidator {
  isBlocked(password: string): boolean {
    return isCommonPassword(password);
  }

  get message(): string {
    return COMMON_PASSWORD_MESSAGE;
  }

  get blocklistSize(): number {
    return COMMON_PASSWORDS.length;
  }
}
