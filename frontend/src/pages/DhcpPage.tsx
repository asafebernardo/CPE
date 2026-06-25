import { useEffect, useState } from 'react';
import { Box, TextField, Button, Grid, Switch, FormControlLabel, Alert } from '@mui/material';
import api from '../services/api';
import { PageHeader } from '../components/common/PageHeader';
import { ProfessionalTable } from '../components/common/ProfessionalTable';
import { FormSection } from '../components/common/FormSection';
import type { LanConfigDto } from '@aerobrry/shared';

export function DhcpPage() {
  const [lan, setLan] = useState<LanConfigDto>({
    ipAddress: '',
    subnetMask: '',
    dhcpEnabled: true,
    dhcpRangeStart: '',
    dhcpRangeEnd: '',
  });
  const [reservations, setReservations] = useState<Array<Record<string, unknown>>>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get('/lan').then((res) => setLan(res.data));
    api.get('/cpe/dhcp/reservations').then((res) => setReservations(res.data));
  }, []);

  const saveDhcp = async () => {
    await api.put('/lan', lan);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <Box>
      <PageHeader title="DHCP" subtitle="DHCP server pool and static MAC reservations." />
      {saved && <Alert severity="success" sx={{ mb: 2 }}>DHCP settings saved</Alert>}
      <FormSection title="DHCP Server">
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControlLabel
              control={<Switch checked={lan.dhcpEnabled} onChange={(e) => setLan({ ...lan, dhcpEnabled: e.target.checked })} />}
              label="Enable DHCP Server"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="LAN IP" value={lan.ipAddress} disabled />
          </Grid>
          {lan.dhcpEnabled && (
            <>
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="Range Start" value={lan.dhcpRangeStart} onChange={(e) => setLan({ ...lan, dhcpRangeStart: e.target.value })} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="Range End" value={lan.dhcpRangeEnd} onChange={(e) => setLan({ ...lan, dhcpRangeEnd: e.target.value })} />
              </Grid>
            </>
          )}
        </Grid>
        <Button variant="contained" sx={{ mt: 2 }} onClick={saveDhcp}>Save DHCP Settings</Button>
      </FormSection>
      <FormSection title="Static Reservations">
        <ProfessionalTable
          columns={[
            { key: 'hostname', label: 'Hostname', sortable: true },
            { key: 'macAddress', label: 'MAC', sortable: true },
            { key: 'ipAddress', label: 'IP', sortable: true },
          ]}
          rows={reservations}
          searchKeys={['hostname', 'macAddress', 'ipAddress']}
          searchPlaceholder="Search reservations..."
        />
      </FormSection>
    </Box>
  );
}
