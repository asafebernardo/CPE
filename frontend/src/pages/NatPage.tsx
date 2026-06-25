import { useEffect, useState } from 'react';
import { Box, Button, Grid, TextField, Switch, FormControlLabel, Alert } from '@mui/material';
import api from '../services/api';
import { PageHeader } from '../components/common/PageHeader';
import { FormSection } from '../components/common/FormSection';
import type { DmzConfigDto } from '@aerobrry/shared';

export function NatPage() {
  const [dmz, setDmz] = useState<DmzConfigDto>({ enabled: false, hostIp: '' });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get('/firewall/dmz').then((res) => setDmz(res.data));
  }, []);

  const saveDmz = async () => {
    await api.put('/firewall/dmz', dmz);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <Box>
      <PageHeader title="NAT" subtitle="DMZ and NAT passthrough configuration." />
      {saved && <Alert severity="success" sx={{ mb: 2 }}>DMZ configuration saved</Alert>}
      <FormSection title="DMZ Host">
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControlLabel
              control={<Switch checked={dmz.enabled} onChange={(e) => setDmz({ ...dmz, enabled: e.target.checked })} />}
              label="Enable DMZ"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="DMZ Host IP"
              value={dmz.hostIp}
              onChange={(e) => setDmz({ ...dmz, hostIp: e.target.value })}
              disabled={!dmz.enabled}
            />
          </Grid>
        </Grid>
        <Button variant="contained" sx={{ mt: 2 }} onClick={saveDmz}>Save DMZ</Button>
      </FormSection>
    </Box>
  );
}
