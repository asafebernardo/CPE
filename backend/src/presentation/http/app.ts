import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { PrismaParameterRepository } from '../../infrastructure/database/repositories/PrismaParameterRepository.js';
import { PrismaDeviceRepository } from '../../infrastructure/database/repositories/PrismaDeviceRepository.js';
import { PrismaLogRepository } from '../../infrastructure/database/repositories/PrismaLogRepository.js';
import { PrismaFirewallRepository } from '../../infrastructure/database/repositories/PrismaFirewallRepository.js';
import { ParameterTreeService } from '../../application/services/ParameterTreeService.js';
import { AuthService } from '../../application/services/AuthService.js';
import { LogService } from '../../application/services/LogService.js';
import { DeviceSimulatorService } from '../../application/services/DeviceSimulatorService.js';
import { CpeSimulatorService } from '../../application/services/CpeSimulatorService.js';
import { ConfigBackupService } from '../../application/services/ConfigBackupService.js';
import { CwmpDiagnosticsService } from '../../application/services/CwmpDiagnosticsService.js';
import { CwmpClient } from '../../infrastructure/cwmp/CwmpClient.js';
import { InformScheduler } from '../../infrastructure/cwmp/InformScheduler.js';
import { createAuthMiddleware, errorHandler, eventBus } from './middleware/index.js';
import { createAuthRoutes } from './routes/auth.routes.js';
import { createDashboardRoutes } from './routes/dashboard.routes.js';
import { createWanRoutes } from './routes/wan.routes.js';
import { createLanRoutes } from './routes/lan.routes.js';
import { createWlanRoutes } from './routes/wlan.routes.js';
import { createWirelessRoutes } from './routes/wireless.routes.js';
import { WirelessInterfaceService } from '../../application/services/WirelessInterfaceService.js';
import { createFirewallRoutes } from './routes/firewall.routes.js';
import { createLogsRoutes } from './routes/logs.routes.js';
import { createDiagnosticRoutes } from './routes/diagnostic.routes.js';
import { createManagementRoutes, createAcsRoutes } from './routes/management.routes.js';
import { createConnectionRequestRoutes } from './routes/connectionRequest.routes.js';
import { env } from '../../config/env.js';
import { createHostsRoutes, createWifiAdvancedRoutes, createCpeRoutes } from './routes/cpe.routes.js';
import { createOperationalRoutes } from './routes/operational.routes.js';
import { OperationalDashboardService } from '../../application/services/OperationalDashboardService.js';
import { WanOperationalService } from '../../application/services/WanOperationalService.js';
import { SecurityService } from '../../application/services/SecurityService.js';
import { SecurityProfileService } from '../../application/services/security/SecurityProfileService.js';
import { SecurityAuditService } from '../../application/services/security/SecurityAuditService.js';
import { PasswordPolicyService } from '../../application/services/security/PasswordPolicyService.js';
import { CredentialGeneratorService } from '../../application/services/security/CredentialGeneratorService.js';
import { WifiSecurityValidator } from '../../application/services/security/WifiSecurityValidator.js';
import { DevicePresetService } from '../../application/services/DevicePresetService.js';
import { UserManagementService } from '../../application/services/UserManagementService.js';
import { createSecurityRoutes } from './routes/security.routes.js';

