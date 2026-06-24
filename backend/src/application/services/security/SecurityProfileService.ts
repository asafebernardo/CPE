import type { SecurityProfile } from '@routergui/shared';
import { prisma } from '../../../infrastructure/database/prisma.js';
import type { SecurityService } from '../SecurityService.js';
import type { LogService } from '../LogService.js';

/**
 * Manages the global security compliance profile (Legacy / ISP Standard /
 * ANATEL Compliance). Switching the profile updates derived flags so the rest
 * of the system (Wi-Fi gating, certificate gating) stays consistent.
 */
export class SecurityProfileService {
  constructor(
    private readonly securityService: SecurityService,
    private readonly logService?: LogService,
  ) {}

  async getProfile(deviceId: string): Promise<SecurityProfile> {
    const row = await this.securityService.getSettingsRow(deviceId);
    return row.securityProfile as SecurityProfile;
  }

  async setProfile(deviceId: string, profile: SecurityProfile): Promise<void> {
    await this.securityService.getSettingsRow(deviceId);
    await prisma.securitySettings.update({
      where: { deviceId },
      data: {
        securityProfile: profile,
        legacyCompatibility: profile === 'legacy',
      },
    });
    if (this.logService) {
      await this.logService.log(deviceId, 'SECURITY', `Security profile changed to ${profile}`);
    }
  }
}
