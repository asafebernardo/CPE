import type { UserRole } from '@routergui/shared';

export interface NavItem {
  path: string;
  label: string;
  minRole: UserRole;
  advancedOnly?: boolean;
}

export interface NavSection {
  id: string;
  title: string;
  minRole: UserRole;
  advancedOnly?: boolean;
  items: NavItem[];
}

/** Flat routes for access control */
export const ROUTE_ACCESS: NavItem[] = [
  { path: '/', label: 'Dashboard', minRole: 'USER' },
  { path: '/internet', label: 'Internet', minRole: 'USER' },
  { path: '/wifi/networks', label: 'Networks', minRole: 'USER' },
  { path: '/wifi/band-steering', label: 'Band Steering', minRole: 'USER' },
  { path: '/wifi/guest', label: 'Guest Network', minRole: 'USER' },
  { path: '/wifi/mesh', label: 'Mesh', minRole: 'USER' },
  { path: '/diagnostics/ping', label: 'Ping', minRole: 'USER' },
  { path: '/diagnostics/traceroute', label: 'Traceroute', minRole: 'TECHNICIAN' },
  { path: '/diagnostics/neighbors', label: 'Neighbor Scan', minRole: 'USER' },
  { path: '/diagnostics/speedtest', label: 'Speed Test', minRole: 'ADMIN', advancedOnly: true },
  { path: '/hosts', label: 'Connected Devices', minRole: 'USER' },
  { path: '/system/info', label: 'Information', minRole: 'USER' },
  { path: '/system/users', label: 'Users', minRole: 'TECHNICIAN' },
  { path: '/system/backup', label: 'Backup', minRole: 'ADMIN', advancedOnly: true },
  { path: '/system/firmware', label: 'Firmware', minRole: 'TECHNICIAN' },
  { path: '/system/actions', label: 'Actions', minRole: 'TECHNICIAN' },
  { path: '/system/logs', label: 'Logs', minRole: 'TECHNICIAN' },
  { path: '/wan', label: 'WAN', minRole: 'TECHNICIAN' },
  { path: '/network/wan', label: 'WAN', minRole: 'TECHNICIAN' },
  { path: '/network/lan', label: 'LAN', minRole: 'TECHNICIAN' },
  { path: '/network/routing', label: 'Routing', minRole: 'ADMIN', advancedOnly: true },
  { path: '/network/tr069', label: 'TR-069', minRole: 'ADMIN', advancedOnly: true },
  { path: '/security', label: 'Security Center', minRole: 'TECHNICIAN' },
  { path: '/firewall', label: 'Firewall', minRole: 'TECHNICIAN' },
  { path: '/nat', label: 'NAT', minRole: 'ADMIN', advancedOnly: true },
  { path: '/port-forward', label: 'Port Forward', minRole: 'ADMIN', advancedOnly: true },
  { path: '/upnp', label: 'UPnP', minRole: 'ADMIN', advancedOnly: true },
  { path: '/security-advanced', label: 'QoS / VPN', minRole: 'ADMIN', advancedOnly: true },
];

export const USER_MENU: NavItem[] = [
  { path: '/', label: 'Dashboard', minRole: 'USER' },
  { path: '/internet', label: 'Internet', minRole: 'USER' },
  { path: '/wifi/networks', label: 'Networks', minRole: 'USER' },
  { path: '/wifi/band-steering', label: 'Band Steering', minRole: 'USER' },
  { path: '/wifi/guest', label: 'Guest Network', minRole: 'USER' },
  { path: '/wifi/mesh', label: 'Mesh', minRole: 'USER' },
  { path: '/diagnostics/ping', label: 'Ping', minRole: 'USER' },
  { path: '/hosts', label: 'Connected Devices', minRole: 'USER' },
  { path: '/system/info', label: 'System', minRole: 'USER' },
];

export const ADMIN_SECTIONS: NavSection[] = [
  {
    id: 'overview',
    title: 'Overview',
    minRole: 'USER',
    items: [
      { path: '/', label: 'Dashboard', minRole: 'USER' },
      { path: '/internet', label: 'Internet', minRole: 'USER' },
      { path: '/hosts', label: 'Connected Devices', minRole: 'USER' },
    ],
  },
  {
    id: 'network',
    title: 'Network',
    minRole: 'TECHNICIAN',
    items: [
      { path: '/network/wan', label: 'WAN', minRole: 'TECHNICIAN' },
      { path: '/network/lan', label: 'LAN', minRole: 'TECHNICIAN' },
      { path: '/network/routing', label: 'Routing', minRole: 'ADMIN', advancedOnly: true },
      { path: '/network/tr069', label: 'TR-069', minRole: 'ADMIN', advancedOnly: true },
      { path: '/wifi/networks', label: 'Networks', minRole: 'USER' },
      { path: '/wifi/band-steering', label: 'Band Steering', minRole: 'USER' },
      { path: '/wifi/guest', label: 'Guest Network', minRole: 'USER' },
      { path: '/wifi/mesh', label: 'Mesh', minRole: 'USER' },
    ],
  },
  {
    id: 'diagnostics',
    title: 'Diagnostics',
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
    title: 'Security',
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
    title: 'System',
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

export function getRouteAccess(path: string): NavItem | undefined {
  const exact = ROUTE_ACCESS.find((r) => r.path === path);
  if (exact) return exact;
  if (path.startsWith('/system/')) {
    return ROUTE_ACCESS.find((r) => r.path === path);
  }
  if (path.startsWith('/diagnostics/')) {
    return ROUTE_ACCESS.find((r) => r.path === path);
  }
  return undefined;
}
