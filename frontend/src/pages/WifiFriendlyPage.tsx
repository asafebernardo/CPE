import { useEffect, useState } from 'react';
import { Box, Grid, Card, CardContent, Typography, TextField, Button, Switch, FormControlLabel, Alert, MenuItem, Chip, Tabs, Tab } from '@mui/material';
import api from '../services/api';
import { PageHeader } from '../components/common/PageHeader';
import { FormSection } from '../components/common/FormSection';
import { DataTable } from '../components/common/DataTable';
import { acsColors } from '../theme/colors';
import { SecuritySelect } from '../components/security/SecuritySelect';
import { ComplianceBadge } from '../components/security/ComplianceBadge';
import { PasswordStrengthMeter } from '../components/security/PasswordStrengthMeter';
import { useSecurityStore } from '../stores/securityStore';
import {
  WIFI_SECURITY_MODES,
  validateWifiPassword,
  validateWifiPasswordPolicy,
  isWifiModeAllowed,
  wifiModeBadge,
  getSecurityProfile,
  normalizeWifiSecurityMode,
  getWifiSecurityMode,
  type BandSteeringConfigDto,
  type WifiNeighborDto,
  type WifiSecurityMode,
} from '@routergui/shared';

interface WlanForm {
  band: string;
  enabled: boolean;
  ssid: string;
  channel: number;
  channelWidth: string;
  security: string;
  password: string;
}

const CHANNEL_WIDTHS_24 = ['20MHz', '40MHz'];
const CHANNEL_WIDTHS_5 = ['20MHz', '40MHz', '80MHz', '160MHz'];

