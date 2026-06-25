import { Card, CardContent, Typography, Grid } from '@mui/material';
import type { WanQualityDto } from '@aerobrry/shared';
import { acsColors } from '../../theme/colors';

export function WanQualityPanel({ quality }: { quality: WanQualityDto }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="subtitle1" fontWeight={700} gutterBottom>Connection Quality</Typography>
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <Typography variant="caption" color="text.secondary">Latency</Typography>
            <Typography variant="h5" sx={{ color: acsColors.accent, fontWeight: 700 }}>{quality.latencyMs.toFixed(1)} ms</Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="caption" color="text.secondary">Jitter</Typography>
            <Typography variant="h5" sx={{ color: acsColors.accent, fontWeight: 700 }}>{quality.jitterMs.toFixed(1)} ms</Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="caption" color="text.secondary">Packet Loss</Typography>
            <Typography variant="h5" sx={{ color: acsColors.accent, fontWeight: 700 }}>{quality.packetLossPercent.toFixed(2)}%</Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
