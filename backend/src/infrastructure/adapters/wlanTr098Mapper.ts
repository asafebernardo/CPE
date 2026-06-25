import { TR098_ROOT } from '@aerobrry/shared';
import { prisma } from '../../infrastructure/database/prisma.js';

const WLAN_PATH =
  /^InternetGatewayDevice\.LANDevice\.1\.WLANConfiguration\.(\d+)\.(?:(PreSharedKey\.1\.)?KeyPassphrase|SSID|BeaconType|Enable|Channel|RadioEnabled|X_RouterGui_BandwidthLimitMbps)$/;

export function parseWlanTr098Path(path: string): { index: number; field: string } | null {
  const match = path.match(WLAN_PATH);
  if (!match) return null;
  const index = parseInt(match[1], 10);
  if (path.endsWith('.KeyPassphrase') || path.includes('PreSharedKey.1.KeyPassphrase')) {
    return { index, field: 'password' };
  }
  if (path.endsWith('.SSID')) return { index, field: 'ssid' };
  if (path.endsWith('.BeaconType')) return { index, field: 'security' };
  if (path.endsWith('.Enable') || path.endsWith('.RadioEnabled')) return { index, field: 'enabled' };
  if (path.endsWith('.Channel')) return { index, field: 'channel' };
  if (path.endsWith('.X_RouterGui_BandwidthLimitMbps')) return { index, field: 'bandwidth' };
  return null;
}

/** IXC uses BeaconType "11i" for WPA2-PSK AES */
export function mapBeaconTypeToSecurity(beaconType: string): string {
  const b = beaconType.toLowerCase();
  if (b === '11i' || b === 'wpa2') return 'wpa2-psk-aes';
  if (b === 'wpa3' || b === 'wpa3-personal') return 'wpa3-sae';
  if (b === 'wpa' || b === 'wpaand11i') return 'wpa2-psk-aes';
  return 'wpa2-psk-aes';
}

async function findWirelessByTr098Index(deviceId: string, index: number) {
  const interfaces = await prisma.wirelessInterface.findMany({
    where: { deviceId },
    orderBy: [{ interfaceType: 'asc' }, { band: 'asc' }, { interfaceId: 'asc' }],
  });
  if (interfaces[index - 1]) return interfaces[index - 1];

  const wlanConfigs = await prisma.wlanConfig.findMany({
    where: { deviceId },
    orderBy: { band: 'asc' },
  });
  const wlan = wlanConfigs[index - 1];
  if (!wlan) return null;
  return { kind: 'wlanConfig' as const, wlan, band: wlan.band };
}

export async function applyWlanTr098Parameter(
  deviceId: string,
  index: number,
  field: string,
  value: string,
): Promise<boolean> {
  const target = await findWirelessByTr098Index(deviceId, index);
  if (!target) return false;

  if ('kind' in target && target.kind === 'wlanConfig') {
    const data: Record<string, unknown> = {};
    if (field === 'password') data.password = value;
    else if (field === 'ssid') data.ssid = value;
    else if (field === 'security') data.security = mapBeaconTypeToSecurity(value);
    else if (field === 'enabled') data.enabled = value === 'true' || value === '1';
    else if (field === 'channel') data.channel = parseInt(value, 10) || target.wlan.channel;
    else if (field === 'bandwidth') return false;
    if (Object.keys(data).length === 0) return false;
    await prisma.wlanConfig.update({
      where: { deviceId_band: { deviceId, band: target.band } },
      data,
    });
    return true;
  }

  const iface = target as { id: string };
  const data: Record<string, unknown> = {};
  if (field === 'password') data.password = value;
  else if (field === 'ssid') data.ssid = value;
  else if (field === 'security') data.security = mapBeaconTypeToSecurity(value);
  else if (field === 'enabled') data.enabled = value === 'true' || value === '1';
  else if (field === 'channel') data.channel = parseInt(value, 10) || 6;
  else if (field === 'bandwidth') data.bandwidthLimitMbps = value === '' ? null : parseInt(value, 10) || null;

  if (Object.keys(data).length === 0) return false;
  await prisma.wirelessInterface.update({ where: { id: iface.id }, data });
  return true;
}

/** Canonical TR-098 path aliases used by IXC ACS */
export function normalizeAcsParameterPath(path: string): string {
  const wlan = parseWlanTr098Path(path);
  if (wlan && path.endsWith('.KeyPassphrase') && !path.includes('PreSharedKey')) {
    return `${TR098_ROOT}.LANDevice.1.WLANConfiguration.${wlan.index}.PreSharedKey.1.KeyPassphrase`;
  }
  return path;
}
