import type { UserRole } from '@aerobrry/shared';

export type WirelessTabId = 'networks' | 'band-steering' | 'guest' | 'mesh';

export interface WirelessTab {
  id: WirelessTabId;
  label: string;
  path: string;
  title: string;
  description: string;
  minRole: UserRole;
}

export const WIRELESS_TABS: WirelessTab[] = [
  {
    id: 'networks',
    label: 'Networks',
    path: '/wifi/networks',
    title: 'Networks',
    description: 'Primary and secondary home SSIDs on 2.4 GHz and 5 GHz radios.',
    minRole: 'USER',
  },
  {
    id: 'band-steering',
    label: 'Band Steering',
    path: '/wifi/band-steering',
    title: 'Band Steering',
    description: 'Band steering policy for main home SSIDs.',
    minRole: 'USER',
  },
  {
    id: 'guest',
    label: 'Guest Network',
    path: '/wifi/guest',
    title: 'Guest Network',
    description: 'Isolated guest SSIDs — never included in Band Steering.',
    minRole: 'USER',
  },
  {
    id: 'mesh',
    label: 'Mesh',
    path: '/wifi/mesh',
    title: 'Mesh',
    description: 'Reserved mesh backhaul interfaces.',
    minRole: 'USER',
  },
];

export const DEFAULT_WIRELESS_TAB: WirelessTabId = 'networks';

export function parseWirelessPath(pathname: string): { tab: WirelessTabId } {
  const parts = pathname.replace(/^\/wifi\/?/, '').split('/').filter(Boolean);
  const first = parts[0] ?? DEFAULT_WIRELESS_TAB;

  if (first === 'band-steering') return { tab: 'band-steering' };
  if (first === 'guest') return { tab: 'guest' };
  if (first === 'mesh') return { tab: 'mesh' };
  if (first === 'networks') return { tab: 'networks' };

  return { tab: DEFAULT_WIRELESS_TAB };
}
