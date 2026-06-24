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
  { path: '/wifi', label: 'Wi-Fi', minRole: 'USER' },
  { path: '/hosts', label: 'Connected Devices', minRole: 'USER' },
  { path: '/diagnostic', label: 'Diagnostics', minRole: 'USER' },
  { path: '/system', label: 'System', minRole: 'USER' },
  { path: '/wan', label: 'WAN', minRole: 'TECHNICIAN' },
  { path: '/lan', label: 'LAN', minRole: 'TECHNICIAN' },
  { path: '/dhcp', label: 'DHCP', minRole: 'TECHNICIAN' },
  { path: '/security', label: 'Security Center', minRole: 'TECHNICIAN' },
  { path: '/firewall', label: 'Firewall', minRole: 'TECHNICIAN' },
  { path: '/logs', label: 'Logs', minRole: 'TECHNICIAN' },
  { path: '/routing', label: 'Routing', minRole: 'ADMIN', advancedOnly: true },
  { path: '/nat', label: 'NAT', minRole: 'ADMIN', advancedOnly: true },
  { path: '/port-forward', label: 'Port Forward', minRole: 'ADMIN', advancedOnly: true },
  { path: '/upnp', label: 'UPnP', minRole: 'ADMIN', advancedOnly: true },
  { path: '/security-advanced', label: 'QoS / VPN', minRole: 'ADMIN', advancedOnly: true },
  { path: '/tr069/management', label: 'ACS Configuration', minRole: 'ADMIN', advancedOnly: true },
  { path: '/tr069/events', label: 'Event Viewer', minRole: 'ADMIN', advancedOnly: true },
  { path: '/tr069/parameters', label: 'Parameter Explorer', minRole: 'ADMIN', advancedOnly: true },
  { path: '/pon/optical', label: 'Optical Status', minRole: 'ADMIN', advancedOnly: true },
  { path: '/pon/onu', label: 'ONU Information', minRole: 'ADMIN', advancedOnly: true },
  { path: '/speedtest', label: 'Speed Test', minRole: 'ADMIN', advancedOnly: true },
  { path: '/management', label: 'Backup & Restore', minRole: 'ADMIN', advancedOnly: true },
];

export const USER_MENU: NavItem[] = [
  { path: '/', label: 'Dashboard', minRole: 'USER' },
  { path: '/internet', label: 'Internet', minRole: 'USER' },
  { path: '/wifi', label: 'Wi-Fi', minRole: 'USER' },
  { path: '/hosts', label: 'Connected Devices', minRole: 'USER' },
  { path: '/diagnostic', label: 'Diagnostics', minRole: 'USER' },
  { path: '/system', label: 'System', minRole: 'USER' },
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
      { path: '/wan', label: 'WAN', minRole: 'TECHNICIAN' },
      { path: '/lan', label: 'LAN', minRole: 'TECHNICIAN' },
      { path: '/dhcp', label: 'DHCP', minRole: 'TECHNICIAN' },
      { path: '/routing', label: 'Routing', minRole: 'ADMIN', advancedOnly: true },
      { path: '/wifi', label: 'Wi-Fi', minRole: 'USER' },
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
    id: 'tr069',
    title: 'TR-069',
    minRole: 'ADMIN',
    advancedOnly: true,
    items: [
      { path: '/tr069/management', label: 'ACS Configuration', minRole: 'ADMIN', advancedOnly: true },
      { path: '/tr069/events', label: 'Event Viewer', minRole: 'ADMIN', advancedOnly: true },
      { path: '/tr069/parameters', label: 'Parameter Explorer', minRole: 'ADMIN', advancedOnly: true },
    ],
  },
  {
    id: 'pon',
    title: 'PON / GPON',
    minRole: 'ADMIN',
    advancedOnly: true,
    items: [
      { path: '/pon/optical', label: 'Optical Status', minRole: 'ADMIN', advancedOnly: true },
      { path: '/pon/onu', label: 'ONU Information', minRole: 'ADMIN', advancedOnly: true },
    ],
  },
  {
    id: 'tools',
    title: 'Tools',
    minRole: 'USER',
    items: [
      { path: '/diagnostic', label: 'Diagnostics', minRole: 'USER' },
      { path: '/speedtest', label: 'Speed Test', minRole: 'ADMIN', advancedOnly: true },
      { path: '/logs', label: 'Logs', minRole: 'TECHNICIAN' },
    ],
  },
  {
    id: 'system',
    title: 'System',
    minRole: 'USER',
    items: [
      { path: '/management', label: 'Backup & Restore', minRole: 'ADMIN', advancedOnly: true },
      { path: '/system', label: 'System Information', minRole: 'USER' },
    ],
  },
];

export function getRouteAccess(path: string): NavItem | undefined {
  return ROUTE_ACCESS.find((r) => r.path === path);
}
