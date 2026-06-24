function formatBytes(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)} GB`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)} MB`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)} KB`;
  return `${n} B`;
}

import { Card, CardContent, Typography, Grid, Box } from '@mui/material';
import type { WanStatisticsDto } from '@routergui/shared';
import { acsColors } from '../../theme/colors';

function StatBar({ label, value, max, format }: { label: string; value: number; max: number; format?: boolean }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const display = format ? formatBytes(value) : String(value);
  return (
    <Box sx={{ mb: 1.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
        <Typography variant="caption" fontWeight={600}>{display}</Typography>
      </Box>
      <Box sx={{ height: 6, bgcolor: acsColors.bgSecondary, borderRadius: 1 }}>
        <Box sx={{ width: `${pct}%`, height: '100%', bgcolor: acsColors.accent, borderRadius: 1, transition: 'width 0.5s' }} />
      </Box>
    </Box>
  );
}

export function WanStatsPanel({ stats }: { stats: WanStatisticsDto }) {
  const maxBytes = Math.max(stats.rxBytes, stats.txBytes, 1);
  const maxPackets = Math.max(stats.rxPackets, stats.txPackets, 1);

  return (
    <Card>
      <CardContent>
        <Typography variant="subtitle1" fontWeight={700} gutterBottom>WAN Statistics</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <StatBar label="RX Bytes" value={stats.rxBytes} max={maxBytes} format />
            <StatBar label="TX Bytes" value={stats.txBytes} max={maxBytes} format />
            <StatBar label="RX Packets" value={stats.rxPackets} max={maxPackets} />
            <StatBar label="TX Packets" value={stats.txPackets} max={maxPackets} />
          </Grid>
          <Grid item xs={12} md={6}>
            <StatBar label="RX Errors" value={stats.rxErrors} max={100} />
            <StatBar label="TX Errors" value={stats.txErrors} max={100} />
            <StatBar label="RX Drops" value={stats.rxDrops} max={100} />
            <StatBar label="TX Drops" value={stats.txDrops} max={100} />
          </Grid>
        </Grid>
        <Typography variant="caption" color="text.secondary">
          Updated {new Date(stats.updatedAt).toLocaleTimeString()}
        </Typography>
      </CardContent>
    </Card>
  );
}
