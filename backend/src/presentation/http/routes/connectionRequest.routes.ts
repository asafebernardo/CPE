import { Router, type Request, type Response } from 'express';
import type { PrismaDeviceRepository } from '../../../infrastructure/database/repositories/PrismaDeviceRepository.js';
import type { CwmpClient } from '../../../infrastructure/cwmp/CwmpClient.js';
import type { LogService } from '../../../application/services/LogService.js';
import { prisma } from '../../../infrastructure/database/prisma.js';
import { buildDigestChallengeHeader, verifyDigestAuthorization } from '../../../infrastructure/cwmp/soap/digestAuth.js';
import { env } from '../../../config/env.js';

/**
 * Public (no-JWT) TR-069 Connection Request endpoint.
 *
 * The ACS (e.g. IXC) calls this URL to ask the CPE to open a session "now".
 * Per TR-069 the CPE answers 200 (optionally after an HTTP Digest challenge)
 * and then starts a new Inform session carrying the "6 CONNECTION REQUEST"
 * event. This route must be reachable from the ACS — expose it via your
 * tunnel/public host and set PUBLIC_BASE_URL accordingly.
 */
export function createConnectionRequestRoutes(
  deviceRepo: PrismaDeviceRepository,
  cwmpClient: CwmpClient,
  logService: LogService,
) {
  const router = Router();

  async function handle(req: Request, res: Response) {
    // Optional HTTP Digest auth, enabled when credentials are configured.
    if (env.connectionRequestUsername) {
      const authHeader = req.headers.authorization ?? '';
      const ok =
        authHeader &&
        verifyDigestAuthorization(
          authHeader,
          env.connectionRequestUsername,
          env.connectionRequestPassword,
          req.method,
        );
      if (!ok) {
        const { header } = buildDigestChallengeHeader();
        res.setHeader('WWW-Authenticate', header);
        res.status(401).end();
        return;
      }
    }

    const device = await deviceRepo.findDefault();
    if (!device) {
      res.status(404).end();
      return;
    }

    const session = await prisma.cwmpSession.findUnique({ where: { deviceId: device.id } });
    if (!session?.acsUrl) {
      // No ACS configured — nothing to inform to.
      res.status(503).end();
      return;
    }

    // If a session is already running, acknowledge without starting a new one.
    if (session.sessionState === 'active') {
      res.status(200).end();
      return;
    }

    await logService.log(device.id, 'INFORM', 'Connection Request received from ACS');

    // TR-069: respond 200 immediately, then open the session asynchronously.
    res.status(200).end();

    cwmpClient
      .runSession(device.id, [{ eventCode: '6 CONNECTION REQUEST' }])
      .catch((err: unknown) =>
        console.error('Connection Request session failed:', err instanceof Error ? err.message : err),
      );
  }

  router.get('/', handle);
  router.post('/', handle);

  return router;
}
