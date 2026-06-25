import { Box, Grid, Chip, Typography } from '@mui/material';
import DevicesIcon from '@mui/icons-material/Devices';
import type { ConnectedHostExtendedDto, OperationalDashboardResponse } from '@routergui/shared';
import { StatusCard } from '../home/StatusCard';
import { ProfessionalTable } from '../../common/ProfessionalTable';
import { getDeviceType } from '../home/deviceType';
import { acsColors } from '../../../theme/colors';

function connectionLabel(host: ConnectedHostExtendedDto): string {
  if (host.band) return `Wi-Fi ${host.band} GHz`;
  if (/wlan|wifi|wireless/i.test(host.interface)) return 'Wi-Fi';
  return 'Ethernet';
}

export function DashboardDevicesView({
  data,
  hosts,
  showMac,
}: {
  data: OperationalDashboardResponse;
  hosts: ConnectedHostExtendedDto[];
  showMac: boolean;
}) {
  const lanCount = data.topology.lanClientCount;
  const wifiCount = data.topology.wifi24ClientCount + data.topology.wifi5ClientCount;

  const columns = [
    {
      key: 'hostname',
      label: 'Device',
      sortable: true,
      render: (r: ConnectedHostExtendedDto) => {
        const type = getDeviceType(r.hostname, r.vendor);
        const Icon = type.icon;
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                borderRadius: 1.5,
                bgcolor: acsColors.accentSoft,
                flexShrink: 0,
              }}
            >
              <Icon sx={{ fontSize: 18, color: acsColors.accent }} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" fontWeight={600} noWrap>{r.hostname}</Typography>
              <Typography variant="caption" sx={{ color: acsColors.textMuted }}>{type.label}</Typography>
            </Box>
          </Box>
        );
      },
    },
    { key: 'ipAddress', label: 'IP Address', sortable: true },
    ...(showMac ? [{ key: 'macAddress', label: 'MAC', sortable: true }] : []),
    {
      key: 'connection',
      label: 'Connection',
      render: (r: ConnectedHostExtendedDto) => (
        <Chip size="small" label={connectionLabel(r)} sx={{ bgcolor: acsColors.bgInput, color: acsColors.textSecondary }} />
      ),
    },
    {
      key: 'signal',
      label: 'Signal',
      render: (r: ConnectedHostExtendedDto) => (
        <Typography variant="body2" sx={{ color: acsColors.textSecondary }}>
          {typeof r.rssi === 'number' ? `${r.rssi} dBm` : '—'}
        </Typography>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (r: ConnectedHostExtendedDto) => {
        const online = r.status === 'online';
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: online ? acsColors.success : acsColors.textMuted }} />
            <Typography variant="body2" sx={{ color: online ? acsColors.success : acsColors.textMuted }}>
              {online ? 'Online' : 'Offline'}
            </Typography>
          </Box>
        );
      },
    },
  ];

  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatusCard
            title="Devices"
            icon={DevicesIcon}
            tone="active"
            statusLabel={`${lanCount + wifiCount} connected`}
            rows={[
              { label: 'LAN', value: lanCount },
              { label: 'Wi-Fi', value: wifiCount },
            ]}
          />
        </Grid>
      </Grid>

      <ProfessionalTable<ConnectedHostExtendedDto>
        columns={columns}
        rows={hosts}
        searchKeys={showMac ? ['hostname', 'ipAddress', 'macAddress'] : ['hostname', 'ipAddress']}
        searchPlaceholder="Search devices..."
      />
      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
        {hosts.length} device(s) on the network.
      </Typography>
    </Box>
  );
}
