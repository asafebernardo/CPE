import { AppBar, Toolbar, Typography, Box, Chip, IconButton, Switch, FormControlLabel, Tabs, Tab } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { useLocation } from 'react-router-dom';
import { DEVICE_MODEL, DEVICE_SOFTWARE_VERSION } from '@routergui/shared';
import { useAuthStore } from '../stores/authStore';
import { useOperationalStore } from '../stores/operationalStore';
import { useUiStore } from '../stores/uiStore';
import { acsColors } from '../theme/colors';
import { DASHBOARD_TABS } from '../navigation/dashboardTabs';
import type { DashboardTabId } from '../navigation/dashboardTabs';
import { WAN_TABS } from '../navigation/wanTabs';
import type { WanTabId } from '../navigation/wanTabs';

const ROLE_LABELS: Record<string, string> = {
  USER: 'User',
  TECHNICIAN: 'Technician',
  ADMIN: 'Admin',
};

export function Navbar() {
  const location = useLocation();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const role = user?.role ?? 'USER';
  const acsStatus = useOperationalStore((s) => s.data?.acs.status);
  const acsConfigured = useOperationalStore((s) => s.data?.acs.configured);
  const acsOnline = acsConfigured && acsStatus === 'Connected';
  const advancedMode = useUiStore((s) => s.advancedMode);
  const setAdvancedMode = useUiStore((s) => s.setAdvancedMode);
  const dashboardTab = useUiStore((s) => s.dashboardTab);
  const setDashboardTab = useUiStore((s) => s.setDashboardTab);
  const wanTab = useUiStore((s) => s.wanTab);
  const setWanTab = useUiStore((s) => s.setWanTab);

  const showAcs = role === 'ADMIN' && advancedMode;
  const isDashboard = location.pathname === '/';
  const isWan = location.pathname === '/wan';
  const visibleTabs = DASHBOARD_TABS.filter((tab) => !tab.advancedOnly || advancedMode);
  const activeTab = visibleTabs.some((t) => t.id === dashboardTab) ? dashboardTab : 'overview';
  const activeWanTab = WAN_TABS.some((t) => t.id === wanTab) ? wanTab : 'overview';

  return (
    <AppBar position="static" elevation={0}>
      <Toolbar sx={{ gap: 2, minHeight: 48 }}>
        <Typography variant="body2" noWrap sx={{ flexGrow: 1, color: acsColors.textSecondary }}>
          {DEVICE_MODEL}
          <Typography component="span" sx={{ color: acsColors.textMuted, mx: 1 }}>·</Typography>
          RGOS {DEVICE_SOFTWARE_VERSION}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {role !== 'USER' && (
            <FormControlLabel
              sx={{ mr: 0 }}
              control={
                <Switch
                  size="small"
                  checked={advancedMode}
                  onChange={(e) => setAdvancedMode(e.target.checked)}
                />
              }
              label={<Typography variant="caption" sx={{ color: acsColors.textSecondary }}>Advanced</Typography>}
            />
          )}
          <Chip size="small" label={ROLE_LABELS[role] ?? role} sx={{ fontWeight: 600, fontSize: '0.7rem' }} />
          {showAcs && (
            <Chip
              size="small"
              label={acsOnline ? 'ACS' : 'ACS —'}
              sx={{
                bgcolor: acsOnline ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                color: acsOnline ? acsColors.success : acsColors.warning,
                fontWeight: 600,
                fontSize: '0.7rem',
              }}
            />
          )}
          <Typography variant="caption" sx={{ color: acsColors.textSecondary }}>{user?.username}</Typography>
          <IconButton onClick={logout} title="Logout" size="small">
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Box>
      </Toolbar>

      {isDashboard && (
        <Box sx={{ borderTop: `1px solid ${acsColors.borderSubtle}`, px: 1 }}>
          <Tabs
            value={activeTab}
            onChange={(_, value: DashboardTabId) => setDashboardTab(value)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minHeight: 40,
              '& .MuiTabs-indicator': { backgroundColor: acsColors.accent },
              '& .MuiTab-root': {
                minHeight: 40,
                py: 0.5,
                fontSize: '0.8125rem',
                color: acsColors.textMuted,
                '&.Mui-selected': { color: acsColors.accent },
              },
            }}
          >
            {visibleTabs.map((tab) => (
              <Tab key={tab.id} value={tab.id} label={tab.label} />
            ))}
          </Tabs>
        </Box>
      )}

      {isWan && (
        <Box sx={{ borderTop: `1px solid ${acsColors.borderSubtle}`, px: 1 }}>
          <Tabs
            value={activeWanTab}
            onChange={(_, value: WanTabId) => setWanTab(value)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minHeight: 40,
              '& .MuiTabs-indicator': { backgroundColor: acsColors.accent },
              '& .MuiTab-root': {
                minHeight: 40,
                py: 0.5,
                fontSize: '0.8125rem',
                color: acsColors.textMuted,
                '&.Mui-selected': { color: acsColors.accent },
              },
            }}
          >
            {WAN_TABS.map((tab) => (
              <Tab key={tab.id} value={tab.id} label={tab.label} />
            ))}
          </Tabs>
        </Box>
      )}
    </AppBar>
  );
}
