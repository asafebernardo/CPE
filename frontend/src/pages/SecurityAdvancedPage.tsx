import { useEffect, useState } from 'react';
import { Box, Button, TextField, Grid, Switch, FormControlLabel, Tabs, Tab } from '@mui/material';
import api from '../services/api';
import { PageHeader } from '../components/common/PageHeader';
import { FormSection } from '../components/common/FormSection';
import { DataTable } from '../components/common/DataTable';

export function SecurityAdvancedPage() {
  const [tab, setTab] = useState(0);
  const [vpn, setVpn] = useState({ type: 'OpenVPN', server: '', username: '', password: '', enabled: false });
  const [qos, setQos] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    api.get('/cpe/vpn').then((res) => setVpn(res.data));
    api.get('/cpe/qos').then((res) => setQos(res.data));
  }, []);

  return (
    <Box>
      <PageHeader title="QoS / VPN" subtitle="Traffic prioritization and VPN client settings." />
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="QoS" />
        <Tab label="VPN" />
      </Tabs>

      {tab === 0 && (
        <FormSection title="QoS Rules">
          <DataTable
            columns={[
              { key: 'name', label: 'Name' },
              { key: 'priority', label: 'Priority' },
              { key: 'protocol', label: 'Protocol' },
              { key: 'port', label: 'Port' },
            ]}
            rows={qos.map((q) => ({
              name: q.name,
              priority: q.priority,
              protocol: q.protocol,
              port: q.destPort,
            }))}
          />
        </FormSection>
      )}

      {tab === 1 && (
        <FormSection title="VPN Client">
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControlLabel
                control={<Switch checked={vpn.enabled} onChange={(e) => setVpn({ ...vpn, enabled: e.target.checked })} />}
                label="Enable VPN"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Type" value={vpn.type} onChange={(e) => setVpn({ ...vpn, type: e.target.value })} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Server" value={vpn.server} onChange={(e) => setVpn({ ...vpn, server: e.target.value })} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Username" value={vpn.username} onChange={(e) => setVpn({ ...vpn, username: e.target.value })} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Password" type="password" value={vpn.password} onChange={(e) => setVpn({ ...vpn, password: e.target.value })} />
            </Grid>
          </Grid>
          <Button sx={{ mt: 2 }} variant="contained" onClick={() => api.put('/cpe/vpn', vpn)}>Save VPN</Button>
        </FormSection>
      )}
    </Box>
  );
}
