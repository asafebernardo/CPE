import { Box, Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CloudIcon from '@mui/icons-material/Cloud';
import WifiIcon from '@mui/icons-material/Wifi';
import DevicesIcon from '@mui/icons-material/Devices';
import MemoryIcon from '@mui/icons-material/Memory';
import NetworkCheckIcon from '@mui/icons-material/NetworkCheck';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import type { OperationalDashboardResponse } from '@routergui/shared';
import { StatusCard } from '../home/StatusCard';
import { InfoCard } from '../home/InfoCard';
import { QuickActions } from '../home/QuickActions';
import { formatUptime } from '../dashboardFormat';

export function DashboardOverviewView({
  data,
  ntp,
  dns,
  onReboot,
}: {
  data: OperationalDashboardResponse;
  ntp: Record<string, unknown>;
  dns: string;
  onReboot: () => void;
}) {
  const navigate = useNavigate();

  const internetOnline = data.internet.status === 'online';
  const wifiOn = data.wifi.status24 === 'active' || data.wifi.status5 === 'active';
  const lanCount = data.topology.lanClientCount;
  const wifiCount = data.topology.wifi24ClientCount + data.topology.wifi5ClientCount;
  const totalDevices = lanCount + wifiCount;

  return (
    <Box>
      {/* Section 1 — Main status */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatusCard
            title="Internet"
            icon={CloudIcon}
            tone={internetOnline ? 'online' : 'offline'}
            statusLabel={internetOnline ? 'Online' : 'Offline'}
            rows={[{ label: 'WAN IP', value: data.wan.ipAddress, strong: true }]}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatusCard
            title="Wi-Fi"
            icon={WifiIcon}
            tone={wifiOn ? 'active' : 'disabled'}
            statusLabel={wifiOn ? 'Active' : 'Off'}
            rows={[
              { label: '2.4 GHz', value: data.wifi.ssid24 },
              { label: '5 GHz', value: data.wifi.ssid5 },
              { label: 'Clients', value: data.wifi.clients24 + data.wifi.clients5 },
            ]}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatusCard
            title="Devices"
            icon={DevicesIcon}
            tone="active"
            statusLabel={`${totalDevices} connected`}
            rows={[
              { label: 'LAN', value: lanCount },
              { label: 'Wi-Fi', value: wifiCount },
            ]}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatusCard
            title="System"
            icon={MemoryIcon}
            tone="active"
            statusLabel="Healthy"
            rows={[
              { label: 'CPU', value: `${data.system.cpuUsage.toFixed(0)}%` },
              { label: 'Memory', value: `${data.system.memoryUsage.toFixed(0)}%` },
              { label: 'Uptime', value: formatUptime(data.system.uptime) },
            ]}
          />
        </Grid>
      </Grid>

      {/* Sections 2, 3, 4 — Network summary, Equipment, System information */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <InfoCard
            title="Connection Summary"
            rows={[
              { label: 'WAN IP', value: data.wan.ipAddress, mono: true },
              { label: 'Gateway', value: data.wan.gateway, mono: true },
              { label: 'DNS', value: dns, mono: true },
              { label: 'LAN IP', value: data.lan.ipAddress, mono: true },
              {
                label: 'DHCP',
                value: data.lan.dhcpEnabled ? 'Enabled' : 'Disabled',
                tone: data.lan.dhcpEnabled ? 'success' : 'warning',
              },
            ]}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <InfoCard
            title="Equipment"
            rows={[
              { label: 'Manufacturer', value: data.device.manufacturer },
              { label: 'Model', value: data.device.modelName },
              { label: 'System', value: data.device.osName },
              { label: 'Firmware', value: data.device.softwareVersion },
              { label: 'Hardware', value: data.device.hardwareVersion },
              { label: 'Serial', value: data.device.serialNumber, mono: true },
            ]}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <InfoCard
            title="System Information"
            rows={[
              { label: 'CPU', value: `${data.system.cpuUsage.toFixed(0)}%` },
              { label: 'Memory', value: `${data.system.memoryUsage.toFixed(0)}%` },
              { label: 'Uptime', value: formatUptime(data.system.uptime) },
              { label: 'Timezone', value: String(ntp.timezone ?? '—') },
              { label: 'NTP Server', value: String(ntp.server ?? '—'), mono: true },
            ]}
          />
        </Grid>
      </Grid>

      {/* Quick actions */}
      <QuickActions
        actions={[
          { label: 'Wi-Fi Settings', icon: WifiIcon, onClick: () => navigate('/wifi/networks') },
          { label: 'Connected Devices', icon: DevicesIcon, onClick: () => navigate('/hosts') },
          { label: 'Diagnostics', icon: NetworkCheckIcon, onClick: () => navigate('/diagnostics/ping') },
          { label: 'Reboot', icon: RestartAltIcon, onClick: onReboot, tone: 'warning' },
        ]}
      />
    </Box>
  );
}
