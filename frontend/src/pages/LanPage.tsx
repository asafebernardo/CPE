import { useEffect, useState } from 'react';
import { Box, TextField, Button, Grid, Alert } from '@mui/material';
import api from '../services/api';
import { PageHeader } from '../components/common/PageHeader';
import { FormSection } from '../components/common/FormSection';
import type { LanConfigDto } from '@routergui/shared';

export function LanPage() {
  const [config, setConfig] = useState<LanConfigDto>({
    ipAddress: '',
    subnetMask: '',
    dhcpEnabled: true,
    dhcpRangeStart: '',
    dhcpRangeEnd: '',
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get('/lan').then((res) => setConfig(res.data));
  }, []);

  const handleSave = async () => {
    await api.put('/lan', config);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <Box>
      <PageHeader title="LAN" subtitle="Local network IP address and subnet configuration." />
      {saved && <Alert severity="success" sx={{ mb: 2 }}>Configuration saved</Alert>}
      <FormSection title="LAN Interface">
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="LAN Address" value={config.ipAddress} onChange={(e) => setConfig({ ...config, ipAddress: e.target.value })} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Subnet Mask" value={config.subnetMask} onChange={(e) => setConfig({ ...config, subnetMask: e.target.value })} />
          </Grid>
        </Grid>
      </FormSection>
      <Button variant="contained" onClick={handleSave}>Save Configuration</Button>
    </Box>
  );
}
