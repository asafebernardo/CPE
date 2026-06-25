import type { DeviceCapabilities } from '@aerobrry/shared';
import type { NavItem } from '../../navigation/menuConfig';
import type { MainSectionId } from '../../navigation/enterpriseNav';

export interface ModuleRouteDef {
  path: string;
  /** If set, nav item is hidden when capability is false */
  capability?: keyof DeviceCapabilities;
  advancedOnly?: boolean;
}

export interface OsModuleDef {
  id: string;
  capability?: keyof DeviceCapabilities;
  section: MainSectionId;
  navItems: Array<NavItem & { capability?: keyof DeviceCapabilities }>;
}

/** Capability-gated nav entries — filters static enterprise nav */
export const OS_MODULES: OsModuleDef[] = [
  {
    id: 'mesh',
    capability: 'mesh',
    section: 'wireless',
    navItems: [{ path: '/wifi/mesh', label: 'Mesh', minRole: 'USER', capability: 'mesh' }],
  },
  {
    id: 'tr069',
    capability: 'tr069',
    section: 'network',
    navItems: [{ path: '/network/tr069', label: 'TR-069', minRole: 'ADMIN', advancedOnly: true, capability: 'tr069' }],
  },
  {
    id: 'vpn-qos',
    capability: 'vpn',
    section: 'security',
    navItems: [{ path: '/security-advanced', label: 'QoS / VPN', minRole: 'ADMIN', advancedOnly: true, capability: 'vpn' }],
  },
  {
    id: 'qos',
    capability: 'qos',
    section: 'security',
    navItems: [],
  },
  {
    id: 'sfp',
    capability: 'sfp',
    section: 'system',
    navItems: [],
  },
  {
    id: 'usb',
    capability: 'usb',
    section: 'system',
    navItems: [],
  },
  {
    id: 'wifi7',
    capability: 'wifi7',
    section: 'wireless',
    navItems: [],
  },
];

export function filterNavByCapabilities(
  items: NavItem[],
  caps: DeviceCapabilities | null,
  uiMode: 'standard' | 'advanced',
): NavItem[] {
  return items.filter((item) => {
    const mod = OS_MODULES.flatMap((m) => m.navItems).find((n) => n.path === item.path);
    if (mod?.capability && caps && !caps[mod.capability]) return false;
    if (item.advancedOnly && uiMode === 'standard') return false;
    return true;
  });
}

export function getProfileSectionOrder(profile: DeviceCapabilities['profile']): MainSectionId[] {
  switch (profile) {
    case 'mesh_node':
      return ['dashboard', 'wireless', 'network', 'diagnostics', 'security', 'system'];
    case 'isp':
      return ['dashboard', 'network', 'wireless', 'diagnostics', 'security', 'system'];
    case 'gaming':
      return ['dashboard', 'wireless', 'security', 'network', 'diagnostics', 'system'];
    case 'enterprise':
    default:
      return ['dashboard', 'network', 'wireless', 'security', 'diagnostics', 'system'];
  }
}
