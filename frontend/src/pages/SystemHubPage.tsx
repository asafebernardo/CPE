import { useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { PageHeader } from '../components/common/PageHeader';
import { ActionsPanel } from '../components/system/ActionsPanel';
import { BackupPanel } from '../components/system/BackupPanel';
import { FirmwarePanel } from '../components/system/FirmwarePanel';
import { LogsPanel } from '../components/system/LogsPanel';
import { SystemInfoPanel } from '../components/system/SystemInfoPanel';
import { UsersPanel } from '../components/system/UsersPanel';
import { useAuthStore } from '../stores/authStore';
import { useUiStore } from '../stores/uiStore';
import { SYSTEM_TABS, parseSystemPath } from '../navigation/systemTabs';

export function SystemHubPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const role = useAuthStore((s) => s.user?.role ?? 'USER');
  const canAccess = useUiStore((s) => s.canAccess);

  const { tab } = parseSystemPath(location.pathname);

  const visibleTabs = SYSTEM_TABS.filter((t) => canAccess(t.minRole, t.advancedOnly, role));
  const activeTabConfig = SYSTEM_TABS.find((t) => t.id === tab) ?? visibleTabs[0];
  const allowedTab = visibleTabs.some((t) => t.id === tab);
  const fallbackPath = visibleTabs[0]?.path ?? '/';

  useEffect(() => {
    if (!allowedTab && visibleTabs.length > 0) {
      navigate(fallbackPath, { replace: true });
    }
  }, [allowedTab, fallbackPath, navigate, visibleTabs.length]);

  if (location.pathname === '/system') {
    return <Navigate to="/system/info" replace />;
  }

  if (!allowedTab) {
    return <Navigate to={fallbackPath} replace />;
  }

  return (
    <Box>
      <PageHeader
        title={activeTabConfig?.title ?? 'System'}
        subtitle={activeTabConfig?.description ?? 'Device administration and maintenance.'}
      />

      {tab === 'info' && <SystemInfoPanel />}
      {tab === 'users' && <UsersPanel />}
      {tab === 'backup' && <BackupPanel />}
      {tab === 'firmware' && <FirmwarePanel />}
      {tab === 'actions' && <ActionsPanel />}
      {tab === 'logs' && <LogsPanel />}
    </Box>
  );
}
