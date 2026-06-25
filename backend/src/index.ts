import { createServer } from 'http';
import { createApp } from './presentation/http/app.js';
import { WebSocketHub } from './infrastructure/websocket/WebSocketHub.js';
import { env } from './config/env.js';
import { getConnectionRequestInfo } from './config/connectionRequest.js';
import { DEFAULT_ADMIN_PASSWORD, DEFAULT_ADMIN_USERNAME } from '@routergui/shared';
import { syncWebAdminCredentials } from './infrastructure/adapters/webManagementTr098Mapper.js';

async function bootstrap() {
  const { app, deviceRepo, parameterTree, informScheduler, cwmpClient, simulator, cpeSimulator, wanOperational, authService, eventBus } = createApp();

  const device = await deviceRepo.findDefault();
  if (device) {
    const { prisma } = await import('./infrastructure/database/prisma.js');
    await prisma.webManagementConfig.upsert({
      where: { deviceId: device.id },
      create: {
        deviceId: device.id,
        adminUsername: DEFAULT_ADMIN_USERNAME,
        adminPassword: DEFAULT_ADMIN_PASSWORD,
      },
      update: {},
    });
    await syncWebAdminCredentials(device.id);
    await prisma.ntpConfig.upsert({
      where: { deviceId: device.id },
      create: { deviceId: device.id },
      update: {},
    });

    await parameterTree.syncFromDomainModels(device.id);
    await parameterTree.load(device.id);
    await cpeSimulator.seedCpeData(device.id);

    const cr = getConnectionRequestInfo();
    const session = await prisma.cwmpSession.findUnique({ where: { deviceId: device.id } });
    if (session?.acsUrl && cr.blocked) {
      console.warn(
        `[TR-069] Connection Request URL is not reachable by the ACS: ${cr.url}\n` +
        `         ${cr.warning}\n` +
        `         Example: PUBLIC_BASE_URL=https://your-tunnel.example.com in backend/.env`,
      );
    }

    await informScheduler.start(device.id);
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
    const cr = getConnectionRequestInfo();
    console.log(`RouterGui Virtual CPE backend running on http://localhost:${env.port}`);
    console.log(`TR-069 Connection Request URL: ${cr.url}`);
    console.log(`WebSocket available at ws://localhost:${env.port}/ws`);
  });
}

bootstrap().catch(console.error);
