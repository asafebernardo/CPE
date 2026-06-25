import { useNavigate } from 'react-router-dom';
import { Box, Button, Typography } from '@mui/material';
import type { OperationalDashboardResponse } from '@aerobrry/shared';
import { OsPanel, OsLayerStack, OsHealthRing, MetricTile } from '../design';
import { LiveTopology } from '../topology/LiveTopology';
import { AlertStrip } from './AlertStrip';
import { OperationalSidebar } from './OperationalSidebar';
import { computeHealthScore, useSmartAlerts } from './useSmartAlerts';
import { Sparkline } from '../../components/dashboard/home/Sparkline';
import { acsColors } from '../../theme/colors';
import { formatUptime } from '../../components/dashboard/dashboardFormat';

function formatRate(bytes: number): string {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(2)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  return `${(bytes / 1e3).toFixed(0)} KB`;
}

export function NocDashboard({ data }: { data: OperationalDashboardResponse }) {
  const navigate = useNavigate();
  const alerts = useSmartAlerts(data, false);
  const health = computeHealthScore(data);
  const graph = data.topology.graph;
  const wifiClients = data.topology.wifi24ClientCount + data.topology.wifi5ClientCount;
  const totalDevices = data.topology.lanClientCount + wifiClients;
  const wanOk = data.internet.status === 'online';

  const insightLayers = [
    {
      id: 'wan',
      label: 'WAN uplink',
      status: wanOk ? ('ok' as const) : ('error' as const),
      metrics: (
        <Typography variant="caption" sx={{ fontFamily: 'var(--rgos-font-mono)', color: acsColors.textSecondary }}>
          {data.wan.connectionType}
        </Typography>
      ),
      detail: `${data.wan.ipAddress || '—'} · GW ${data.wan.gateway || '—'}`,
      onClick: () => navigate('/internet'),
    },
    {
      id: 'lan',
      label: 'LAN segment',
      status: 'ok' as const,
      metrics: (
        <Typography variant="caption" sx={{ fontFamily: 'var(--rgos-font-mono)', color: acsColors.textSecondary }}>
          {data.topology.lanClientCount} hosts
        </Typography>
      ),
      detail: `${data.lan.ipAddress} · DHCP ${data.lan.dhcpEnabled ? 'enabled' : 'off'}`,
      onClick: () => navigate('/hosts'),
    },
    {
      id: 'wifi',
      label: 'Wireless',
      status: data.wifi.status24 === 'active' || data.wifi.status5 === 'active' ? ('ok' as const) : ('idle' as const),
      metrics: (
        <Typography variant="caption" sx={{ fontFamily: 'var(--rgos-font-mono)', color: acsColors.textSecondary }}>
          {wifiClients} clients
        </Typography>
      ),
      detail: `2.4G ${data.wifi.ssid24 || '—'} · 5G ${data.wifi.ssid5 || '—'}`,
      onClick: () => navigate('/wifi/networks'),
    },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, maxWidth: 1440, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
        <Box>
          <Typography
            variant="h5"
            fontWeight={600}
            sx={{ color: acsColors.textPrimary, letterSpacing: '-0.025em', fontSize: { xs: '1.15rem', md: '1.35rem' } }}
          >
            Operations
          </Typography>
          <Typography variant="caption" sx={{ color: acsColors.textMuted, mt: 0.25, display: 'block' }}>
            {data.device.modelName} · {data.device.osName} {data.device.softwareVersion} · Uptime {formatUptime(data.system.uptime)}
          </Typography>
        </Box>
        <OsHealthRing score={health} size={44} />
      </Box>

      {/* Metric strip */}
      <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 0.25 }}>
        <MetricTile
          label="WAN"
          value={wanOk ? 'Connected' : 'Down'}
          sub={data.wan.ipAddress || undefined}
          status={wanOk ? 'ok' : 'error'}
        />
        <MetricTile
          label="Downstream"
          value={formatRate(data.wan.bytesReceived)}
          sub={`↑ ${formatRate(data.wan.bytesSent)}`}
          status="ok"
          mono
        />
        <MetricTile label="Devices" value={String(totalDevices)} sub={`${data.topology.lanClientCount} LAN · ${wifiClients} Wi‑Fi`} status={totalDevices > 0 ? 'ok' : 'idle'} />
        <MetricTile
          label="Wireless"
          value={data.wifi.status5 === 'active' ? 'Dual-band' : data.wifi.status24 === 'active' ? '2.4 GHz' : 'Off'}
          sub={`${wifiClients} associated`}
          status={wifiClients > 0 ? 'ok' : 'idle'}
        />
        <MetricTile
          label="CPU"
          value={`${Math.round(data.system.cpuUsage)}%`}
          status={data.system.cpuUsage > 80 ? 'warn' : 'ok'}
          mono
        />
        <MetricTile label="Memory" value={`${Math.round(data.system.memoryUsage)}%`} mono />
      </Box>

      <AlertStrip alerts={alerts} />

      {/* Workspace: center + right sidebar */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1fr var(--rgos-sidebar-width)' },
          gap: 1.5,
          alignItems: 'start',
        }}
      >
        {/* Center workspace */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, minWidth: 0 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 1.5,
            }}
          >
            {/* Compact topology */}
            <OsPanel layer={2} sx={{ p: 1.25 }}>
              <Typography
                variant="caption"
                sx={{ color: acsColors.textMuted, fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}
              >
                Topology
              </Typography>
              {graph ? (
                <LiveTopology graph={graph} compact height={140} />
              ) : (
                <Typography variant="caption" sx={{ color: acsColors.textMuted, py: 3, display: 'block', textAlign: 'center' }}>
                  No topology data
                </Typography>
              )}
            </OsPanel>

            {/* Traffic + system */}
            <OsPanel layer={2} sx={{ p: 1.25 }}>
              <Typography
                variant="caption"
                sx={{ color: acsColors.textMuted, fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1 }}
              >
                Throughput & load
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 1.5 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" sx={{ color: acsColors.textMuted, fontSize: '0.65rem' }}>CPU</Typography>
                  <Typography sx={{ fontFamily: 'var(--rgos-font-mono)', fontWeight: 600, fontSize: '0.875rem' }}>
                    {Math.round(data.system.cpuUsage)}%
                  </Typography>
                  <Sparkline seed={data.system.cpuUsage} color={acsColors.textSecondary} height={28} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" sx={{ color: acsColors.textMuted, fontSize: '0.65rem' }}>Memory</Typography>
                  <Typography sx={{ fontFamily: 'var(--rgos-font-mono)', fontWeight: 600, fontSize: '0.875rem' }}>
                    {Math.round(data.system.memoryUsage)}%
                  </Typography>
                  <Sparkline seed={data.system.memoryUsage + 20} color={acsColors.success} height={28} />
                </Box>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                <Typography variant="caption" sx={{ color: acsColors.textMuted }}>
                  RX {formatRate(data.wan.bytesReceived)}
                </Typography>
                <Typography variant="caption" sx={{ color: acsColors.textMuted }}>
                  TX {formatRate(data.wan.bytesSent)}
                </Typography>
              </Box>
            </OsPanel>
          </Box>

          <OsLayerStack title="Network segments" layers={insightLayers} />
        </Box>

        {/* Right contextual sidebar */}
        <OperationalSidebar data={data} health={health} alerts={alerts} />
      </Box>
    </Box>
  );
}
