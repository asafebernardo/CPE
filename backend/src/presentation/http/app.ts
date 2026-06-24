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
import { CwmpClient } from '../../infrastructure/cwmp/CwmpClient.js';
import { InformScheduler } from '../../infrastructure/cwmp/InformScheduler.js';
import { createAuthMiddleware, errorHandler, eventBus } from './middleware/index.js';
import { createAuthRoutes } from './routes/auth.routes.js';
import { createDashboardRoutes } from './routes/dashboard.routes.js';
import { createWanRoutes } from './routes/wan.routes.js';
import { createLanRoutes } from './routes/lan.routes.js';
import { createWlanRoutes } from './routes/wlan.routes.js';
import { createFirewallRoutes } from './routes/firewall.routes.js';
import { createLogsRoutes } from './routes/logs.routes.js';
import { createDiagnosticRoutes } from './routes/diagnostic.routes.js';
import { createManagementRoutes, createAcsRoutes } from './routes/management.routes.js';
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
import { createSecurityRoutes } from './routes/security.routes.js';

export function createApp() {
  const parameterRepo = new PrismaParameterRepository();
  const deviceRepo = new PrismaDeviceRepository();
  const logRepo = new PrismaLogRepository();
  const firewallRepo = new PrismaFirewallRepository();

  const parameterTree = new ParameterTreeService(parameterRepo, eventBus);
  const authService = new AuthService();
  const logService = new LogService(logRepo, eventBus);
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
  const backupService = new ConfigBackupService();

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

  const cwmpClient = new CwmpClient(parameterTree, logService, eventBus, onReboot, onFactoryReset);
  const informScheduler = new InformScheduler(cwmpClient);

  const app = express();
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors());
  app.use(express.json());

  const auth = createAuthMiddleware(authService);

  app.use('/api/auth', createAuthRoutes(authService, logService, deviceRepo, securityService));
  app.use('/api/dashboard', auth, createDashboardRoutes(simulator, deviceRepo));
  app.use('/api/wan', auth, createWanRoutes(deviceRepo, parameterTree, logService, wanOperationalService));
  app.use('/api/lan', auth, createLanRoutes(deviceRepo, parameterTree, logService));
  app.use('/api/wlan', auth, createWlanRoutes(deviceRepo, parameterTree, logService, securityService, wifiSecurityValidator));
  app.use('/api/firewall', auth, createFirewallRoutes(firewallRepo, deviceRepo, logService));
  app.use('/api/logs', auth, createLogsRoutes(logService, deviceRepo));
  app.use('/api/diagnostic', auth, createDiagnosticRoutes(simulator, cpeSimulator, logService, deviceRepo));
  app.use('/api/management', auth, createManagementRoutes(backupService, deviceRepo, parameterTree, logService, informScheduler, securityService));
  app.use('/api/acs', auth, createAcsRoutes(deviceRepo, cwmpClient, informScheduler, logService));
  app.use('/api/hosts', auth, createHostsRoutes(cpeSimulator, deviceRepo));
  app.use('/api/wifi', auth, createWifiAdvancedRoutes(cpeSimulator, deviceRepo));
  app.use('/api/cpe', auth, createCpeRoutes(cpeSimulator, deviceRepo));
  app.use('/api/operational', auth, createOperationalRoutes(operationalService, deviceRepo));
  app.use('/api/security', auth, createSecurityRoutes(deviceRepo, securityService, securityProfileService, securityAuditService, passwordPolicyService));

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
