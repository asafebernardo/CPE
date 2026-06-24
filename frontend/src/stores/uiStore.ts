import { create } from 'zustand';
import type { UserRole } from '@routergui/shared';
import { ROLE_LEVEL } from '@routergui/shared';
import type { DashboardTabId } from '../navigation/dashboardTabs';
import { DEFAULT_DASHBOARD_TAB } from '../navigation/dashboardTabs';
import type { WanTabId } from '../navigation/wanTabs';
import { DEFAULT_WAN_TAB } from '../navigation/wanTabs';

const ADVANCED_KEY = 'routergui_advanced_mode';
const COLLAPSE_KEY = 'routergui_sidebar_sections';
const DASHBOARD_TAB_KEY = 'routergui_dashboard_tab';
const WAN_TAB_KEY = 'routergui_wan_tab';

interface UiState {
  advancedMode: boolean;
  collapsedSections: Record<string, boolean>;
  dashboardTab: DashboardTabId;
  wanTab: WanTabId;
  setAdvancedMode: (value: boolean) => void;
  toggleSection: (id: string) => void;
  isSectionCollapsed: (id: string) => boolean;
  setDashboardTab: (tab: DashboardTabId) => void;
  setWanTab: (tab: WanTabId) => void;
  canAccess: (minRole: UserRole, advancedOnly?: boolean, userRole?: UserRole | null) => boolean;
}

function loadAdvanced(): boolean {
  try {
    return localStorage.getItem(ADVANCED_KEY) === 'true';
  } catch {
    return false;
  }
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
    if (raw && ['overview', 'interfaces', 'configuration', 'routes', 'history'].includes(raw)) {
      return raw as WanTabId;
    }
  } catch {
    // ignore
  }
  return DEFAULT_WAN_TAB;
}

export const useUiStore = create<UiState>((set, get) => ({
  advancedMode: loadAdvanced(),
  collapsedSections: loadCollapsed(),
  dashboardTab: loadDashboardTab(),
  wanTab: loadWanTab(),

  setAdvancedMode: (value) => {
    localStorage.setItem(ADVANCED_KEY, String(value));
    set({ advancedMode: value });
  },

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
    if (advancedOnly && !get().advancedMode) return false;
    return true;
  },
}));
