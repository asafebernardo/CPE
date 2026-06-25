import { useNavigate } from 'react-router-dom';
import { Box, Button, Typography } from '@mui/material';
import type { OperationalDashboardResponse } from '@aerobrry/shared';
import { OsPanel } from '../design';
import { acsColors } from '../../theme/colors';
import { AlertStrip } from './AlertStrip';
import type { OsAlert } from './useSmartAlerts';
import { useCapabilitiesStore } from '../capabilities/capabilitiesStore';

interface OperationalSidebarProps {
  data: OperationalDashboardResponse;
  health: number;
  alerts: OsAlert[];
}

export function OperationalSidebar({ data, health, alerts }: OperationalSidebarProps) {
  const navigate = useNavigate();
  const hasMesh = useCapabilitiesStore((s) => s.hasCapability('mesh'));
  const wifiClients = data.topology.wifi24ClientCount + data.topology.wifi5ClientCount;

  const wifiQuality =
    wifiClients === 0 ? 'No clients' : wifiClients <= 8 ? 'Good coverage' : wifiClients <= 20 ? 'Moderate load' : 'High density';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
      <OsPanel layer={2} sx={{ p: 1.25 }}>
        <Typography
          variant="caption"
          sx={{ color: acsColors.textMuted, fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}
        >
          Status summary
        </Typography>
        <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          <Row label="Health score" value={`${Math.round(health)} / 100`} />
          <Row label="Internet" value={data.internet.status === 'online' ? 'Online' : 'Offline'} warn={data.internet.status !== 'online'} />
          <Row label="Connected" value={`${data.lan.hostCount} devices`} />
          <Row label="Wi‑Fi quality" value={wifiQuality} />
          {hasMesh && <Row label="Mesh" value="Backhaul active" />}
          {data.acs.configured && (
            <Row label="ACS" value={data.acs.status === 'active' ? 'Session active' : 'Idle'} />
          )}
        </Box>
      </OsPanel>

      {alerts.length > 0 && (
        <OsPanel layer={2} sx={{ p: 1.25 }}>
          <Typography
            variant="caption"
            sx={{ color: acsColors.textMuted, fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase', mb: 0.75, display: 'block' }}
          >
            Active alerts
          </Typography>
          <AlertStrip alerts={alerts} compact />
        </OsPanel>
      )}

      <OsPanel layer={2} sx={{ p: 1.25 }}>
        <Typography
          variant="caption"
          sx={{ color: acsColors.textMuted, fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1 }}
        >
          Quick actions
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          <Button size="small" variant="outlined" onClick={() => navigate('/hosts')} sx={{ justifyContent: 'flex-start', fontSize: '0.75rem' }}>
            View devices
          </Button>
          <Button size="small" variant="outlined" onClick={() => navigate('/wifi/networks')} sx={{ justifyContent: 'flex-start', fontSize: '0.75rem' }}>
            Wireless settings
          </Button>
          <Button size="small" variant="outlined" onClick={() => navigate('/diagnostics/ping')} sx={{ justifyContent: 'flex-start', fontSize: '0.75rem' }}>
            Run diagnostics
          </Button>
        </Box>
      </OsPanel>

      <OsPanel layer={2} sx={{ p: 1.25 }}>
        <Typography
          variant="caption"
          sx={{ color: acsColors.textMuted, fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}
        >
          Wireless bands
        </Typography>
        <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          <Row
            label="2.4 GHz"
            value={data.wifi.status24 === 'active' ? `${data.wifi.ssid24} · ${data.topology.wifi24ClientCount} clients` : 'Disabled'}
          />
          <Row
            label="5 GHz"
            value={data.wifi.status5 === 'active' ? `${data.wifi.ssid5} · ${data.topology.wifi5ClientCount} clients` : 'Disabled'}
          />
        </Box>
      </OsPanel>
    </Box>
  );
}

function Row({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 1 }}>
      <Typography variant="caption" sx={{ color: acsColors.textMuted, fontSize: '0.7rem' }}>
        {label}
      </Typography>
      <Typography
        variant="caption"
        sx={{
          color: warn ? acsColors.warning : acsColors.textPrimary,
          fontWeight: 500,
          fontSize: '0.7rem',
          fontFamily: 'var(--rgos-font-mono)',
          textAlign: 'right',
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}
