export type DashboardTabId = 'overview' | 'internet' | 'wifi' | 'devices' | 'network';

export interface DashboardTab {
  id: DashboardTabId;
  label: string;
  title: string;
  description: string;
  advancedOnly?: boolean;
}

export const DASHBOARD_TABS: DashboardTab[] = [
  {
    id: 'overview',
    label: 'Overview',
    title: 'Network Overview',
    description: 'Status, equipment and quick actions for your RGX-5000.',
  },
  {
    id: 'internet',
    label: 'Internet',
    title: 'Internet',
    description: 'WAN connection status, traffic and link quality.',
  },
  {
    id: 'wifi',
    label: 'Wireless',
    title: 'Wireless',
    description: 'Wi-Fi networks, radios and connected clients.',
  },
  {
    id: 'devices',
    label: 'Devices',
    title: 'Connected Devices',
    description: 'Devices currently active on your home network.',
  },
  {
    id: 'network',
    label: 'Network',
    title: 'Network',
    description: 'Topology and LAN/WAN overview.',
    advancedOnly: true,
  },
];

export const DEFAULT_DASHBOARD_TAB: DashboardTabId = 'overview';
