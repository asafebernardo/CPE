import { useEffect, useState } from 'react';
import { Box, Typography, Grid, Card, CardContent } from '@mui/material';
import api from '../services/api';
import { FormSection } from '../components/common/FormSection';
import { DataTable } from '../components/common/DataTable';
import type { OpticalInfoDto } from '@routergui/shared';

export function OntPage() {
  const [optical, setOptical] = useState<OpticalInfoDto | null>(null);
  const [voip, setVoip] = useState<Array<Record<string, unknown>>>([]);

  const load = () => {
    api.get('/cpe/optical').then((res) => setOptical(res.data));
    api.get('/cpe/voip').then((res) => setVoip(res.data));
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>ONT / PON Status</Typography>

      {optical && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card><CardContent><Typography color="text.secondary">RX Power</Typography><Typography variant="h5">{optical.rxPowerDbm.toFixed(1)} dBm</Typography></CardContent></Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card><CardContent><Typography color="text.secondary">TX Power</Typography><Typography variant="h5">{optical.txPowerDbm.toFixed(1)} dBm</Typography></CardContent></Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card><CardContent><Typography color="text.secondary">Temperature</Typography><Typography variant="h5">{optical.temperature.toFixed(1)} °C</Typography></CardContent></Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card><CardContent><Typography color="text.secondary">PON Status</Typography><Typography variant="h5">{optical.ponStatus}</Typography></CardContent></Card>
          </Grid>
        </Grid>
      )}

      <FormSection title="VoIP Lines">
        <DataTable
          columns={[{ key: 'line', label: 'Line' }, { key: 'number', label: 'Number' }, { key: 'status', label: 'Status' }]}
          rows={voip.map((v) => ({ line: v.lineId, number: v.number || '—', status: v.status }))}
        />
      </FormSection>
    </Box>
  );
}
