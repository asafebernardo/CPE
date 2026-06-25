import { useState } from 'react';
import { Box, Grid, Card, CardContent, Typography, Chip, Alert } from '@mui/material';
import WifiIcon from '@mui/icons-material/Wifi';
import type { OperationalDashboardResponse } from '@aerobrry/shared';
import { SubTabs } from '../home/SubTabs';
import { InfoCard } from '../home/InfoCard';
import { acsColors } from '../../../theme/colors';

interface WlanReadOnly {
  band: string;
  enabled: boolean;
  ssid: string;
  channel: number;
}

type WifiSubTab = 'overview' | 'b24' | 'b5' | 'advanced';

const SUB_TABS = [
  { id: 'overview' as const, label: 'Overview' },
  { id: 'b24' as const, label: '2.4 GHz' },
  { id: 'b5' as const, label: '5 GHz' },
  { id: 'advanced' as const, label: 'Advanced' },
];

function BandRadioCard({
  label,
  wlan,
  clients,
  status,
}: {
  label: string;
  wlan?: WlanReadOnly;
  clients: number;
  status: 'active' | 'disabled';
}) {
  if (!wlan) return <InfoCard title={label} rows={[{ label: 'Status', value: 'Not available' }]} />;
  return (
    <InfoCard
      title={`${label} Radio`}
      rows={[
        { label: 'Status', value: wlan.enabled ? 'Enabled' : 'Disabled', tone: wlan.enabled ? 'success' : 'warning' },
        { label: 'SSID', value: wlan.ssid },
        { label: 'Channel', value: wlan.channel },
        { label: 'Bandwidth', value: label === '2.4 GHz' ? '20/40 MHz' : '80 MHz' },
        { label: 'Security', value: 'WPA2-PSK' },
        { label: 'Connected Clients', value: clients },
        { label: 'Radio State', value: status === 'active' ? 'Active' : 'Disabled' },
      ]}
    />
  );
}

export function DashboardWifiView({
  data,
  wlans,
}: {
  data: OperationalDashboardResponse;
  wlans: WlanReadOnly[];
}) {
  const [sub, setSub] = useState<WifiSubTab>('overview');
  const wifiOn = data.wifi.status24 === 'active' || data.wifi.status5 === 'active';
  const wlan24 = wlans.find((w) => w.band === '2.4');
  const wlan5 = wlans.find((w) => w.band === '5');
  const totalClients = data.wifi.clients24 + data.wifi.clients5;

  return (
    <Box>
      <SubTabs tabs={SUB_TABS} value={sub} onChange={setSub} />

      {sub === 'overview' && (
        <Box>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                <WifiIcon sx={{ color: acsColors.accent }} />
                <Typography variant="h6" fontWeight={700}>Wireless</Typography>
                <Chip
                  size="small"
                  label={wifiOn ? 'Active' : 'Off'}
                  sx={{
                    ml: 'auto',
                    bgcolor: wifiOn ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                    color: wifiOn ? acsColors.success : acsColors.warning,
                    fontWeight: 700,
                  }}
                />
              </Box>
            </CardContent>
          </Card>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <InfoCard
                title="2.4 GHz"
                rows={[
                  { label: 'SSID', value: data.wifi.ssid24 },
                  { label: 'Status', value: data.wifi.status24, tone: data.wifi.status24 === 'active' ? 'success' : 'warning' },
                  { label: 'Clients', value: data.wifi.clients24 },
                ]}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <InfoCard
                title="5 GHz"
                rows={[
                  { label: 'SSID', value: data.wifi.ssid5 },
                  { label: 'Status', value: data.wifi.status5, tone: data.wifi.status5 === 'active' ? 'success' : 'warning' },
                  { label: 'Clients', value: data.wifi.clients5 },
                ]}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <InfoCard
                title="Totals"
                rows={[
                  { label: 'Total Clients', value: totalClients },
                  { label: 'Radios Active', value: `${(data.wifi.status24 === 'active' ? 1 : 0) + (data.wifi.status5 === 'active' ? 1 : 0)} / 2` },
                ]}
              />
            </Grid>
          </Grid>
        </Box>
      )}

      {sub === 'b24' && (
        <BandRadioCard label="2.4 GHz" wlan={wlan24} clients={data.wifi.clients24} status={data.wifi.status24} />
      )}

      {sub === 'b5' && (
        <BandRadioCard label="5 GHz" wlan={wlan5} clients={data.wifi.clients5} status={data.wifi.status5} />
      )}

      {sub === 'advanced' && (
        <Box>
          <InfoCard
            title="Advanced Wireless"
            rows={[
              { label: 'WPS', value: 'Disabled', tone: 'warning' },
              { label: 'Band Steering', value: 'Disabled', tone: 'warning' },
              { label: 'Transmit Power', value: '100%' },
            ]}
          />
          <Alert severity="info" sx={{ mt: 2 }}>
            WPS, band steering and transmit power tuning are prepared for a future firmware release.
          </Alert>
        </Box>
      )}

      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
        Read-only view. Use the Wi-Fi menu to change SSID, password or channels.
      </Typography>
    </Box>
  );
}
