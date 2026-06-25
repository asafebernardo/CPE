import type { CwmpClient } from './CwmpClient.js';
import { prisma } from '../database/prisma.js';
import { clampPeriodicInformInterval } from '@aerobrry/shared';

export class InformScheduler {
  private timers: Map<string, ReturnType<typeof setInterval>> = new Map();

  constructor(private readonly cwmpClient: CwmpClient) {}

  async start(deviceId: string) {
    this.stop(deviceId);
    const session = await prisma.cwmpSession.findUnique({ where: { deviceId } });
    if (!session?.periodicInformEnabled || !session.acsUrl) return;

    const intervalMs = clampPeriodicInformInterval(session.periodicInformInterval) * 1000;
    const timer = setInterval(async () => {
      try {
        await this.cwmpClient.runSession(deviceId, [{ eventCode: '2 PERIODIC' }]);
      } catch (err) {
        console.error('Periodic Inform failed:', err);
      }
    }, intervalMs);

    this.timers.set(deviceId, timer);
  }

  stop(deviceId: string) {
    const timer = this.timers.get(deviceId);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(deviceId);
    }
  }

  async restart(deviceId: string) {
    await this.start(deviceId);
  }
}
