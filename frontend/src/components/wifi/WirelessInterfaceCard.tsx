import { Box, Card, CardContent, Chip, Grid, Typography, Tooltip, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import HubIcon from '@mui/icons-material/Hub';
import LockIcon from '@mui/icons-material/Lock';
import LanIcon from '@mui/icons-material/Lan';
import DeviceHubIcon from '@mui/icons-material/DeviceHub';
import SensorsIcon from '@mui/icons-material/Sensors';
import {
  WIRELESS_INTERFACE_TYPE_LABELS,
  type WirelessInterfaceDto,
  type WirelessInterfaceType,
} from '@aerobrry/shared';
import { acsColors } from '../../theme/colors';

const TYPE_COLORS: Record<WirelessInterfaceType, string> = {
  primary: acsColors.accent,
  secondary: '#60a5fa',
  guest: '#A78BFA',
  mesh_backhaul: '#34D399',
  iot: acsColors.warning,
};

export function WirelessInterfaceCard({
  iface,
  bandSteeringEnabled,
  onEdit,
  onDelete,
}: {
  iface: WirelessInterfaceDto;
  bandSteeringEnabled?: boolean;
  onEdit?: (iface: WirelessInterfaceDto) => void;
  onDelete?: (iface: WirelessInterfaceDto) => void;
}) {
  const typeColor = TYPE_COLORS[iface.interfaceType];
  const isMesh = iface.interfaceType === 'mesh_backhaul';
  const isGuest = iface.interfaceType === 'guest';

  return (
    <Card
      sx={{
        bgcolor: acsColors.bgCard,
        border: `1px solid ${acsColors.border}`,
        borderRadius: 2,
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          borderColor: 'rgba(56,189,248,0.35)',
          boxShadow: '0 0 24px rgba(56,189,248,0.08)',
        },
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1.5 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap', mb: 0.5 }}>
              <Typography variant="subtitle2" fontWeight={700} noWrap>
                {iface.name}
              </Typography>
              {iface.interfaceType === 'primary' && (
                <Chip
                  size="small"
                  label="Main"
                  sx={{
                    height: 20,
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    bgcolor: acsColors.accentSoft,
                    color: acsColors.accent,
                  }}
                />
              )}
              {iface.interfaceType !== 'primary' && (
                <Chip
                  size="small"
                  label={WIRELESS_INTERFACE_TYPE_LABELS[iface.interfaceType]}
                  sx={{
                    height: 20,
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    bgcolor: `${typeColor}22`,
                    color: typeColor,
                  }}
                />
              )}
              <Chip
                size="small"
                label={iface.interfaceId}
                sx={{ height: 20, fontSize: '0.65rem', bgcolor: acsColors.bgInput, color: acsColors.textMuted }}
              />
              {iface.enabled ? (
                <Chip size="small" label="On" sx={{ height: 20, fontSize: '0.65rem', bgcolor: acsColors.successSoft, color: acsColors.success, fontWeight: 600 }} />
              ) : (
                <Chip size="small" label="Off" sx={{ height: 20, fontSize: '0.65rem', bgcolor: acsColors.mutedSoft, color: acsColors.textMuted }} />
              )}
            </Box>

            {isMesh ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: acsColors.textSecondary }}>
                <VisibilityOffIcon sx={{ fontSize: 14 }} />
                <Typography variant="caption">Hidden Interface · Reserved Mesh Interface</Typography>
              </Box>
            ) : (
              <Typography variant="body2" sx={{ fontFamily: 'monospace', color: acsColors.textSecondary }}>
                {iface.ssid}
              </Typography>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 0.25 }}>
            {onEdit && (
              <Tooltip title="Edit">
                <IconButton size="small" onClick={() => onEdit(iface)}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {onDelete && isGuest && (
              <Tooltip title="Delete">
                <IconButton size="small" onClick={() => onDelete(iface)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        <Grid container spacing={1} sx={{ mb: 1 }}>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">Band</Typography>
            <Typography variant="body2" fontWeight={600}>{iface.band} GHz</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">Channel</Typography>
            <Typography variant="body2" fontWeight={600}>{iface.channel} · {iface.channelWidth}</Typography>
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
          {isGuest && iface.isolated && (
            <Chip size="small" icon={<LockIcon sx={{ fontSize: '0.85rem !important' }} />} label="Isolated" sx={{ height: 22, fontSize: '0.68rem' }} />
          )}
          {isGuest && iface.vlanId != null && (
            <Chip size="small" icon={<LanIcon sx={{ fontSize: '0.85rem !important' }} />} label={`VLAN ${iface.vlanId}`} sx={{ height: 22, fontSize: '0.68rem' }} />
          )}
          {isGuest && iface.captivePortal && (
            <Chip size="small" label="Captive Portal" sx={{ height: 22, fontSize: '0.68rem' }} />
          )}
          {isMesh && iface.backhaulMode && (
            <Chip size="small" icon={<HubIcon sx={{ fontSize: '0.85rem !important' }} />} label={iface.backhaulMode} sx={{ height: 22, fontSize: '0.68rem' }} />
          )}
          {isMesh && iface.linkQuality != null && (
            <Chip
              size="small"
              icon={<SensorsIcon sx={{ fontSize: '0.85rem !important' }} />}
              label={`Link ${iface.linkQuality}%`}
              sx={{ height: 22, fontSize: '0.68rem', color: acsColors.success }}
            />
          )}
          {iface.interfaceType === 'primary' && bandSteeringEnabled && iface.bandSteeringEligible && iface.enabled && (
            <Chip size="small" icon={<DeviceHubIcon sx={{ fontSize: '0.85rem !important' }} />} label="Band Steering" sx={{ height: 22, fontSize: '0.68rem', color: acsColors.accent }} />
          )}
        </Box>

        {iface.bandSteeringWarning && (
          <Chip
            size="small"
            label={iface.bandSteeringWarning}
            sx={{
              height: 22,
              fontSize: '0.68rem',
              bgcolor: 'rgba(245,158,11,0.12)',
              color: acsColors.warning,
              fontWeight: 600,
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}

export function WirelessSectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2 }}>
      <Box sx={{ flex: 1 }}>
        <Typography variant="subtitle1" fontWeight={700}>{title}</Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">{subtitle}</Typography>
        )}
      </Box>
      {action}
    </Box>
  );
}
