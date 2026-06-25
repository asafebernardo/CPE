import { useEffect, useState } from 'react';
import { Grid, Card, CardContent, Typography } from '@mui/material';
import api from '../../services/api';
import { FormSection } from '../common/FormSection';
import type { DeviceInfoPanelDto } from '@routergui/shared';
import { acsColors } from '../../theme/colors';

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Grid item xs={12} sm={6} md={4}>
      <Card variant="outlined">
        <CardContent>
          <Typography color="text.secondary" variant="body2">{label}</Typography>
          <Typography variant="h6" sx={{ color: acsColors.accent, fontWeight: 700 }}>{value}</Typography>
        </CardContent>
      </Card>
    </Grid>
  );
}

export function PonOpticalSection() {
  const [pon, setPon] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    const load = () => api.get('/operational/pon/status').then((res) => setPon(res.data));
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

  if (!pon) return null;

  const metrics = [
    { label: 'PON Status', value: String(pon.ponStatus) },
    { label: 'Optical RX', value: `${Number(pon.opticalRx).toFixed(2)} dBm` },
    { label: 'Optical TX', value: `${Number(pon.opticalTx).toFixed(2)} dBm` },
    { label: 'Distance', value: `${pon.distance} m` },
    { label: 'Temperature', value: `${Number(pon.temperature).toFixed(1)} °C` },
    { label: 'Voltage', value: `${pon.voltage} V` },
  ];

  return (
    <FormSection title="Optical Status">
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        PON link optical levels and transceiver health.
      </Typography>
      <Grid container spacing={2}>
        {metrics.map((m) => (
          <MetricCard key={m.label} label={m.label} value={m.value} />
        ))}
      </Grid>
    </FormSection>
  );
}

export function PonOnuSection({ device }: { device: DeviceInfoPanelDto }) {
  const [pon, setPon] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    api.get('/operational/pon/status').then((res) => setPon(res.data));
  }, []);

  if (!pon) return null;

  const onuFields = [
    { label: 'ONU Serial', value: device.serialNumber },
    { label: 'Hardware Version', value: device.hardwareVersion },
    { label: 'Software Version', value: device.softwareVersion },
    { label: 'OLT Vendor', value: String(pon.oltVendor) },
    { label: 'OLT Model', value: String(pon.oltModel) },
    { label: 'OLT ID', value: String(pon.oltId) },
    { label: 'Registration Status', value: String(pon.ponStatus) },
    { label: 'Optical RX', value: `${Number(pon.opticalRx).toFixed(2)} dBm` },
  ];

  return (
    <FormSection title="ONU Information">
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        OLT association, registration and ONU identity.
      </Typography>
      <Grid container spacing={2}>
        {onuFields.map((f) => (
          <Grid item xs={12} sm={6} md={4} key={f.label}>
            <Card variant="outlined">
              <CardContent>
                <Typography color="text.secondary" variant="body2">{f.label}</Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>{f.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </FormSection>
  );
}
