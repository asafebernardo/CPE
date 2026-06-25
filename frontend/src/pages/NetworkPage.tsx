import { useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { PageHeader } from '../components/common/PageHeader';
import { useAuthStore } from '../stores/authStore';
import { useUiStore } from '../stores/uiStore';
import { NETWORK_TABS, parseNetworkPath } from '../navigation/networkTabs';
import { WanPage } from './WanPage';
import { RoutingPage } from './RoutingPage';
import { LanNetworkTab } from './network/LanNetworkTab';
import { Tr069ManagementPage } from './tr069/Tr069ManagementPage';

export function NetworkPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const role = useAuthStore((s) => s.user?.role ?? 'USER');
  const canAccess = useUiStore((s) => s.canAccess);

  const { tab } = parseNetworkPath(location.pathname);

  const visibleTabs = NETWORK_TABS.filter((t) => canAccess(t.minRole, t.advancedOnly, role));
  const activeTabConfig = NETWORK_TABS.find((t) => t.id === tab) ?? visibleTabs[0];

  const allowedTab = visibleTabs.some((t) => t.id === tab);
  const fallbackPath = visibleTabs[0]?.path ?? '/';

  useEffect(() => {
    if (!allowedTab && visibleTabs.length > 0) {
      navigate(fallbackPath, { replace: true });
    }
  }, [allowedTab, fallbackPath, navigate, visibleTabs.length]);

  if (!allowedTab) {
    return <Navigate to={fallbackPath} replace />;
  }

  return (
    <Box>
      <PageHeader
        title={activeTabConfig?.title ?? 'Network'}
        subtitle={activeTabConfig?.description ?? 'Network configuration and monitoring.'}
      />

      {tab === 'wan' && <WanPage embedded />}
      {tab === 'lan' && <LanNetworkTab />}
      {tab === 'routing' && <RoutingPage embedded />}
      {tab === 'tr069' && <Tr069ManagementPage embedded />}
    </Box>
  );
}
