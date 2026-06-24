import { createServer } from 'http';
import { createApp } from './presentation/http/app.js';
import { WebSocketHub } from './infrastructure/websocket/WebSocketHub.js';
import { env } from './config/env.js';

async function bootstrap() {
  const { app, deviceRepo, parameterTree, informScheduler, cwmpClient, simulator, cpeSimulator, wanOperational, authService, eventBus } = createApp();

  const device = await deviceRepo.findDefault();
  if (device) {
    await parameterTree.load(device.id);
    await cpeSimulator.seedCpeData(device.id);
    await informScheduler.start(device.id);

    // Announce the device to the ACS on startup (sends "1 BOOT", plus
    // "0 BOOTSTRAP" automatically on first ever contact). Non-blocking.
    const { prisma } = await import('./infrastructure/database/prisma.js');
    const session = await prisma.cwmpSession.findUnique({ where: { deviceId: device.id } });
    if (session?.acsUrl) {
      cwmpClient
        .runSession(device.id, [{ eventCode: '1 BOOT' }])
        .catch((err: unknown) => console.error('Boot Inform failed:', err instanceof Error ? err.message : err));
    }
  }

  const server = createServer(app);

  const wsHub = new WebSocketHub(
    authService,
    simulator,
    cpeSimulator,
    wanOperational,
    eventBus,
    async () => {
      const d = await deviceRepo.findDefault();
      return d?.id ?? null;
    },
  );
  wsHub.attach(server);

  server.listen(env.port, () => {
    console.log(`RouterGui Virtual CPE backend running on http://localhost:${env.port}`);
    console.log(`WebSocket available at ws://localhost:${env.port}/ws`);
  });
}

bootstrap().catch(console.error);
