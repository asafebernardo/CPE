import { create } from 'zustand';
import type { UserRole } from '@aerobrry/shared';
import { ROLE_LEVEL } from '@aerobrry/shared';
import type { DashboardTabId } from '../navigation/dashboardTabs';
import { DEFAULT_DASHBOARD_TAB } from '../navigation/dashboardTabs';
import type { WanTabId } from '../navigation/wanTabs';
import { DEFAULT_WAN_TAB } from '../navigation/wanTabs';

const COLLAPSE_KEY = 'aerobrry_sidebar_sections';
const DASHBOARD_TAB_KEY = 'aerobrry_dashboard_tab';
const WAN_TAB_KEY = 'aerobrry_wan_tab';
const UI_MODE_KEY = 'aerobrry_ui_mode';
const CONTEXT_PANEL_KEY = 'aerobrry_context_collapsed';

export type UiMode = 'standard' | 'advanced';

interface UiState {
  collapsedSections: Record<string, boolean>;
  dashboardTab: DashboardTabId;
  wanTab: WanTabId;
  uiMode: UiMode;
  contextPanelCollapsed: boolean;
  toggleSection: (id: string) => void;
  isSectionCollapsed: (id: string) => boolean;
  setDashboardTab: (tab: DashboardTabId) => void;
  setWanTab: (tab: WanTabId) => void;
  setUiMode: (mode: UiMode) => void;
  toggleContextPanel: () => void;
  canAccess: (minRole: UserRole, advancedOnly?: boolean, userRole?: UserRole | null) => boolean;
  showAdvanced: (advancedOnly?: boolean) => boolean;
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

function loadUiMode(): UiMode {
  try {
    const raw = localStorage.getItem(UI_MODE_KEY);
    if (raw === 'standard' || raw === 'advanced') return raw;
  } catch {
    // ignore
  }
  return 'standard';
}

function loadContextCollapsed(): boolean {
  try {
    return localStorage.getItem(CONTEXT_PANEL_KEY) === 'true';
  } catch {
    return false;
  }
}

export const useUiStore = create<UiState>((set, get) => ({
  collapsedSections: loadCollapsed(),
  dashboardTab: loadDashboardTab(),
  wanTab: loadWanTab(),
  uiMode: loadUiMode(),
  contextPanelCollapsed: loadContextCollapsed(),

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

  setUiMode: (mode) => {
    localStorage.setItem(UI_MODE_KEY, mode);
    document.documentElement.setAttribute('data-ui-mode', mode);
    set({ uiMode: mode });
  },

  toggleContextPanel: () => {
    const next = !get().contextPanelCollapsed;
    localStorage.setItem(CONTEXT_PANEL_KEY, String(next));
    set({ contextPanelCollapsed: next });
  },

  canAccess: (minRole, advancedOnly = false, userRole) => {
    if (!userRole) return false;
    if (ROLE_LEVEL[userRole] < ROLE_LEVEL[minRole]) return false;
    if (advancedOnly && get().uiMode === 'standard') return false;
    if (advancedOnly && userRole !== 'ADMIN') return false;
    return true;
  },

  showAdvanced: (advancedOnly = false) => {
    if (!advancedOnly) return true;
    return get().uiMode === 'advanced';
  },
}));
