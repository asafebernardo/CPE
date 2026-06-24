import { useEffect, useState } from 'react';
import { Box, Typography, Button, TextField, Grid, Alert } from '@mui/material';
import api from '../services/api';
import { FormSection } from '../components/common/FormSection';

export function SystemPage() {
  const [ntp, setNtp] = useState({ server: 'pool.ntp.org', timezone: 'UTC' });
  const [firmware, setFirmware] = useState<Record<string, unknown>>({});
  const [upgrading, setUpgrading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get('/cpe/ntp').then((res) => setNtp(res.data));
    api.get('/cpe/firmware').then((res) => setFirmware(res.data));
  }, []);

  const upgrade = async () => {
    setUpgrading(true);
    await api.post('/cpe/firmware/upgrade');
    setMessage('Firmware upgrade started...');
    setTimeout(() => {
      api.get('/cpe/firmware').then((res) => setFirmware(res.data));
      setMessage('Firmware upgraded successfully');
      setUpgrading(false);
    }, 3500);
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>System</Typography>
      {message && <Alert severity="info" sx={{ mb: 2 }}>{message}</Alert>}

      <FormSection title="NTP / Time">
        <Grid container spacing={2}>
          <Grid item xs={6}><TextField fullWidth label="NTP Server" value={ntp.server} onChange={(e) => setNtp({ ...ntp, server: e.target.value })} /></Grid>
          <Grid item xs={6}><TextField fullWidth label="Timezone" value={ntp.timezone} onChange={(e) => setNtp({ ...ntp, timezone: e.target.value })} /></Grid>
        </Grid>
        <Button sx={{ mt: 2 }} variant="contained" onClick={() => api.put('/cpe/ntp', ntp)}>Save NTP</Button>
      </FormSection>

      <FormSection title="Firmware">
        <Typography>Current: {String(firmware.currentVersion)}</Typography>
        <Typography>Status: {String(firmware.upgradeStatus)}</Typography>
        <Button sx={{ mt: 2 }} variant="contained" onClick={upgrade} disabled={upgrading}>
          {upgrading ? 'Upgrading...' : 'Upgrade Firmware'}
        </Button>
      </FormSection>
    </Box>
  );
}
