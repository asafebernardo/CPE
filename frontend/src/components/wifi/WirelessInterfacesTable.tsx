import {
  Box, Chip, IconButton, Paper, Switch, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Tooltip, Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  WIRELESS_INTERFACE_TYPE_LABELS,
  getWifiSecurityMode,
  type WirelessBand,
  type WirelessInterfaceDto,
} from '@routergui/shared';
import { acsColors } from '../../theme/colors';

const TYPE_COLORS: Record<WirelessInterfaceDto['interfaceType'], string> = {
  primary: acsColors.accent,
  secondary: '#60a5fa',
  guest: '#A78BFA',
  mesh_backhaul: '#34D399',
  iot: acsColors.warning,
};

const BAND_STYLES: Record<WirelessBand, { label: string; bg: string; color: string }> = {
  '2.4': { label: '2.4 GHz', bg: 'rgba(56,189,248,0.15)', color: '#38bdf8' },
  '5': { label: '5 GHz', bg: 'rgba(167,139,250,0.15)', color: '#a78bfa' },
  '6': { label: '6 GHz', bg: 'rgba(52,211,153,0.15)', color: '#34d399' },
};

export function WirelessBandChip({ band }: { band: WirelessBand }) {
  const style = BAND_STYLES[band];
  return (
    <Chip
      size="small"
      label={style.label}
      sx={{
        height: 22,
        fontSize: '0.7rem',
        fontWeight: 700,
        bgcolor: style.bg,
        color: style.color,
      }}
    />
  );
}

function StatusCell({ iface }: { iface: WirelessInterfaceDto }) {
  const isMesh = iface.interfaceType === 'mesh_backhaul';
  const online = iface.enabled && (isMesh ? iface.linkStatus === 'connected' : true);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
      <Box
        sx={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          bgcolor: online ? acsColors.success : acsColors.textMuted,
        }}
      />
      <Typography variant="body2" sx={{ color: online ? acsColors.success : acsColors.textMuted }}>
        {iface.enabled ? (online ? 'Up' : 'Down') : 'Disabled'}
      </Typography>
    </Box>
  );
}

