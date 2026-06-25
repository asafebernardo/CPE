import { useEffect, useState } from 'react';
import { Box, Button, Grid, TextField, Typography } from '@mui/material';
import api from '../../services/api';
import { FormSection } from '../common/FormSection';
import { SystemInfoContent } from './SystemInfoContent';
import { PonOpticalSection, PonOnuSection } from './PonInfoSections';
import { useAuthStore } from '../../stores/authStore';
import type { DeviceInfoPanelDto } from '@routergui/shared';

export function SystemInfoPanel() {
  const role = useAuthStore((s) => s.user?.role);
  const [device, setDevice] = useState<DeviceInfoPanelDto | null>(null);
  const [firmware, setFirmware] = useState<Record<string, unknown>>({});
  const [ntp, setNtp] = useState({ server: 'pool.ntp.org', timezone: 'UTC' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get('/operational/dashboard').then((res) => setDevice(res.data.device));
    api.get('/cpe/firmware').then((res) => setFirmware(res.data));
    api.get('/cpe/ntp').then((res) => setNtp(res.data));
  }, []);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const saveNtp = async () => {
    await api.put('/cpe/ntp', ntp);
    showMessage('NTP settings saved');
  };

  if (!device) {
    return <Typography variant="body2" color="text.secondary">Loading system information...</Typography>;
  }

  return (
    <Box>
      <SystemInfoContent device={device} firmware={firmware} ntp={ntp} message={message} />
      <FormSection title="NTP / Time">
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="NTP Server"
              value={ntp.server}
              onChange={(e) => setNtp({ ...ntp, server: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Timezone"
              value={ntp.timezone}
              onChange={(e) => setNtp({ ...ntp, timezone: e.target.value })}
            />
          </Grid>
        </Grid>
        <Button sx={{ mt: 2 }} variant="contained" onClick={saveNtp}>Save NTP</Button>
      </FormSection>

      {role === 'ADMIN' && (
        <>
          <PonOpticalSection />
          <PonOnuSection device={device} />
        </>
      )}
    </Box>
  );
}
