import { useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { PageHeader } from '../components/common/PageHeader';
import { NeighborScanPanel } from '../components/diagnostics/NeighborScanPanel';
import { PingPanel } from '../components/diagnostics/PingPanel';
import { SpeedTestPanel } from '../components/diagnostics/SpeedTestPanel';
import { TraceroutePanel } from '../components/diagnostics/TraceroutePanel';
import { useAuthStore } from '../stores/authStore';
import { useUiStore } from '../stores/uiStore';
import { DIAGNOSTICS_TABS, parseDiagnosticsPath } from '../navigation/diagnosticsTabs';

export function DiagnosticsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const role = useAuthStore((s) => s.user?.role ?? 'USER');
  const canAccess = useUiStore((s) => s.canAccess);

  const { tab } = parseDiagnosticsPath(location.pathname);

  const visibleTabs = DIAGNOSTICS_TABS.filter((t) => canAccess(t.minRole, t.advancedOnly, role));
  const activeTabConfig = DIAGNOSTICS_TABS.find((t) => t.id === tab) ?? visibleTabs[0];
  const allowedTab = visibleTabs.some((t) => t.id === tab);
  const fallbackPath = visibleTabs[0]?.path ?? '/';

  useEffect(() => {
    if (!allowedTab && visibleTabs.length > 0) {
      navigate(fallbackPath, { replace: true });
    }
  }, [allowedTab, fallbackPath, navigate, visibleTabs.length]);

  if (location.pathname === '/diagnostics') {
    return <Navigate to="/diagnostics/ping" replace />;
  }

  if (!allowedTab) {
    return <Navigate to={fallbackPath} replace />;
  }

  return (
    <Box>
      <PageHeader
        title={activeTabConfig?.title ?? 'Diagnostics'}
        subtitle={activeTabConfig?.description ?? 'Network diagnostic tools.'}
      />

      {tab === 'ping' && <PingPanel />}
      {tab === 'traceroute' && <TraceroutePanel />}
      {tab === 'neighbors' && <NeighborScanPanel />}
      {tab === 'speedtest' && <SpeedTestPanel />}
    </Box>
  );
}
