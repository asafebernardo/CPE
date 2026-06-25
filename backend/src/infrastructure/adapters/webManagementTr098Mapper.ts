import {
  TR098_X_ROUTERGUI,
  DEFAULT_ADMIN_PASSWORD,
  DEFAULT_ADMIN_USERNAME,
  type CwmpParameterValue,
  type PasswordHashAlgorithm,
} from '@routergui/shared';
import { prisma } from '../../infrastructure/database/prisma.js';
import { hashPassword } from '../../infrastructure/security/passwordHashing.js';

export interface WebManagementTr098Source {
  enabled: boolean;
  remoteAccess: boolean;
  remotePort: number;
  localPort: number;
  httpsEnabled: boolean;
  httpsPort: number;
  adminUsername: string;
  adminPassword: string;
  adminEnabled: boolean;
  downloadBandwidthMbps: number;
  uploadBandwidthMbps: number;
}

function resolveAdminPassword(stored?: string | null): string {
  const trimmed = stored?.trim();
  return trimmed ? trimmed : DEFAULT_ADMIN_PASSWORD;
}

export function buildWebManagementTr098Parameters(source: WebManagementTr098Source): CwmpParameterValue[] {
  return [
    { name: TR098_X_ROUTERGUI.WEB_MANAGEMENT_ENABLED, value: String(source.enabled) },
    { name: TR098_X_ROUTERGUI.REMOTE_ACCESS_ENABLED, value: String(source.remoteAccess) },
    { name: TR098_X_ROUTERGUI.REMOTE_ACCESS_PORT, value: String(source.remotePort) },
    { name: TR098_X_ROUTERGUI.WEB_LOCAL_PORT, value: String(source.localPort) },
    { name: TR098_X_ROUTERGUI.WEB_HTTPS_ENABLED, value: String(source.httpsEnabled) },
    { name: TR098_X_ROUTERGUI.WEB_HTTPS_PORT, value: String(source.httpsPort) },
    { name: TR098_X_ROUTERGUI.WEB_ADMIN_USERNAME, value: source.adminUsername },
    { name: TR098_X_ROUTERGUI.WEB_ADMIN_PASSWORD, value: source.adminPassword },
    { name: TR098_X_ROUTERGUI.WEB_ADMIN_ENABLED, value: String(source.adminEnabled) },
    { name: TR098_X_ROUTERGUI.WAN_DOWNLOAD_BANDWIDTH_MBPS, value: String(source.downloadBandwidthMbps) },
    { name: TR098_X_ROUTERGUI.WAN_UPLOAD_BANDWIDTH_MBPS, value: String(source.uploadBandwidthMbps) },
  ];
}

function parseBool(value: string): boolean {
  return value === 'true' || value === '1';
}

/** Keeps GUI login credentials aligned with TR-098 web-management parameters. */
export async function syncWebAdminCredentials(deviceId: string): Promise<void> {
  const [web, adminUser, settings] = await Promise.all([
    prisma.webManagementConfig.findUnique({ where: { deviceId } }),
    prisma.user.findFirst({ where: { role: 'ADMIN' }, orderBy: { createdAt: 'asc' } }),
    prisma.securitySettings.findUnique({ where: { deviceId } }),
  ]);
  if (!adminUser) return;

  const username = (web?.adminUsername?.trim() || adminUser.username || DEFAULT_ADMIN_USERNAME).trim();
  const password = resolveAdminPassword(web?.adminPassword);
  const algorithm = (settings?.passwordHashAlgorithm ?? 'bcrypt') as PasswordHashAlgorithm;
  const passwordHash = await hashPassword(algorithm, password);

  if (web && (!web.adminPassword?.trim() || web.adminUsername !== username)) {
    await prisma.webManagementConfig.update({
      where: { deviceId },
      data: {
        adminUsername: username,
        adminPassword: password,
      },
    });
  }

  await prisma.user.update({
    where: { id: adminUser.id },
    data: { username, passwordHash },
  });
}

