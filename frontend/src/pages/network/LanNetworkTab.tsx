import { useEffect, useState } from 'react';
import { Box, TextField, Button, Grid, Switch, FormControlLabel, Alert } from '@mui/material';
import api from '../../services/api';
import { ProfessionalTable } from '../../components/common/ProfessionalTable';
import { FormSection } from '../../components/common/FormSection';
import type { LanConfigDto } from '@routergui/shared';

export function LanNetworkTab() {
  const [config, setConfig] = useState<LanConfigDto>({
    ipAddress: '',
    subnetMask: '',
    dhcpEnabled: true,
    dhcpRangeStart: '',
    dhcpRangeEnd: '',
  });
  const [reservations, setReservations] = useState<Array<Record<string, unknown>>>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get('/lan').then((res) => setConfig(res.data));
    api.get('/cpe/dhcp/reservations').then((res) => setReservations(res.data));
  }, []);

  const handleSave = async () => {
    await api.put('/lan', config);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <Box>
      {saved && <Alert severity="success" sx={{ mb: 2 }}>LAN configuration saved</Alert>}

      <FormSection title="LAN Interface">
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="LAN Address"
              value={config.ipAddress}
              onChange={(e) => setConfig({ ...config, ipAddress: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Subnet Mask"
              value={config.subnetMask}
              onChange={(e) => setConfig({ ...config, subnetMask: e.target.value })}
            />
          </Grid>
        </Grid>
      </FormSection>

      <FormSection title="DHCP Server">
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={config.dhcpEnabled}
                  onChange={(e) => setConfig({ ...config, dhcpEnabled: e.target.checked })}
                />
              }
              label="Enable DHCP Server"
            />
          </Grid>
          {config.dhcpEnabled && (
            <>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Range Start"
                  value={config.dhcpRangeStart}
                  onChange={(e) => setConfig({ ...config, dhcpRangeStart: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Range End"
                  value={config.dhcpRangeEnd}
                  onChange={(e) => setConfig({ ...config, dhcpRangeEnd: e.target.value })}
                />
              </Grid>
            </>
          )}
        </Grid>
      </FormSection>

      <Button variant="contained" onClick={handleSave} sx={{ mb: 3 }}>
        Save LAN Configuration
      </Button>

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
