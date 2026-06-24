import { randomInt } from 'crypto';

const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const LOWER = 'abcdefghijkmnpqrstuvwxyz';
const DIGIT = '23456789';
const SPECIAL = '!@#$%&*?';
const HEX = 'ABCDEF0123456789';

function pick(set: string): string {
  return set[randomInt(set.length)];
}

function shuffle(chars: string[]): string {
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

/**
 * Generates unique, strong default Wi-Fi credentials for a device.
 * SSID format: RouterGui-RGX5000-XXXX (random hex suffix).
 * Password: 12–16 chars with upper, lower, digit and special, never fixed.
 */
export class CredentialGeneratorService {
  generateSsid(modelTag = 'RGX5000'): string {
    const suffix = Array.from({ length: 4 }, () => pick(HEX)).join('');
    return `RouterGui-${modelTag}-${suffix}`;
  }

  generateWifiPassword(): string {
    const length = randomInt(12, 17); // 12..16
    const required = [pick(UPPER), pick(LOWER), pick(DIGIT), pick(SPECIAL)];
    const all = UPPER + LOWER + DIGIT + SPECIAL;
    const rest = Array.from({ length: length - required.length }, () => pick(all));
    return shuffle([...required, ...rest]);
  }

  generateCredentials(modelTag = 'RGX5000') {
    return { ssid: this.generateSsid(modelTag), password: this.generateWifiPassword() };
  }
}
