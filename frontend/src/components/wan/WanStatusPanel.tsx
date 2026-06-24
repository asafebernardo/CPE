import { Box, Card, CardContent, Chip, Typography, Grid } from '@mui/material';
import type { WanStatusPanelDto } from '@routergui/shared';
import { acsColors } from '../../theme/colors';

function formatUptime(s: number): string {
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
}

export function WanStatusPanel({ status }: { status: WanStatusPanelDto }) {
  const connected = status.status === 'connected';

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={700}>WAN Status</Typography>
          <Chip
            size="small"
            label={connected ? '● Connected' : '● Disconnected'}
            sx={{
              bgcolor: connected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: connected ? acsColors.success : acsColors.error,
              fontWeight: 700,
            }}
          />
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary">Connection Type</Typography>
            <Typography fontWeight={600}>{status.connectionType}</Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary">Uptime</Typography>
            <Typography fontWeight={600}>{formatUptime(status.uptimeSeconds)}</Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary">Last Reconnect</Typography>
            <Typography fontWeight={600}>
              {status.lastReconnect ? new Date(status.lastReconnect).toLocaleString() : '—'}
            </Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary">Connected Since</Typography>
            <Typography fontWeight={600}>
              {status.connectedSince ? new Date(status.connectedSince).toLocaleString() : '—'}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
