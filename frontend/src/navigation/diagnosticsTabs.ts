import type { UserRole } from '@routergui/shared';

export type DiagnosticsTabId = 'ping' | 'traceroute' | 'neighbors' | 'speedtest';

export interface DiagnosticsTab {
  id: DiagnosticsTabId;
  label: string;
  path: string;
  title: string;
  description: string;
  minRole: UserRole;
  advancedOnly?: boolean;
}

export const DIAGNOSTICS_TABS: DiagnosticsTab[] = [
  {
    id: 'ping',
    label: 'Ping',
    path: '/diagnostics/ping',
    title: 'Ping',
    description: 'Test reachability and latency to a host or IP address.',
    minRole: 'USER',
  },
  {
    id: 'traceroute',
    label: 'Traceroute',
    path: '/diagnostics/traceroute',
    title: 'Traceroute',
    description: 'Trace the network path to a destination.',
    minRole: 'TECHNICIAN',
  },
  {
    id: 'neighbors',
    label: 'Neighbor Scan',
    path: '/diagnostics/neighbors',
    title: 'Neighbor Scan',
    description: 'Scan for nearby Wi-Fi access points.',
    minRole: 'USER',
  },
  {
    id: 'speedtest',
    label: 'Speed Test',
    path: '/diagnostics/speedtest',
    title: 'Speed Test',
    description: 'Measure download, upload and latency.',
    minRole: 'ADMIN',
    advancedOnly: true,
  },
];

export const DEFAULT_DIAGNOSTICS_TAB: DiagnosticsTabId = 'ping';

export function parseDiagnosticsPath(pathname: string): { tab: DiagnosticsTabId } {
  const parts = pathname.replace(/^\/diagnostics\/?/, '').split('/').filter(Boolean);
  const first = parts[0] ?? DEFAULT_DIAGNOSTICS_TAB;

  if (first === 'traceroute') return { tab: 'traceroute' };
  if (first === 'neighbors') return { tab: 'neighbors' };
  if (first === 'speedtest') return { tab: 'speedtest' };
  if (first === 'ping') return { tab: 'ping' };

  return { tab: DEFAULT_DIAGNOSTICS_TAB };
}
