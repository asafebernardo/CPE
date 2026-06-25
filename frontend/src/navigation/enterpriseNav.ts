import type { UserRole } from '@routergui/shared';
import type { NavItem } from './menuConfig';

export type MainSectionId =
  | 'dashboard'
  | 'network'
  | 'wireless'
  | 'diagnostics'
  | 'security'
  | 'system';

/** Nested submenu group inside a main section dropdown (e.g. LAN → LAN + DHCP). */
export interface NavGroup {
  type: 'group';
  label: string;
  items: NavItem[];
}

export type SectionEntry = NavItem | NavGroup;

export function isNavGroup(entry: SectionEntry): entry is NavGroup {
  return 'type' in entry && entry.type === 'group';
}

export function flattenSectionEntries(entries: SectionEntry[]): NavItem[] {
  return entries.flatMap((entry) => (isNavGroup(entry) ? entry.items : [entry]));
}

export function isNavItemActive(pathname: string, itemPath: string): boolean {
  if (pathname === itemPath) return true;
  if (itemPath === '/network/tr069' && pathname.startsWith('/network/tr069')) return true;
  if (itemPath === '/wifi/networks' && (pathname === '/wifi' || pathname === '/wifi/networks')) return true;
  if (pathname === '/diagnostics' && itemPath === '/diagnostics/ping') return true;
  if (itemPath.startsWith('/diagnostics/') && pathname === itemPath) return true;
  if (pathname === '/system' && itemPath === '/system/info') return true;
  if (itemPath.startsWith('/system/') && pathname === itemPath) return true;
  return false;
}

export interface MainSection {
  id: MainSectionId;
  label: string;
  minRole: UserRole;
  advancedOnly?: boolean;
  items: SectionEntry[];
}

/** Top-level enterprise sections — each maps to sidebar submenu items. */
export const MAIN_SECTIONS: MainSection[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    minRole: 'USER',
    items: [
      { path: '/', label: 'Overview', minRole: 'USER' },
      { path: '/internet', label: 'Internet', minRole: 'USER' },
      { path: '/hosts', label: 'Connected Devices', minRole: 'USER' },
    ],
  },
  {
    id: 'network',
    label: 'Network',
    minRole: 'TECHNICIAN',
    items: [
      { path: '/network/wan', label: 'WAN', minRole: 'TECHNICIAN' },
      { path: '/network/lan', label: 'LAN', minRole: 'TECHNICIAN' },
      { path: '/network/routing', label: 'Routing', minRole: 'ADMIN', advancedOnly: true },
      { path: '/network/tr069', label: 'TR-069', minRole: 'ADMIN', advancedOnly: true },
    ],
  },
  {
    id: 'wireless',
    label: 'Wireless',
    minRole: 'USER',
    items: [
      { path: '/wifi/networks', label: 'Networks', minRole: 'USER' },
      { path: '/wifi/band-steering', label: 'Band Steering', minRole: 'USER' },
      { path: '/wifi/guest', label: 'Guest Network', minRole: 'USER' },
      { path: '/wifi/mesh', label: 'Mesh', minRole: 'USER' },
    ],
  },
  {
    id: 'diagnostics',
    label: 'Diagnostics',
    minRole: 'USER',
    items: [
      { path: '/diagnostics/ping', label: 'Ping', minRole: 'USER' },
      { path: '/diagnostics/traceroute', label: 'Traceroute', minRole: 'TECHNICIAN' },
      { path: '/diagnostics/neighbors', label: 'Neighbor Scan', minRole: 'USER' },
      { path: '/diagnostics/speedtest', label: 'Speed Test', minRole: 'ADMIN', advancedOnly: true },
    ],
  },
  {
    id: 'security',
    label: 'Security',
    minRole: 'TECHNICIAN',
    items: [
      { path: '/security', label: 'Security Center', minRole: 'TECHNICIAN' },
      { path: '/firewall', label: 'Firewall', minRole: 'TECHNICIAN' },
      { path: '/nat', label: 'NAT', minRole: 'ADMIN', advancedOnly: true },
      { path: '/port-forward', label: 'Port Forward', minRole: 'ADMIN', advancedOnly: true },
      { path: '/upnp', label: 'UPnP', minRole: 'ADMIN', advancedOnly: true },
      { path: '/security-advanced', label: 'QoS / VPN', minRole: 'ADMIN', advancedOnly: true },
    ],
  },
  {
    id: 'system',
    label: 'System',
    minRole: 'USER',
    items: [
      { path: '/system/info', label: 'Information', minRole: 'USER' },
      { path: '/system/users', label: 'Users', minRole: 'TECHNICIAN' },
      { path: '/system/backup', label: 'Backup', minRole: 'ADMIN', advancedOnly: true },
      { path: '/system/firmware', label: 'Firmware', minRole: 'TECHNICIAN' },
      { path: '/system/actions', label: 'Actions', minRole: 'TECHNICIAN' },
      { path: '/system/logs', label: 'Logs', minRole: 'TECHNICIAN' },
    ],
  },
];

/** Resolve which main section owns a route (exact match first, then prefix). */
export function getSectionForPath(pathname: string): MainSectionId {
  if (pathname.startsWith('/network')) return 'network';
  if (pathname.startsWith('/wifi')) return 'wireless';
  if (pathname.startsWith('/diagnostics')) return 'diagnostics';
  if (pathname.startsWith('/system')) return 'system';

  for (const section of MAIN_SECTIONS) {
    for (const item of flattenSectionEntries(section.items)) {
      if (item.path === pathname) return section.id;
    }
  }
  for (const section of MAIN_SECTIONS) {
    for (const item of flattenSectionEntries(section.items)) {
      if (item.path !== '/' && pathname.startsWith(item.path)) return section.id;
    }
  }
  return 'dashboard';
}

export function getNavItemLabel(path: string): string | undefined {
  if (path.startsWith('/network/wan')) return 'WAN';
  if (path.startsWith('/network/lan')) return 'LAN';
  if (path.startsWith('/network/routing')) return 'Routing';
  if (path.startsWith('/network/tr069')) return 'TR-069';
  if (path.startsWith('/wifi/band-steering')) return 'Band Steering';
  if (path.startsWith('/security/users')) return 'Users';
  if (path.startsWith('/wifi/mesh')) return 'Mesh';
  if (path.startsWith('/wifi/guest')) return 'Guest Network';
  if (path.startsWith('/wifi/networks') || path === '/wifi') return 'Networks';
  if (path.startsWith('/diagnostics/ping') || path === '/diagnostics') return 'Ping';
  if (path.startsWith('/diagnostics/traceroute')) return 'Traceroute';
  if (path.startsWith('/diagnostics/neighbors')) return 'Neighbor Scan';
  if (path.startsWith('/diagnostics/speedtest')) return 'Speed Test';
  if (path.startsWith('/system/info') || path === '/system') return 'Information';
  if (path.startsWith('/system/users')) return 'Users';
  if (path.startsWith('/system/backup')) return 'Backup';
  if (path.startsWith('/system/firmware')) return 'Firmware';
  if (path.startsWith('/system/actions')) return 'Actions';
  if (path.startsWith('/system/logs')) return 'Logs';

  for (const section of MAIN_SECTIONS) {
    const item = flattenSectionEntries(section.items).find((i) => i.path === path);
    if (item) return item.label;
  }
  return undefined;
}