export async function loadWebManagementTr098Source(deviceId: string): Promise<WebManagementTr098Source> {
  const [web, adminUser, wan] = await Promise.all([
    prisma.webManagementConfig.findUnique({ where: { deviceId } }),
    prisma.user.findFirst({ where: { role: 'ADMIN' }, orderBy: { createdAt: 'asc' } }),
    prisma.wanConfig.findUnique({ where: { deviceId } }),
  ]);

  const adminUsername = web?.adminUsername?.trim() || adminUser?.username || DEFAULT_ADMIN_USERNAME;
  const adminPassword = resolveAdminPassword(web?.adminPassword);

  return {
    enabled: web?.enabled ?? true,
    remoteAccess: web?.remoteAccess ?? false,
    remotePort: web?.remotePort ?? 8080,
    localPort: web?.localPort ?? 80,
    httpsEnabled: web?.httpsEnabled ?? false,
    httpsPort: web?.httpsPort ?? 443,
    adminUsername,
    adminPassword,
    adminEnabled: adminUser?.enabled ?? true,
    downloadBandwidthMbps: wan?.downloadBandwidthMbps ?? 500,
    uploadBandwidthMbps: wan?.uploadBandwidthMbps ?? 250,
  };
}

export async function applyWebManagementTr098Parameter(
  deviceId: string,
  path: string,
  value: string,
): Promise<boolean> {
  if (path === TR098_X_ROUTERGUI.WAN_DOWNLOAD_BANDWIDTH_MBPS) {
    await prisma.wanConfig.upsert({
      where: { deviceId },
      create: { deviceId, downloadBandwidthMbps: parseInt(value, 10) || 500 },
      update: { downloadBandwidthMbps: parseInt(value, 10) || 500 },
    });
    return true;
  }
  if (path === TR098_X_ROUTERGUI.WAN_UPLOAD_BANDWIDTH_MBPS) {
    await prisma.wanConfig.upsert({
      where: { deviceId },
      create: { deviceId, uploadBandwidthMbps: parseInt(value, 10) || 250 },
      update: { uploadBandwidthMbps: parseInt(value, 10) || 250 },
    });
    return true;
  }

  const webFields: Record<string, (v: string) => Record<string, unknown>> = {
    [TR098_X_ROUTERGUI.WEB_MANAGEMENT_ENABLED]: (v) => ({ enabled: parseBool(v) }),
    [TR098_X_ROUTERGUI.REMOTE_ACCESS_ENABLED]: (v) => ({ remoteAccess: parseBool(v) }),
    [TR098_X_ROUTERGUI.REMOTE_ACCESS_PORT]: (v) => ({ remotePort: parseInt(v, 10) || 8080 }),
    [TR098_X_ROUTERGUI.WEB_LOCAL_PORT]: (v) => ({ localPort: parseInt(v, 10) || 80 }),
    [TR098_X_ROUTERGUI.WEB_HTTPS_ENABLED]: (v) => ({ httpsEnabled: parseBool(v) }),
    [TR098_X_ROUTERGUI.WEB_HTTPS_PORT]: (v) => ({ httpsPort: parseInt(v, 10) || 443 }),
    [TR098_X_ROUTERGUI.WEB_ADMIN_USERNAME]: (v) => ({ adminUsername: v.trim() || DEFAULT_ADMIN_USERNAME }),
    [TR098_X_ROUTERGUI.WEB_ADMIN_PASSWORD]: (v) => ({ adminPassword: resolveAdminPassword(v) }),
  };

  const webMapper = webFields[path];
  if (webMapper) {
    await prisma.webManagementConfig.upsert({
      where: { deviceId },
      create: { deviceId, ...webMapper(value) },
      update: webMapper(value),
    });
    if (
      path === TR098_X_ROUTERGUI.WEB_ADMIN_PASSWORD ||
      path === TR098_X_ROUTERGUI.WEB_ADMIN_USERNAME
    ) {
      await syncWebAdminCredentials(deviceId);
    }
    return true;
  }

  if (path === TR098_X_ROUTERGUI.WEB_ADMIN_ENABLED) {
    await prisma.user.updateMany({ where: { role: 'ADMIN' }, data: { enabled: parseBool(value) } });
    return true;
  }

  return false;
}
