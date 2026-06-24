import { useEffect, useState } from 'react';
import { Box, Switch, FormControlLabel, Button } from '@mui/material';
import api from '../services/api';
import { PageHeader } from '../components/common/PageHeader';
import { FormSection } from '../components/common/FormSection';

export function UpnpPage() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    api.get('/cpe/upnp').then((res) => setEnabled(res.data.enabled));
  }, []);

  const save = () => api.put('/cpe/upnp', { enabled });

  return (
    <Box>
      <PageHeader title="UPnP" subtitle="Universal Plug and Play NAT traversal." />
      <FormSection title="UPnP Settings">
        <FormControlLabel control={<Switch checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />} label="Enable UPnP" />
        <Button variant="contained" sx={{ mt: 2 }} onClick={save}>Save</Button>
      </FormSection>
    </Box>
  );
}
