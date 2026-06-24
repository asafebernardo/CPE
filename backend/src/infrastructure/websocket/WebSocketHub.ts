import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import type { EventEmitter } from 'events';
import type { AuthService } from '../../application/services/AuthService.js';
import type { DeviceSimulatorService } from '../../application/services/DeviceSimulatorService.js';

import type { CpeSimulatorService } from '../../application/services/CpeSimulatorService.js';
import type { WanOperationalService } from '../../application/services/WanOperationalService.js';

export class WebSocketHub {
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();
  private metricsInterval: ReturnType<typeof setInterval> | null = null;
  private hostsInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly authService: AuthService,
    private readonly simulator: DeviceSimulatorService,
    private readonly cpeSimulator: CpeSimulatorService,
    private readonly wanOperational: WanOperationalService,
    private readonly eventBus: EventEmitter,
    private readonly getDefaultDeviceId: () => Promise<string | null>,
  ) {}

  attach(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', async (ws, req) => {
      const url = new URL(req.url ?? '', 'http://localhost');
      const token = url.searchParams.get('token');
      if (!token || !this.authService.verifyToken(token)) {
        ws.close(4001, 'Unauthorized');
        return;
      }

      this.clients.add(ws);
      ws.on('close', () => this.clients.delete(ws));

      ws.send(JSON.stringify({ type: 'connected', payload: {}, timestamp: new Date().toISOString() }));
    });

    this.eventBus.on('log.new', (payload) => this.broadcast('log.new', payload));
    this.eventBus.on('cwmp.session.started', (payload) => this.broadcast('cwmp.session.started', payload));
    this.eventBus.on('cwmp.session.completed', (payload) => this.broadcast('cwmp.session.completed', payload));
    this.eventBus.on('cwmp.command', (payload) => this.broadcast('cwmp.command.received', payload));
    this.eventBus.on('device.reboot', (payload) => this.broadcast('device.reboot', payload));
    this.eventBus.on('device.factory-reset', (payload) => this.broadcast('device.factory-reset', payload));
    this.eventBus.on('hosts.updated', (payload) => this.broadcast('hosts.updated', payload));
    this.eventBus.on('neighbors.scanned', (payload) => this.broadcast('neighbors.scanned', payload));
    this.eventBus.on('bandsteering.changed', (payload) => this.broadcast('bandsteering.changed', payload));
    this.eventBus.on('speedtest.completed', (payload) => this.broadcast('speedtest.completed', payload));
    this.eventBus.on('firmware.upgrade.progress', (payload) => this.broadcast('firmware.upgrade.progress', payload));
    this.eventBus.on('wan.stats', (payload) => this.broadcast('wan.stats', payload));

    this.startMetricsTicker();
    this.startHostsTicker();
    this.startWanTicker();
  }

  private startWanTicker() {
    setInterval(async () => {
      const deviceId = await this.getDefaultDeviceId();
      if (!deviceId) return;
      await this.wanOperational.tickStats(deviceId);
    }, 5000);
  }

  private startHostsTicker() {
    this.hostsInterval = setInterval(async () => {
      const deviceId = await this.getDefaultDeviceId();
      if (!deviceId) return;
      await this.cpeSimulator.tickHosts(deviceId);
      await this.cpeSimulator.tickOptical(deviceId);
    }, 15000);
  }

  private startMetricsTicker() {
    this.metricsInterval = setInterval(async () => {
      const deviceId = await this.getDefaultDeviceId();
      if (!deviceId) return;
      const metrics = await this.simulator.tickMetrics(deviceId);
      this.broadcast('dashboard.metrics', metrics);
    }, 5000);
  }

  private broadcast(type: string, payload: unknown) {
    const message = JSON.stringify({ type, payload, timestamp: new Date().toISOString() });
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  }

  destroy() {
    if (this.metricsInterval) clearInterval(this.metricsInterval);
    if (this.hostsInterval) clearInterval(this.hostsInterval);
    if (this.wss) this.wss.close();
  }
}
