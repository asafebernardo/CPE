import type { UserRole } from '@routergui/shared';

export type NetworkTabId = 'wan' | 'lan' | 'routing' | 'tr069';

export interface NetworkTab {
  id: NetworkTabId;
  label: string;
  path: string;
  title: string;
  description: string;
  minRole: UserRole;
  advancedOnly?: boolean;
}

export const NETWORK_TABS: NetworkTab[] = [
  {
    id: 'wan',
    label: 'WAN',
    path: '/network/wan',
    title: 'WAN',
    description: 'Wide area network status, configuration, statistics and diagnostics.',
    minRole: 'TECHNICIAN',
  },
  {
    id: 'lan',
    label: 'LAN',
    path: '/network/lan',
    title: 'LAN',
    description: 'Local network IP, DHCP server and static reservations.',
    minRole: 'TECHNICIAN',
  },
  {
    id: 'routing',
    label: 'Routing',
    path: '/network/routing',
    title: 'Routing',
    description: 'Static routing table.',
    minRole: 'ADMIN',
    advancedOnly: true,
  },
  {
    id: 'tr069',
    label: 'TR-069',
    path: '/network/tr069',
    title: 'TR-069',
    description: 'ACS configuration and CWMP session status.',
    minRole: 'ADMIN',
    advancedOnly: true,
  },
];

export const DEFAULT_NETWORK_TAB: NetworkTabId = 'wan';

export function parseNetworkPath(pathname: string): { tab: NetworkTabId } {
  const parts = pathname.replace(/^\/network\/?/, '').split('/').filter(Boolean);
  const first = parts[0] ?? DEFAULT_NETWORK_TAB;

  if (first === 'tr069') {
    return { tab: 'tr069' };
  }

  const tab = (['wan', 'lan', 'routing'].includes(first) ? first : DEFAULT_NETWORK_TAB) as NetworkTabId;
  return { tab };
}