export function WirelessInterfacesTable({
  interfaces,
  scope,
  bandSteeringEnabled = false,
  clients24 = 0,
  clients5 = 0,
  togglingId = null,
  hideRadioColumn = false,
  onEdit,
  onDelete,
  onToggleEnabled,
}: {
  interfaces: WirelessInterfaceDto[];
  scope: 'home' | 'guest' | 'mesh';
  bandSteeringEnabled?: boolean;
  clients24?: number;
  clients5?: number;
  togglingId?: string | null;
  hideRadioColumn?: boolean;
  onEdit?: (iface: WirelessInterfaceDto) => void;
  onDelete?: (iface: WirelessInterfaceDto) => void;
  onToggleEnabled?: (iface: WirelessInterfaceDto, enabled: boolean) => void;
}) {
  const sorted = [...interfaces].sort((a, b) => {
    const bandOrder = { '2.4': 0, '5': 1, '6': 2 };
    const typeOrder: Partial<Record<WirelessInterfaceDto['interfaceType'], number>> = { primary: 0, secondary: 1 };
    if (bandOrder[a.band] !== bandOrder[b.band]) return bandOrder[a.band] - bandOrder[b.band];
    if (scope === 'home') {
      const ta = typeOrder[a.interfaceType] ?? 9;
      const tb = typeOrder[b.interfaceType] ?? 9;
      if (ta !== tb) return ta - tb;
    }
    return a.interfaceId.localeCompare(b.interfaceId);
  });

  const homeHeaders = ['Radio', 'Name', 'SSID', 'Security', 'Channel', 'Clients', 'Band Steering', 'Enabled', 'Status', ''];
  const guestHeaders = ['Radio', 'Name', 'SSID', 'VLAN', 'Security', 'Channel', 'Enabled', 'Status', ''];
  const meshHeaders = ['Radio', 'Name', 'Interface', 'Backhaul', 'Channel', 'Link', 'Enabled', 'Status', ''];

  const baseHeaders = scope === 'home' ? homeHeaders : scope === 'guest' ? guestHeaders : meshHeaders;
  const headers = hideRadioColumn ? baseHeaders.filter((h) => h !== 'Radio') : baseHeaders;

  return (
    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, border: `1px solid ${acsColors.border}` }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {headers.map((h) => (
              <TableCell key={h} sx={{ bgcolor: acsColors.bgSecondary, fontWeight: 600 }}>{h}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {sorted.length === 0 && (
            <TableRow>
              <TableCell colSpan={headers.length}>
                <Typography variant="body2" color="text.secondary">No interfaces configured.</Typography>
              </TableCell>
            </TableRow>
          )}
          {sorted.map((iface) => {
            const securityLabel = getWifiSecurityMode(iface.security)?.label ?? iface.security;
            const toggleLocked = iface.interfaceType === 'primary' && bandSteeringEnabled;
            const clients = iface.interfaceType === 'primary'
              ? (iface.band === '2.4' ? clients24 : iface.band === '5' ? clients5 : 0)
              : null;

            return (
              <TableRow key={iface.id} hover>
                {!hideRadioColumn && (
                  <TableCell>
                    <WirelessBandChip band={iface.band} />
                  </TableCell>
                )}

                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                    <Typography variant="body2" fontWeight={600}>{iface.name}</Typography>
                    {scope === 'home' && iface.interfaceType === 'primary' && (
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
                    {scope !== 'home' && (
                      <Chip
                        size="small"
                        label={WIRELESS_INTERFACE_TYPE_LABELS[iface.interfaceType]}
                        sx={{
                          height: 20,
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          bgcolor: `${TYPE_COLORS[iface.interfaceType]}22`,
                          color: TYPE_COLORS[iface.interfaceType],
                        }}
                      />
                    )}
                  </Box>
                </TableCell>

                {scope === 'home' && (
                  <>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{iface.ssid}</TableCell>
                    <TableCell>{securityLabel}</TableCell>
                    <TableCell>{iface.channel} · {iface.channelWidth}</TableCell>
                    <TableCell>{clients ?? '—'}</TableCell>
                    <TableCell>
                      {bandSteeringEnabled && iface.bandSteeringEligible && iface.enabled ? (
                        <Chip size="small" label="Active" sx={{ height: 22, fontSize: '0.68rem', bgcolor: acsColors.accentSoft, color: acsColors.accent, fontWeight: 600 }} />
                      ) : bandSteeringEnabled && iface.bandSteeringEligible && !iface.enabled ? (
                        <Tooltip title="Enable this main interface to participate in Band Steering">
                          <Chip
                            size="small"
                            label="Inactive"
                            sx={{ height: 22, fontSize: '0.68rem', bgcolor: acsColors.mutedSoft, color: acsColors.textMuted, fontWeight: 600 }}
                          />
                        </Tooltip>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                  </>
                )}

                {scope === 'guest' && (
                  <>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{iface.ssid}</TableCell>
                    <TableCell>{iface.vlanId ?? '—'}</TableCell>
                    <TableCell>{securityLabel}</TableCell>
                    <TableCell>{iface.channel} · {iface.channelWidth}</TableCell>
                  </>
                )}

                {scope === 'mesh' && (
                  <>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{iface.interfaceId}</Typography>
                      {iface.hidden && (
                        <Typography variant="caption" color="text.secondary">Hidden</Typography>
                      )}
                    </TableCell>
                    <TableCell>{iface.backhaulMode ?? '—'}</TableCell>
                    <TableCell>{iface.channel} · {iface.channelWidth}</TableCell>
                    <TableCell>
                      {iface.linkQuality != null ? `${iface.linkQuality}%` : '—'}
                    </TableCell>
                  </>
                )}

                <TableCell>
                  <Tooltip title={toggleLocked ? 'Radios stay on while Band Steering is enabled' : iface.enabled ? 'Disable' : 'Enable'}>
                    <span>
                      <Switch
                        size="small"
                        checked={iface.enabled}
                        disabled={togglingId === iface.id || toggleLocked}
                        onChange={(e) => onToggleEnabled?.(iface, e.target.checked)}
                      />
                    </span>
                  </Tooltip>
                </TableCell>
                <TableCell><StatusCell iface={iface} /></TableCell>
                <TableCell align="right">
                  {onEdit && (
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => onEdit(iface)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  {onDelete && iface.interfaceType === 'guest' && (
                    <Tooltip title="Delete">
                      <IconButton size="small" onClick={() => onDelete(iface)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
