import { Card, CardContent, Typography, Grid } from '@mui/material';
import type { WanAcsConnectivityDto } from '@routergui/shared';
import { acsColors } from '../../theme/colors';

export function WanAcsPanel({ acs }: { acs: WanAcsConnectivityDto }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="subtitle1" fontWeight={700} gutterBottom>ACS Connectivity</Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary">ACS Reachable</Typography>
            <Typography fontWeight={600} sx={{ color: acs.reachable ? acsColors.success : acsColors.warning }}>
              {acs.reachable ? 'Yes' : 'No'}
            </Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary">Connection Status</Typography>
            <Typography fontWeight={600}>{acs.connectionStatus}</Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary">Last Inform</Typography>
            <Typography fontWeight={600}>{acs.lastInform ? new Date(acs.lastInform).toLocaleString() : 'Never'}</Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary">Next Inform</Typography>
            <Typography fontWeight={600}>{acs.nextInform ? new Date(acs.nextInform).toLocaleString() : '—'}</Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
