import { useEffect, useState } from 'react';
import { Box, Typography, Button, TextField, Grid, Switch, FormControlLabel, Tabs, Tab } from '@mui/material';
import api from '../services/api';
import { FormSection } from '../components/common/FormSection';
import { DataTable } from '../components/common/DataTable';

export function NetworkAdvancedPage() {
  const [tab, setTab] = useState(0);
  const [ipv6, setIpv6] = useState({ wanEnabled: false, wanMode: 'auto', lanEnabled: true, lanPrefix: 'fd00::/64', dhcpv6Enabled: true });
  const [guest, setGuest] = useState({ enabled: false, ssid: 'RGX-Guest', password: '', security: 'WPA2', isolation: true, band: '2.4' });
  const [routes, setRoutes] = useState<Array<Record<string, unknown>>>([]);
  const [reservations, setReservations] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    api.get('/cpe/ipv6').then((res) => setIpv6(res.data));
    api.get('/cpe/guest-wifi').then((res) => setGuest(res.data));
    api.get('/cpe/routes').then((res) => setRoutes(res.data));
    api.get('/cpe/dhcp/reservations').then((res) => setReservations(res.data));
  }, []);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Network Advanced</Typography>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="IPv6" />
        <Tab label="Guest Wi-Fi" />
        <Tab label="Static Routes" />
        <Tab label="DHCP Reservations" />
      </Tabs>

      {tab === 0 && (
        <FormSection title="IPv6">
          <Grid container spacing={2}>
            <Grid item xs={12}><FormControlLabel control={<Switch checked={ipv6.wanEnabled} onChange={(e) => setIpv6({ ...ipv6, wanEnabled: e.target.checked })} />} label="WAN IPv6 Enabled" /></Grid>
            <Grid item xs={6}><TextField fullWidth label="WAN Mode" value={ipv6.wanMode} onChange={(e) => setIpv6({ ...ipv6, wanMode: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="LAN Prefix" value={ipv6.lanPrefix} onChange={(e) => setIpv6({ ...ipv6, lanPrefix: e.target.value })} /></Grid>
          </Grid>
          <Button sx={{ mt: 2 }} variant="contained" onClick={() => api.put('/cpe/ipv6', ipv6)}>Save IPv6</Button>
        </FormSection>
      )}

      {tab === 1 && (
        <FormSection title="Guest Network">
          <Grid container spacing={2}>
            <Grid item xs={12}><FormControlLabel control={<Switch checked={guest.enabled} onChange={(e) => setGuest({ ...guest, enabled: e.target.checked })} />} label="Enable Guest Wi-Fi" /></Grid>
            <Grid item xs={6}><TextField fullWidth label="SSID" value={guest.ssid} onChange={(e) => setGuest({ ...guest, ssid: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Password" type="password" value={guest.password} onChange={(e) => setGuest({ ...guest, password: e.target.value })} /></Grid>
          </Grid>
          <Button sx={{ mt: 2 }} variant="contained" onClick={() => api.put('/cpe/guest-wifi', guest)}>Save Guest Wi-Fi</Button>
        </FormSection>
      )}

      {tab === 2 && (
        <FormSection title="Static Routes">
          <DataTable columns={[{ key: 'dest', label: 'Destination' }, { key: 'mask', label: 'Mask' }, { key: 'gw', label: 'Gateway' }]}
            rows={routes.map((r) => ({ dest: r.destination, mask: r.subnetMask, gw: r.gateway }))} />
        </FormSection>
      )}

      {tab === 3 && (
        <FormSection title="DHCP Reservations">
          <DataTable columns={[{ key: 'hostname', label: 'Hostname' }, { key: 'mac', label: 'MAC' }, { key: 'ip', label: 'IP' }]}
            rows={reservations.map((r) => ({ hostname: r.hostname, mac: r.macAddress, ip: r.ipAddress }))} />
        </FormSection>
      )}
    </Box>
  );
}
