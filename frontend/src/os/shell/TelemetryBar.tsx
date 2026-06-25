import {
  AppBar,
  Box,
  IconButton,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
  Badge,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useOperationalStore } from '../../stores/operationalStore';
import { useUiStore } from '../../stores/uiStore';
import { useCapabilitiesStore } from '../capabilities/capabilitiesStore';
import { useSmartAlerts } from '../dashboard/useSmartAlerts';
import { acsColors } from '../../theme/colors';
import { LiveDot } from '../design';
import { PRODUCT_NAME } from '@aerobrry/shared';

function TelemetryItem({
  label,
  value,
  status,
}: {
  label: string;
  value: string;
  status?: 'ok' | 'warn' | 'error' | 'idle';
}) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, px: 1, minWidth: 0 }}>
      {status && <LiveDot status={status} />}
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="caption"
          sx={{ color: acsColors.textMuted, fontSize: '0.6rem', display: 'block', lineHeight: 1.1, letterSpacing: '0.03em' }}
        >
          {label}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: acsColors.textPrimary,
            fontWeight: 600,
            fontSize: '0.72rem',
            fontFamily: 'var(--rgos-font-mono)',
            fontVariantNumeric: 'tabular-nums',
            display: 'block',
            lineHeight: 1.2,
          }}
          noWrap
        >
          {value}
        </Typography>
      </Box>
    </Box>
  );
}

function formatThroughput(bytes: number): string {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB/s`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(0)} MB/s`;
  return `${(bytes / 1e3).toFixed(0)} KB/s`;
}

export function TelemetryBar({ onMenuClick }: { onMenuClick?: () => void }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const isCompact = useMediaQuery(theme.breakpoints.down('md'));
  const data = useOperationalStore((s) => s.data);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const uiMode = useUiStore((s) => s.uiMode);
  const setUiMode = useUiStore((s) => s.setUiMode);
  const hasMesh = useCapabilitiesStore((s) => s.hasCapability('mesh'));
  const ponEnabled = useCapabilitiesStore((s) => s.hasCapability('pon'));
  const alerts = useSmartAlerts(data, ponEnabled);
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);

  const wanOk = data?.internet.status === 'online';
  const wifiClients = (data?.topology.wifi24ClientCount ?? 0) + (data?.topology.wifi5ClientCount ?? 0);
  const lanClients = data?.topology.lanClientCount ?? 0;
  const totalDevices = lanClients + wifiClients;
  const throughput = data ? formatThroughput((data.wan.bytesSent + data.wan.bytesReceived) / 1000) : '—';

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        height: 'var(--rgos-telemetry-height)',
        bgcolor: 'var(--rgos-layer-1)',
        borderBottom: `1px solid ${acsColors.border}`,
      }}
    >
      <Toolbar
        variant="dense"
        disableGutters
        sx={{
          minHeight: 'var(--rgos-telemetry-height)!important',
          px: { xs: 1, md: 1.5 },
          gap: 0.5,
        }}
      >
        {isCompact && onMenuClick && (
          <IconButton size="small" onClick={onMenuClick} sx={{ color: acsColors.textMuted, mr: 0.5 }}>
            <MenuIcon sx={{ fontSize: 18 }} />
          </IconButton>
        )}

        <Typography
          variant="caption"
          fontWeight={700}
          sx={{ color: acsColors.textSecondary, letterSpacing: '0.06em', mr: 1, fontSize: '0.7rem' }}
        >
          {PRODUCT_NAME}
        </Typography>

        <Divider orientation="vertical" flexItem sx={{ borderColor: acsColors.border, my: 1, display: { xs: 'none', sm: 'block' } }} />

        <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, overflow: 'hidden', gap: 0.25 }}>
          <TelemetryItem
            label="WAN"
            value={wanOk ? (data?.wan.ipAddress?.split('.').slice(-2).join('.') ?? 'Online') : 'Offline'}
            status={wanOk ? 'ok' : 'error'}
          />
          {!isMobile && (
            <>
              <TelemetryItem label="Throughput" value={throughput} />
              <TelemetryItem label="Latency" value="12 ms" />
              <TelemetryItem
                label="CPU"
                value={data ? `${Math.round(data.system.cpuUsage)}%` : '—'}
                status={data && data.system.cpuUsage > 80 ? 'warn' : 'ok'}
              />
              <TelemetryItem label="Memory" value={data ? `${Math.round(data.system.memoryUsage)}%` : '—'} />
            </>
          )}
          <TelemetryItem label="Devices" value={String(totalDevices)} status={totalDevices > 0 ? 'ok' : 'idle'} />
          {!isMobile && hasMesh && (
            <TelemetryItem label="Mesh" value="Healthy" status="ok" />
          )}
        </Box>

        <Badge badgeContent={alerts.length} color="warning" invisible={alerts.length === 0} sx={{ mr: 0.5 }}>
          <NotificationsNoneIcon sx={{ fontSize: 18, color: acsColors.textMuted }} />
        </Badge>

        <ToggleButtonGroup
          size="small"
          exclusive
          value={uiMode}
          onChange={(_, v) => v && setUiMode(v)}
          sx={{
            '& .MuiToggleButton-root': {
              py: 0,
              px: 0.75,
              minWidth: 0,
              height: 24,
              fontSize: '0.6rem',
              fontWeight: 600,
              borderColor: acsColors.border,
              color: acsColors.textMuted,
              '&.Mui-selected': {
                bgcolor: 'var(--rgos-layer-3)',
                color: acsColors.textPrimary,
              },
            },
          }}
        >
          <ToggleButton value="standard">Std</ToggleButton>
          <ToggleButton value="advanced">Adv</ToggleButton>
        </ToggleButtonGroup>

        <IconButton size="small" onClick={(e) => setAnchor(e.currentTarget)} sx={{ ml: 0.5 }}>
          <Avatar
            sx={{
              width: 24,
              height: 24,
              bgcolor: 'var(--rgos-layer-3)',
              color: acsColors.textSecondary,
              fontSize: '0.65rem',
              border: `1px solid ${acsColors.border}`,
            }}
          >
            {user?.username?.[0]?.toUpperCase() ?? '?'}
          </Avatar>
        </IconButton>
        <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
          <MenuItem disabled sx={{ fontSize: '0.8125rem' }}>
            {user?.username} · {user?.role}
          </MenuItem>
          <MenuItem
            onClick={() => {
              setAnchor(null);
              logout();
            }}
            sx={{ fontSize: '0.8125rem' }}
          >
            <LogoutIcon fontSize="small" sx={{ mr: 1, opacity: 0.7 }} /> Sign out
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
