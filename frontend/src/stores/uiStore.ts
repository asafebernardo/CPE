import { create } from 'zustand';
import type { UserRole } from '@routergui/shared';
import { ROLE_LEVEL } from '@routergui/shared';
import type { DashboardTabId } from '../navigation/dashboardTabs';
import { DEFAULT_DASHBOARD_TAB } from '../navigation/dashboardTabs';
import type { WanTabId } from '../navigation/wanTabs';
import { DEFAULT_WAN_TAB } from '../navigation/wanTabs';

const COLLAPSE_KEY = 'routergui_sidebar_sections';
const DASHBOARD_TAB_KEY = 'routergui_dashboard_tab';
const WAN_TAB_KEY = 'routergui_wan_tab';

interface UiState {
  collapsedSections: Record<string, boolean>;
  dashboardTab: DashboardTabId;
  wanTab: WanTabId;
  toggleSection: (id: string) => void;
  isSectionCollapsed: (id: string) => boolean;
  setDashboardTab: (tab: DashboardTabId) => void;
  setWanTab: (tab: WanTabId) => void;
  canAccess: (minRole: UserRole, advancedOnly?: boolean, userRole?: UserRole | null) => boolean;
}

function loadCollapsed(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(COLLAPSE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function loadDashboardTab(): DashboardTabId {
  try {
    const raw = localStorage.getItem(DASHBOARD_TAB_KEY);
    if (raw && ['overview', 'internet', 'wifi', 'devices', 'network'].includes(raw)) {
      return raw as DashboardTabId;
    }
    if (raw === 'system') return 'overview';
  } catch {
    // ignore
  }
  return DEFAULT_DASHBOARD_TAB;
}

function loadWanTab(): WanTabId {
  try {
    const raw = localStorage.getItem(WAN_TAB_KEY);
    if (raw === 'configuration') return 'interfaces';
    if (raw && ['overview', 'interfaces', 'routes', 'history'].includes(raw)) {
      return raw as WanTabId;
    }
  } catch {
    // ignore
  }
  return DEFAULT_WAN_TAB;
}

export const useUiStore = create<UiState>((set, get) => ({
  collapsedSections: loadCollapsed(),
  dashboardTab: loadDashboardTab(),
  wanTab: loadWanTab(),

  toggleSection: (id) => {
    const next = { ...get().collapsedSections, [id]: !get().collapsedSections[id] };
    localStorage.setItem(COLLAPSE_KEY, JSON.stringify(next));
    set({ collapsedSections: next });
  },

  isSectionCollapsed: (id) => get().collapsedSections[id] ?? false,

  setDashboardTab: (tab) => {
    localStorage.setItem(DASHBOARD_TAB_KEY, tab);
    set({ dashboardTab: tab });
  },

  setWanTab: (tab) => {
    localStorage.setItem(WAN_TAB_KEY, tab);
    set({ wanTab: tab });
  },

  canAccess: (minRole, advancedOnly = false, userRole) => {
    if (!userRole) return false;
    if (ROLE_LEVEL[userRole] < ROLE_LEVEL[minRole]) return false;
    // Advanced features (TR-069, PON, routing, etc.) are admin-only.
    if (advancedOnly && userRole !== 'ADMIN') return false;
    return true;
  },
}));
