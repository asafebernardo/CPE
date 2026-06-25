export type WanTabId = 'overview' | 'interfaces' | 'routes' | 'history';

export interface WanTab {
  id: WanTabId;
  label: string;
}

export const WAN_TABS: WanTab[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'interfaces', label: 'Interfaces' },
  { id: 'routes', label: 'Routes & ACS' },
  { id: 'history', label: 'History' },
];

export const DEFAULT_WAN_TAB: WanTabId = 'overview';
