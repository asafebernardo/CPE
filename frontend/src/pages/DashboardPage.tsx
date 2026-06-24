import { useEffect, useState } from 'react';
import { Box, Snackbar, Alert } from '@mui/material';
import { PageHeader } from '../components/common/PageHeader';
import { useOperationalStore } from '../stores/operationalStore';
import { useAuthStore } from '../stores/authStore';
import { useUiStore } from '../stores/uiStore';
import { acsColors } from '../theme/colors';
import api from '../services/api';
import type { ConnectedHostExtendedDto, WanDashboardDto } from '@routergui/shared';
import { DashboardOverviewView } from '../components/dashboard/views/DashboardOverviewView';
import { DashboardInternetView } from '../components/dashboard/views/DashboardInternetView';
import { DashboardWifiView } from '../components/dashboard/views/DashboardWifiView';
import { DashboardDevicesView } from '../components/dashboard/views/DashboardDevicesView';
import { DashboardNetworkView } from '../components/dashboard/views/DashboardNetworkView';
import { DASHBOARD_TABS } from '../navigation/dashboardTabs';

interface WlanReadOnly {
  band: string;
  enabled: boolean;
  ssid: string;
  channel: number;
}

export function DashboardPage() {
  const { data, fetch } = useOperationalStore();
  const dashboardTab = useUiStore((s) => s.dashboardTab);
  const role = useAuthStore((s) => s.user?.role ?? 'USER');
  const advancedMode = useUiStore((s) => s.advancedMode);

  const [wan, setWan] = useState<WanDashboardDto | null>(null);
  const [wlans, setWlans] = useState<WlanReadOnly[]>([]);
  const [hosts, setHosts] = useState<ConnectedHostExtendedDto[]>([]);
  const [ntp, setNtp] = useState<Record<string, unknown>>({});
  const [message, setMessage] = useState('');

  const showMac = role === 'TECHNICIAN' || role === 'ADMIN';
  const showNetworkDetails = role === 'TECHNICIAN' || (role === 'ADMIN' && advancedMode);

  const activeTab = dashboardTab === 'network' && !advancedMode ? 'overview' : dashboardTab;
  const tabConfig = DASHBOARD_TABS.find((t) => t.id === activeTab) ?? DASHBOARD_TABS[0];

  useEffect(() => {
    fetch();
    const interval = setInterval(fetch, 15000);
    return () => clearInterval(interval);
  }, [fetch]);

  useEffect(() => {
    if (activeTab === 'overview') {
      api.get('/cpe/ntp').then((res) => setNtp(res.data));
      api.get<WanDashboardDto>('/wan/dashboard').then((res) => setWan(res.data));
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'internet') {
      api.get<WanDashboardDto>('/wan/dashboard').then((res) => setWan(res.data));
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'wifi') {
      api.get<WlanReadOnly[]>('/wlan').then((res) => setWlans(res.data));
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'devices') {
      const load = () => api.get<ConnectedHostExtendedDto[]>('/operational/hosts/extended').then((res) => setHosts(res.data));
      load();
      const interval = setInterval(load, 15000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const reboot = async () => {
    if (!confirm('Reboot the device now?')) return;
    await api.post('/management/reboot');
    showMessage('Reboot initiated');
  };

  if (!data) {
    return <Box sx={{ color: acsColors.textSecondary }}>Loading...</Box>;
  }

  return (
    <Box>
      <PageHeader title={tabConfig.title} subtitle={tabConfig.description} />

      {activeTab === 'overview' && (
        <DashboardOverviewView
          data={data}
          ntp={ntp}
          dns={wan?.config.dns.primary ?? 'Automatic'}
          onReboot={reboot}
        />
      )}
      {activeTab === 'internet' && <DashboardInternetView data={data} wan={wan} />}
      {activeTab === 'wifi' && <DashboardWifiView data={data} wlans={wlans} />}
      {activeTab === 'devices' && <DashboardDevicesView data={data} hosts={hosts} showMac={showMac} />}
      {activeTab === 'network' && (
        <DashboardNetworkView data={data} showNetworkDetails={showNetworkDetails} />
      )}

      <Snackbar
        open={!!message}
        autoHideDuration={3000}
        onClose={() => setMessage('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="success" variant="filled" onClose={() => setMessage('')}>
          {message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
