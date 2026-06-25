import type { UserRole } from '@aerobrry/shared';

export type SystemTabId = 'info' | 'users' | 'backup' | 'firmware' | 'actions' | 'logs';

export interface SystemTab {
  id: SystemTabId;
  label: string;
  path: string;
  title: string;
  description: string;
  minRole: UserRole;
  advancedOnly?: boolean;
}

export const SYSTEM_TABS: SystemTab[] = [
  {
    id: 'info',
    label: 'Information',
    path: '/system/info',
    title: 'System Information',
    description: 'Hardware, runtime, NTP, PON/ONU status and password storage settings.',
    minRole: 'USER',
  },
  {
    id: 'users',
    label: 'Users',
    path: '/system/users',
    title: 'Users',
    description: 'System accounts for AeroBerry access.',
    minRole: 'TECHNICIAN',
  },
  {
    id: 'backup',
    label: 'Backup',
    path: '/system/backup',
    title: 'Backup & Restore',
    description: 'Save and restore device configuration snapshots.',
    minRole: 'ADMIN',
    advancedOnly: true,
  },
  {
    id: 'firmware',
    label: 'Firmware',
    path: '/system/firmware',
    title: 'Firmware',
    description: 'Current firmware version, file upload and online upgrade.',
    minRole: 'TECHNICIAN',
  },
  {
    id: 'actions',
    label: 'Actions',
    path: '/system/actions',
    title: 'Device Actions',
    description: 'Reboot, factory reset and configuration presets.',
    minRole: 'TECHNICIAN',
  },
  {
    id: 'logs',
    label: 'Logs',
    path: '/system/logs',
    title: 'System Logs',
    description: 'System, TR-069 and security event logs.',
    minRole: 'TECHNICIAN',
  },
];

export const DEFAULT_SYSTEM_TAB: SystemTabId = 'info';

export function parseSystemPath(pathname: string): { tab: SystemTabId } {
  const parts = pathname.replace(/^\/system\/?/, '').split('/').filter(Boolean);
  const first = parts[0] ?? DEFAULT_SYSTEM_TAB;

  if (first === 'users') return { tab: 'users' };
  if (first === 'backup') return { tab: 'backup' };
  if (first === 'firmware') return { tab: 'firmware' };
  if (first === 'actions') return { tab: 'actions' };
  if (first === 'logs') return { tab: 'logs' };
  if (first === 'info') return { tab: 'info' };

  return { tab: DEFAULT_SYSTEM_TAB };
}
