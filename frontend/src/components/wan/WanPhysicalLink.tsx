import { Card, CardContent, Typography, Grid } from '@mui/material';
import type { WanPhysicalLinkDto } from '@routergui/shared';
import { acsColors } from '../../theme/colors';

export function WanPhysicalLink({ link }: { link: WanPhysicalLinkDto }) {
  const connected = link.linkStatus === 'connected';

  return (
    <Card>
      <CardContent>
        <Typography variant="subtitle1" fontWeight={700} gutterBottom>Physical Link</Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary">Interface</Typography>
            <Typography fontWeight={600}>{link.interface}</Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary">Link Status</Typography>
            <Typography fontWeight={600} sx={{ color: connected ? acsColors.success : acsColors.error }}>
              {connected ? 'Connected' : 'Disconnected'}
            </Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary">Speed</Typography>
            <Typography fontWeight={600}>{link.speedMbps} Mbps</Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary">Duplex</Typography>
            <Typography fontWeight={600}>{link.duplex} Duplex</Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
