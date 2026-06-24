import { useEffect, useState } from 'react';
import { Box, Grid, Card, CardContent, Typography } from '@mui/material';
import api from '../services/api';
import { PageHeader } from '../components/common/PageHeader';
import { SystemInfoContent } from '../components/system/SystemInfoContent';
import type { DeviceInfoPanelDto } from '@routergui/shared';
import { acsColors } from '../theme/colors';

export function SystemInfoPage() {
  const [device, setDevice] = useState<DeviceInfoPanelDto | null>(null);
  const [firmware, setFirmware] = useState<Record<string, unknown>>({});
  const [ntp, setNtp] = useState<Record<string, unknown>>({});
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

  const reboot = async () => {
    await api.post('/management/reboot');
    showMessage('Reboot initiated');
  };

  const factoryReset = async () => {
    if (!confirm('Are you sure? This will reset all settings.')) return;
    await api.post('/management/factory-reset');
    showMessage('Factory reset completed');
  };

  if (!device) return null;

  return (
    <Box>
      <PageHeader title="System Information" subtitle="Hardware, firmware and runtime details." />
      <SystemInfoContent
        device={device}
        firmware={firmware}
        ntp={ntp}
        message={message}
        onReboot={reboot}
        onFactoryReset={factoryReset}
      />
    </Box>
  );
}

export function PonOpticalPage() {
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
    <Box>
      <PageHeader title="Optical Status" subtitle="PON link optical levels and transceiver health." />
      <Grid container spacing={2}>
        {metrics.map((m) => (
          <Grid item xs={12} sm={6} md={4} key={m.label}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" variant="body2">{m.label}</Typography>
                <Typography variant="h5" sx={{ color: acsColors.accent, fontWeight: 700 }}>{m.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export function PonOnuPage() {
  const [pon, setPon] = useState<Record<string, unknown> | null>(null);
  const [device, setDevice] = useState<DeviceInfoPanelDto | null>(null);

  useEffect(() => {
    api.get('/operational/pon/status').then((res) => setPon(res.data));
    api.get('/operational/dashboard').then((res) => setDevice(res.data.device));
  }, []);

  if (!pon || !device) return null;

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
    <Box>
      <PageHeader title="ONU Information" subtitle="OLT association, registration and ONU identity." />
      <Grid container spacing={2}>
        {onuFields.map((f) => (
          <Grid item xs={12} sm={6} md={4} key={f.label}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" variant="body2">{f.label}</Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>{f.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