export function WifiFriendlyPage() {
  const [tab, setTab] = useState(0);
  const [wlans, setWlans] = useState<WlanForm[]>([]);
  const [clients24, setClients24] = useState(0);
  const [clients5, setClients5] = useState(0);
  const [saved, setSaved] = useState(false);

  const [steering, setSteering] = useState<BandSteeringConfigDto>({
    enabled: true, rssiThreshold: -70, prefer5G: true, clientSteering: true,
  });
  const [neighbors, setNeighbors] = useState<WifiNeighborDto[]>([]);
  const [scanning, setScanning] = useState(false);
  const [steeringSaved, setSteeringSaved] = useState(false);
  const [saveError, setSaveError] = useState('');

  const securitySettings = useSecurityStore((s) => s.settings);
  const fetchSecurity = useSecurityStore((s) => s.fetchAll);
  const legacyEnabled = securitySettings?.legacyCompatibility ?? false;
  const profile = securitySettings?.securityProfile ?? 'isp-standard';
  const profileMeta = getSecurityProfile(profile);
  const profileLabel = profileMeta.label;
  const allowedModeIds = profileMeta.allowedWifiModes as string[];

  useEffect(() => {
    api.get('/wlan').then((res) => setWlans(
      (res.data as WlanForm[]).map((w) => ({ ...w, security: normalizeWifiSecurityMode(w.security) })),
    ));
    api.get('/operational/dashboard').then((res) => {
      setClients24(res.data.wifi.clients24);
      setClients5(res.data.wifi.clients5);
    });
    api.get('/wifi/band-steering').then((res) => setSteering(res.data));
    api.get('/wifi/neighbors').then((res) => setNeighbors(res.data));
    fetchSecurity();
  }, [fetchSecurity]);

  const wlan24 = wlans.find((w) => w.band === '2.4');
  const wlan5 = wlans.find((w) => w.band === '5');

  const updateBand = (band: string, patch: Partial<WlanForm>) => {
    setWlans((prev) => prev.map((w) => (w.band === band ? { ...w, ...patch } : w)));
  };

  const save = async (band: string) => {
    const w = wlans.find((x) => x.band === band);
    if (!w) return;
    setSaveError('');
    try {
      await api.put(`/wlan/${band}`, w);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setSaveError(msg ?? (e instanceof Error ? e.message : 'Failed to save Wi-Fi settings'));
    }
  };

  const saveSteering = async () => {
    await api.put('/wifi/band-steering', steering);
    setSteeringSaved(true);
    setTimeout(() => setSteeringSaved(false), 3000);
  };

  const scan = async () => {
    setScanning(true);
    try {
      const res = await api.post('/wifi/neighbors/scan');
      setNeighbors(res.data);
    } finally {
      setScanning(false);
    }
  };

  const BandCard = ({ wlan, clients, label }: { wlan?: WlanForm; clients: number; label: string }) => {
    if (!wlan) return null;
    const widths = wlan.band === '5' ? CHANNEL_WIDTHS_5 : CHANNEL_WIDTHS_24;
    const mode = getWifiSecurityMode(wlan.security);
    const requiresKey = mode ? !['none', 'enterprise'].includes(mode.keyRule) : true;
    const pwCheck = validateWifiPassword(wlan.security, wlan.password);
    const policy = requiresKey ? validateWifiPasswordPolicy(profile, wlan.password) : { valid: true, errors: [] };
    const modeBlocked = !isWifiModeAllowed(profile, wlan.security as WifiSecurityMode);
    const pwInvalid = requiresKey && wlan.password.length > 0 && (!pwCheck.valid || !policy.valid);
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Typography variant="subtitle1" fontWeight={700}>{label}</Typography>
            <Chip
              size="small"
              label={wlan.enabled ? 'On' : 'Off'}
              sx={{ height: 20, fontSize: '0.65rem', bgcolor: wlan.enabled ? `${acsColors.success}22` : `${acsColors.textMuted}22`, color: wlan.enabled ? acsColors.success : acsColors.textMuted, fontWeight: 600 }}
            />
            {mode && <ComplianceBadge badge={wifiModeBadge(mode.id)} />}
          </Box>
          {modeBlocked && (
            <Alert severity="error" sx={{ mb: 1 }}>{mode?.label ?? wlan.security} is not permitted under the {profileLabel} profile.</Alert>
          )}
          {!modeBlocked && mode && (mode.level === 'critical' || mode.level === 'weak') && (
            <Alert severity="warning" sx={{ mb: 1 }}>Warning: This configuration does not meet modern security recommendations.</Alert>
          )}
          <FormControlLabel
            control={<Switch checked={wlan.enabled} onChange={(e) => updateBand(wlan.band, { enabled: e.target.checked })} />}
            label="Wi-Fi Enabled"
          />
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}><TextField fullWidth label="Network Name (SSID)" value={wlan.ssid} onChange={(e) => updateBand(wlan.band, { ssid: e.target.value })} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Channel" type="number" value={wlan.channel} onChange={(e) => updateBand(wlan.band, { channel: parseInt(e.target.value) })} /></Grid>
            <Grid item xs={12} md={6}>
              <TextField select fullWidth label="Channel Width" value={wlan.channelWidth} onChange={(e) => updateBand(wlan.band, { channelWidth: e.target.value })}>
                {widths.map((w) => <MenuItem key={w} value={w}>{w}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <SecuritySelect
                label="Security Mode"
                value={wlan.security}
                legacyEnabled={legacyEnabled}
                options={WIFI_SECURITY_MODES}
                allowedIds={allowedModeIds}
                onChange={(id) => updateBand(wlan.band, { security: id })}
                helperText={mode?.encryption}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={wlan.password}
                disabled={!requiresKey}
                error={pwInvalid}
                helperText={requiresKey ? (!pwCheck.valid ? pwCheck.message : policy.errors[0] ?? 'Passphrase meets policy') : 'No PSK required for this mode'}
                onChange={(e) => updateBand(wlan.band, { password: e.target.value })}
              />
              {requiresKey && wlan.password.length > 0 && <PasswordStrengthMeter password={wlan.password} showFeedback={false} />}
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">Connected clients: <strong style={{ color: acsColors.accent }}>{clients}</strong></Typography>
            </Grid>
          </Grid>
          <Button variant="contained" sx={{ mt: 2 }} onClick={() => save(wlan.band)}>Save {label}</Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box>
      <PageHeader title="Wi-Fi" subtitle="Wireless networks, band steering and neighbor scan." />

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Networks" />
        <Tab label="Band Steering" />
        <Tab label="Neighbor Scan" />
      </Tabs>

      {tab === 0 && (
        <>
          {saved && <Alert severity="success" sx={{ mb: 2 }}>Wi-Fi settings saved</Alert>}
          {saveError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSaveError('')}>{saveError}</Alert>}
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}><BandCard wlan={wlan24} clients={clients24} label="2.4 GHz" /></Grid>
            <Grid item xs={12} md={6}><BandCard wlan={wlan5} clients={clients5} label="5 GHz" /></Grid>
          </Grid>
        </>
      )}

      {tab === 1 && (
        <>
          {steeringSaved && <Alert severity="success" sx={{ mb: 2 }}>Band steering saved</Alert>}
          <FormSection title="Band Steering">
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControlLabel control={<Switch checked={steering.enabled} onChange={(e) => setSteering({ ...steering, enabled: e.target.checked })} />} label="Enable Band Steering" />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="RSSI Threshold (dBm)" type="number" value={steering.rssiThreshold} onChange={(e) => setSteering({ ...steering, rssiThreshold: parseInt(e.target.value) })} />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel control={<Switch checked={steering.prefer5G} onChange={(e) => setSteering({ ...steering, prefer5G: e.target.checked })} />} label="Prefer 5 GHz" />
                <FormControlLabel control={<Switch checked={steering.clientSteering} onChange={(e) => setSteering({ ...steering, clientSteering: e.target.checked })} />} label="Client Steering" />
              </Grid>
            </Grid>
            <Button variant="contained" sx={{ mt: 2 }} onClick={saveSteering}>Save</Button>
          </FormSection>
        </>
      )}

      {tab === 2 && (
        <FormSection title="Neighbor AP Scan">
          <Button variant="contained" onClick={scan} disabled={scanning}>{scanning ? 'Scanning...' : 'Scan Now'}</Button>
          <Box sx={{ mt: 2 }}>
            <DataTable
              columns={[
                { key: 'ssid', label: 'SSID' },
                { key: 'bssid', label: 'BSSID' },
                { key: 'channel', label: 'Channel' },
                { key: 'band', label: 'Band' },
                { key: 'rssi', label: 'RSSI' },
                { key: 'security', label: 'Security' },
              ]}
              rows={neighbors.map((n) => ({
                ssid: n.ssid,
                bssid: n.bssid,
                channel: n.channel,
                band: `${n.band} GHz`,
                rssi: `${n.rssi} dBm`,
                security: n.security,
              }))}
            />
          </Box>
        </FormSection>
      )}
    </Box>
  );
}