export function createApp() {
  const parameterRepo = new PrismaParameterRepository();
  const deviceRepo = new PrismaDeviceRepository();
  const logRepo = new PrismaLogRepository();
  const firewallRepo = new PrismaFirewallRepository();

  const logService = new LogService(logRepo, eventBus);
  const diagnosticsService = new CwmpDiagnosticsService(logService, eventBus);
  const parameterTree = new ParameterTreeService(parameterRepo, eventBus, diagnosticsService);
  const authService = new AuthService();
  const simulator = new DeviceSimulatorService(deviceRepo);
  const cpeSimulator = new CpeSimulatorService(logService, eventBus);
  const operationalService = new OperationalDashboardService(deviceRepo, parameterTree);
  const wanOperationalService = new WanOperationalService(deviceRepo, logService, eventBus);
  const securityService = new SecurityService(logService);
  const securityProfileService = new SecurityProfileService(securityService, logService);
  const securityAuditService = new SecurityAuditService(securityService);
  const passwordPolicyService = new PasswordPolicyService();
  const credentialGenerator = new CredentialGeneratorService();
  const wifiSecurityValidator = new WifiSecurityValidator();
  const wirelessInterfaceService = new WirelessInterfaceService(deviceRepo, logService);
  const backupService = new ConfigBackupService();
  const userManagementService = new UserManagementService(logService);
  const devicePresetService = new DevicePresetService(deviceRepo, securityService, parameterTree, logService);

  const onReboot = async (deviceId: string) => {
    await deviceRepo.resetMetrics(deviceId);
    await logService.log(deviceId, 'SYSTEM', 'Reboot completed via ACS');
  };

  const onFactoryReset = async (deviceId: string) => {
    await deviceRepo.updateWanConfig(deviceId, {
      connectionType: 'DHCP',
      ipAddress: '192.0.2.10',
      subnetMask: '255.255.255.0',
      gateway: '192.0.2.1',
      dnsPrimary: '8.8.8.8',
      dnsSecondary: '8.8.4.4',
    });
    await parameterTree.syncFromDomainModels(deviceId);
    await deviceRepo.resetMetrics(deviceId);
  };

  const cwmpClient = new CwmpClient(parameterTree, logService, eventBus, onReboot, onFactoryReset, diagnosticsService);
  const informScheduler = new InformScheduler(cwmpClient);

  eventBus.on('cwmp.periodic-inform.changed', (payload: { deviceId: string }) => {
    void informScheduler.restart(payload.deviceId);
  });

  const app = express();
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors());
  app.use(express.json());

  const auth = createAuthMiddleware(authService);

  // Public TR-069 Connection Request endpoint — the ACS reaches this WITHOUT a
  // JWT (it is protected by optional HTTP Digest auth instead).
  app.use(env.connectionRequestPath, createConnectionRequestRoutes(deviceRepo, cwmpClient, logService));

  app.use('/api/auth', createAuthRoutes(authService, logService, deviceRepo, securityService));
  app.use('/api/dashboard', auth, createDashboardRoutes(simulator, deviceRepo));
  app.use('/api/wan', auth, createWanRoutes(deviceRepo, parameterTree, logService, wanOperationalService));
  app.use('/api/lan', auth, createLanRoutes(deviceRepo, parameterTree, logService));
  app.use('/api/wlan', auth, createWlanRoutes(deviceRepo, parameterTree, logService, securityService, wifiSecurityValidator, wirelessInterfaceService));
  app.use('/api/wireless', auth, createWirelessRoutes(deviceRepo, wirelessInterfaceService, securityService, wifiSecurityValidator));
  app.use('/api/firewall', auth, createFirewallRoutes(firewallRepo, deviceRepo, logService));
  app.use('/api/logs', auth, createLogsRoutes(logService, deviceRepo));
  app.use('/api/diagnostic', auth, createDiagnosticRoutes(simulator, cpeSimulator, logService, deviceRepo));
  app.use('/api/management', auth, createManagementRoutes(backupService, deviceRepo, parameterTree, logService, informScheduler, securityService, devicePresetService));
  app.use('/api/acs', auth, createAcsRoutes(deviceRepo, cwmpClient, informScheduler, logService, parameterTree));
  app.use('/api/hosts', auth, createHostsRoutes(cpeSimulator, deviceRepo));
  app.use('/api/wifi', auth, createWifiAdvancedRoutes(cpeSimulator, deviceRepo));
  app.use('/api/cpe', auth, createCpeRoutes(cpeSimulator, deviceRepo));
  app.use('/api/operational', auth, createOperationalRoutes(operationalService, deviceRepo));
  app.use('/api/security', auth, createSecurityRoutes(deviceRepo, securityService, securityProfileService, securityAuditService, passwordPolicyService, userManagementService));

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  app.use(errorHandler);

  return {
    app,
    deviceRepo,
    parameterTree,
    informScheduler,
    cwmpClient,
    simulator,
    cpeSimulator,
    wanOperational: wanOperationalService,
    authService,
    eventBus,
  };
}
