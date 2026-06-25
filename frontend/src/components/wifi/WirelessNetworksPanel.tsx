import { useCallback, useEffect, useState } from 'react';
import {
  Box, Grid, Button, Alert, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControlLabel, Switch, MenuItem, Typography, CircularProgress, Tabs, Tab,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import api from '../../services/api';
import {
  type WirelessInterfaceDto,
  type GuestWirelessInput,
  type BandSteeringConfigDto,
  normalizeWifiSecurityMode,
  WIFI_SECURITY_MODES,
} from '@aerobrry/shared';
import { WirelessSectionHeader } from './WirelessInterfaceCard';
import { WirelessInterfacesTable } from './WirelessInterfacesTable';
import { UnifiedWifiCard, type WlanBandForm } from './UnifiedWifiCard';
import { PasswordField } from '../common/PasswordField';
import { SecuritySelect } from '../security/SecuritySelect';
import { useSecurityStore } from '../../stores/securityStore';
import { getSecurityProfile } from '@aerobrry/shared';
import { acsColors } from '../../theme/colors';

const EMPTY_GUEST: GuestWirelessInput = {
  name: 'Guest Network',
  ssid: 'RGX-Guest',
  band: '2.4',
  security: 'wpa2-psk-aes',
  password: '',
  isolated: true,
  vlanId: 30,
  captivePortal: false,
  scheduleEnabled: false,
  ipv4Enabled: true,
  ipv6Enabled: true,
};

export function WirelessNetworksPanel({
  scope = 'home',
  steering,
  clients24,
  clients5,
  onSteeringChange,
  onSteeringSave,
}: {
  scope?: 'home' | 'guest' | 'mesh';
  steering?: BandSteeringConfigDto;
  clients24?: number;
  clients5?: number;
  onSteeringChange?: (patch: Partial<BandSteeringConfigDto>) => void;
  onSteeringSave?: () => void;
}) {
  const [interfaces, setInterfaces] = useState<WirelessInterfaceDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [guestOpen, setGuestOpen] = useState(false);
  const [guestForm, setGuestForm] = useState<GuestWirelessInput>(EMPTY_GUEST);
  const [meshEdit, setMeshEdit] = useState<WirelessInterfaceDto | null>(null);
  const [primaryEdit, setPrimaryEdit] = useState<WirelessInterfaceDto | null>(null);
  const [unifiedOpen, setUnifiedOpen] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [homeBandTab, setHomeBandTab] = useState<'2.4' | '5'>('2.4');
  const [guestBandTab, setGuestBandTab] = useState<'2.4' | '5'>('2.4');
  const [meshBandTab, setMeshBandTab] = useState<'2.4' | '5'>('2.4');

  const securitySettings = useSecurityStore((s) => s.settings);
  const profile = securitySettings?.securityProfile ?? 'isp-standard';
  const profileMeta = getSecurityProfile(profile);
  const legacyEnabled = securitySettings?.legacyCompatibility ?? false;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<WirelessInterfaceDto[]>('/wireless/interfaces');
      setInterfaces(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load wireless interfaces');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const homeNetworks = interfaces.filter((i) => i.interfaceType === 'primary' || i.interfaceType === 'secondary');
  const primary = interfaces.filter((i) => i.interfaceType === 'primary');
  const guests = interfaces.filter((i) => i.interfaceType === 'guest');
  const mesh = interfaces.filter((i) => i.interfaceType === 'mesh_backhaul');

  const wlan24: WlanBandForm | undefined = primary.find((i) => i.band === '2.4') ? toWlanForm(primary.find((i) => i.band === '2.4')!) : undefined;
  const wlan5: WlanBandForm | undefined = primary.find((i) => i.band === '5') ? toWlanForm(primary.find((i) => i.band === '5')!) : undefined;

  const updatePrimaryLocal = (band: string, patch: Partial<WlanBandForm>) => {
    const radioPatch = patch.channel !== undefined || patch.channelWidth !== undefined;
    setInterfaces((prev) =>
      prev.map((i) => {
        if (radioPatch) {
          if (i.band !== band || (i.interfaceType !== 'primary' && i.interfaceType !== 'secondary')) return i;
          return {
            ...i,
            channel: patch.channel ?? i.channel,
            channelWidth: patch.channelWidth ?? i.channelWidth,
          };
        }
        if (i.interfaceType !== 'primary' || i.band !== band) return i;
        return {
          ...i,
          enabled: patch.enabled ?? i.enabled,
          ssid: patch.ssid ?? i.ssid,
          channel: patch.channel ?? i.channel,
          channelWidth: patch.channelWidth ?? i.channelWidth,
          security: patch.security ?? i.security,
          password: patch.password ?? i.password,
        };
      }),
    );
  };

  const updateShared = (patch: Pick<WlanBandForm, 'ssid' | 'security' | 'password'>) => {
    setInterfaces((prev) =>
      prev.map((i) => (i.interfaceType === 'primary' ? { ...i, ...patch } : i)),
    );
  };

  const saveUnified = async () => {
    if (!wlan24 || !wlan5 || !onSteeringSave) return;
    setError('');
    try {
      const shared = { ssid: wlan24.ssid, security: wlan24.security, password: wlan24.password, enabled: true };
      await api.put('/wireless/interfaces/wlan1', {
        ...shared,
        channel: wlan24.channel,
        channelWidth: wlan24.channelWidth,
        enabled: true,
      });
      await api.put('/wireless/interfaces/wlan2', {
        ...shared,
        channel: wlan5.channel,
        channelWidth: wlan5.channelWidth,
        enabled: true,
      });
      await api.put('/wlan/2.4', { ...wlan24, ...shared });
      await api.put('/wlan/5', { ...wlan5, ...shared });
      onSteeringSave();
      setUnifiedOpen(false);
      await load();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? (e instanceof Error ? e.message : 'Failed to save'));
    }
  };

  const savePrimary = async () => {
    if (!primaryEdit) return;
    setError('');
    try {
      await api.put(`/wireless/interfaces/${primaryEdit.interfaceId}`, {
        name: primaryEdit.name,
        ssid: primaryEdit.ssid,
        security: primaryEdit.security,
        password: primaryEdit.password,
        channel: primaryEdit.channel,
        channelWidth: primaryEdit.channelWidth,
        enabled: primaryEdit.enabled,
      });
      if (primaryEdit.interfaceType === 'primary') {
        await api.put(`/wlan/${primaryEdit.band}`, {
          band: primaryEdit.band,
          enabled: primaryEdit.enabled,
          ssid: primaryEdit.ssid,
          channel: primaryEdit.channel,
          channelWidth: primaryEdit.channelWidth,
          security: primaryEdit.security,
          password: primaryEdit.password,
        });
      }
      setPrimaryEdit(null);
      await load();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? (e instanceof Error ? e.message : 'Failed to save'));
    }
  };

  const createGuest = async () => {
    setError('');
    try {
      await api.post('/wireless/interfaces/guest', guestForm);
      setGuestOpen(false);
      setGuestForm(EMPTY_GUEST);
      await load();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? (e instanceof Error ? e.message : 'Failed to create guest network'));
    }
  };

  const deleteGuest = async (iface: WirelessInterfaceDto) => {
    if (!confirm(`Remove guest network "${iface.name}"?`)) return;
    try {
      await api.delete(`/wireless/interfaces/${iface.interfaceId}`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete');
    }
  };

  const saveMesh = async () => {
    if (!meshEdit) return;
    setError('');
    try {
      await api.put(`/wireless/interfaces/${meshEdit.interfaceId}`, {
        band: meshEdit.band,
        channel: meshEdit.channel,
        channelWidth: meshEdit.channelWidth,
        enabled: meshEdit.enabled,
        backhaulMode: meshEdit.backhaulMode,
        name: meshEdit.name,
      });
      setMeshEdit(null);
      await load();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? (e instanceof Error ? e.message : 'Failed to save mesh'));
    }
  };

  const handleToggleEnabled = async (iface: WirelessInterfaceDto, enabled: boolean) => {
    setTogglingId(iface.id);
    setError('');
    try {
      await api.put(`/wireless/interfaces/${iface.interfaceId}`, { enabled });
      if (iface.interfaceType === 'primary') {
        await api.put(`/wlan/${iface.band}`, {
          band: iface.band,
          enabled,
          ssid: iface.ssid,
          channel: iface.channel,
          channelWidth: iface.channelWidth,
          security: iface.security,
          password: iface.password,
        });
      }
      await load();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? (e instanceof Error ? e.message : 'Failed to update interface status'));
    } finally {
      setTogglingId(null);
    }
  };

  const handleEdit = (iface: WirelessInterfaceDto) => {
    if (iface.interfaceType === 'mesh_backhaul') {
      setMeshEdit({ ...iface });
      return;
    }
    if (iface.interfaceType === 'primary' && steering?.enabled) {
      setUnifiedOpen(true);
      return;
    }
    if (iface.interfaceType === 'primary' || iface.interfaceType === 'secondary') {
      setPrimaryEdit({ ...iface });
    }
  };

  const showHome = scope === 'home';
  const showGuest = scope === 'guest';
  const showMesh = scope === 'mesh';

  if (loading && interfaces.length === 0) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: acsColors.textSecondary }}>
        <CircularProgress size={18} /> Loading wireless interfaces...
      </Box>
    );
  }

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {showHome && (
        <Box sx={{ mb: 3 }}>
          <WirelessSectionHeader
            title="Home Networks"
            subtitle="Primary and secondary SSIDs on 2.4 GHz and 5 GHz radios"
            action={
              steering?.enabled && wlan24 && wlan5 ? (
                <Button size="small" variant="contained" onClick={() => setUnifiedOpen(true)}>
                  Unified Wi-Fi settings
                </Button>
              ) : undefined
            }
          />
          <Tabs value={homeBandTab} onChange={(_, v) => setHomeBandTab(v)} sx={{ mb: 2 }}>
            <Tab value="2.4" label="2.4 GHz" />
            <Tab value="5" label="5.8 GHz" />
          </Tabs>
          <WirelessInterfacesTable
            interfaces={homeNetworks.filter((i) => i.band === homeBandTab)}
            scope="home"
            hideRadioColumn
            bandSteeringEnabled={steering?.enabled ?? false}
            clients24={clients24 ?? 0}
            clients5={clients5 ?? 0}
            togglingId={togglingId}
            onEdit={handleEdit}
            onToggleEnabled={handleToggleEnabled}
          />
        </Box>
      )}

      {showGuest && (
        <>
          <WirelessSectionHeader
            title="Guest Networks"
            subtitle="Isolated VLANs — never included in Band Steering"
            action={
              <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => {
                setGuestForm({ ...EMPTY_GUEST, band: guestBandTab });
                setGuestOpen(true);
              }}>
                Add Guest SSID
              </Button>
            }
          />
          <Tabs value={guestBandTab} onChange={(_, v) => setGuestBandTab(v)} sx={{ mb: 2 }}>
            <Tab value="2.4" label="2.4 GHz" />
            <Tab value="5" label="5.8 GHz" />
          </Tabs>
          <WirelessInterfacesTable
            interfaces={guests.filter((i) => i.band === guestBandTab)}
            scope="guest"
            hideRadioColumn
            togglingId={togglingId}
            onDelete={deleteGuest}
            onToggleEnabled={handleToggleEnabled}
          />

          <Dialog open={guestOpen} onClose={() => setGuestOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle>New Guest Network</DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid item xs={12}><TextField fullWidth label="Name" value={guestForm.name} onChange={(e) => setGuestForm({ ...guestForm, name: e.target.value })} /></Grid>
                <Grid item xs={12}><TextField fullWidth label="SSID" value={guestForm.ssid} onChange={(e) => setGuestForm({ ...guestForm, ssid: e.target.value })} /></Grid>
                <Grid item xs={12} md={6}>
                  <TextField select fullWidth label="Band" value={guestForm.band} onChange={(e) => setGuestForm({ ...guestForm, band: e.target.value as GuestWirelessInput['band'] })}>
                    <MenuItem value="2.4">2.4 GHz</MenuItem>
                    <MenuItem value="5">5 GHz</MenuItem>
                    <MenuItem value="6">6 GHz</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={6}><TextField fullWidth label="VLAN ID" type="number" value={guestForm.vlanId ?? 30} onChange={(e) => setGuestForm({ ...guestForm, vlanId: parseInt(e.target.value) })} /></Grid>
                <Grid item xs={12} md={6}>
                  <SecuritySelect
                    label="Security"
                    value={guestForm.security}
                    legacyEnabled={legacyEnabled}
                    options={WIFI_SECURITY_MODES}
                    allowedIds={profileMeta.allowedWifiModes as string[]}
                    onChange={(id) => setGuestForm({ ...guestForm, security: id })}
                  />
                </Grid>
                <Grid item xs={12} md={6}><PasswordField fullWidth label="Password" value={guestForm.password} onChange={(e) => setGuestForm({ ...guestForm, password: e.target.value })} /></Grid>
                <Grid item xs={12}><FormControlLabel control={<Switch checked={guestForm.isolated ?? true} onChange={(e) => setGuestForm({ ...guestForm, isolated: e.target.checked })} />} label="Client isolation" /></Grid>
                <Grid item xs={12}><FormControlLabel control={<Switch checked={guestForm.captivePortal ?? false} onChange={(e) => setGuestForm({ ...guestForm, captivePortal: e.target.checked })} />} label="Captive portal" /></Grid>
                <Grid item xs={12}><FormControlLabel control={<Switch checked={guestForm.scheduleEnabled ?? false} onChange={(e) => setGuestForm({ ...guestForm, scheduleEnabled: e.target.checked })} />} label="Schedule enable/disable" /></Grid>
                <Grid item xs={12}><FormControlLabel control={<Switch checked={guestForm.ipv4Enabled ?? true} onChange={(e) => setGuestForm({ ...guestForm, ipv4Enabled: e.target.checked })} />} label="IPv4" /></Grid>
                <Grid item xs={12}><FormControlLabel control={<Switch checked={guestForm.ipv6Enabled ?? true} onChange={(e) => setGuestForm({ ...guestForm, ipv6Enabled: e.target.checked })} />} label="IPv6" /></Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setGuestOpen(false)}>Cancel</Button>
              <Button variant="contained" onClick={createGuest}>Create</Button>
            </DialogActions>
          </Dialog>
        </>
      )}

      {showMesh && (
        <>
          <WirelessSectionHeader title="Mesh Interfaces" subtitle="Reserved backhaul — hidden from client SSID lists" />
          <Tabs value={meshBandTab} onChange={(_, v) => setMeshBandTab(v)} sx={{ mb: 2 }}>
            <Tab value="2.4" label="2.4 GHz" />
            <Tab value="5" label="5.8 GHz" />
          </Tabs>
          <WirelessInterfacesTable
            interfaces={mesh.filter((i) => i.band === meshBandTab)}
            scope="mesh"
            hideRadioColumn
            togglingId={togglingId}
            onEdit={handleEdit}
            onToggleEnabled={handleToggleEnabled}
          />

          {meshEdit && (
            <Dialog open onClose={() => setMeshEdit(null)} maxWidth="sm" fullWidth>
              <DialogTitle>Mesh Backhaul — {meshEdit.interfaceId}</DialogTitle>
              <DialogContent dividers>
                <Alert severity="info" sx={{ mb: 2 }}>Reserved Mesh Interface — hidden from client SSID lists.</Alert>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField select fullWidth label="Band" value={meshEdit.band} onChange={(e) => setMeshEdit({ ...meshEdit, band: e.target.value as WirelessInterfaceDto['band'] })}>
                      <MenuItem value="2.4">2.4 GHz</MenuItem>
                      <MenuItem value="5">5 GHz</MenuItem>
                      <MenuItem value="6">6 GHz</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField select fullWidth label="Backhaul" value={meshEdit.backhaulMode ?? 'wireless'} onChange={(e) => setMeshEdit({ ...meshEdit, backhaulMode: e.target.value as 'wired' | 'wireless' })}>
                      <MenuItem value="wireless">Wireless</MenuItem>
                      <MenuItem value="wired">Wired</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={6}><TextField fullWidth label="Channel" type="number" value={meshEdit.channel} onChange={(e) => setMeshEdit({ ...meshEdit, channel: parseInt(e.target.value) })} /></Grid>
                  <Grid item xs={12} md={6}>
                    <TextField select fullWidth label="Channel Width" value={meshEdit.channelWidth} onChange={(e) => setMeshEdit({ ...meshEdit, channelWidth: e.target.value })}>
                      {['20MHz', '40MHz', '80MHz', '160MHz'].map((w) => <MenuItem key={w} value={w}>{w}</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid item xs={12}><FormControlLabel control={<Switch checked={meshEdit.enabled} onChange={(e) => setMeshEdit({ ...meshEdit, enabled: e.target.checked })} />} label="Backhaul enabled" /></Grid>
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setMeshEdit(null)}>Cancel</Button>
                <Button variant="contained" onClick={saveMesh}>Save</Button>
              </DialogActions>
            </Dialog>
          )}
        </>
      )}

      {unifiedOpen && steering && wlan24 && wlan5 && onSteeringChange && (
        <Dialog open onClose={() => setUnifiedOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Unified Wi-Fi — 2.4 GHz & 5 GHz</DialogTitle>
          <DialogContent dividers>
            <UnifiedWifiCard
              wlan24={wlan24}
              wlan5={wlan5}
              steering={steering}
              clients24={clients24 ?? 0}
              clients5={clients5 ?? 0}
              legacyEnabled={legacyEnabled}
              profileLabel={profileMeta.label}
              allowedModeIds={profileMeta.allowedWifiModes as string[]}
              profile={profile}
              onUpdateBand={updatePrimaryLocal}
              onUpdateShared={updateShared}
              onUpdateSteering={onSteeringChange}
              onSave={saveUnified}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setUnifiedOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      )}

      {primaryEdit && (
        <Dialog open onClose={() => setPrimaryEdit(null)} maxWidth="sm" fullWidth>
          <DialogTitle>Edit {primaryEdit.name}</DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  Radio: {primaryEdit.band === '5' ? '5 GHz' : `${primaryEdit.band} GHz`}
                </Typography>
              </Grid>
              <Grid item xs={12}><TextField fullWidth label="Name" value={primaryEdit.name} onChange={(e) => setPrimaryEdit({ ...primaryEdit, name: e.target.value })} /></Grid>
              <Grid item xs={12}><TextField fullWidth label="SSID" value={primaryEdit.ssid} onChange={(e) => setPrimaryEdit({ ...primaryEdit, ssid: e.target.value })} /></Grid>
              <Grid item xs={12} md={6}>
                <SecuritySelect
                  label="Security"
                  value={normalizeWifiSecurityMode(primaryEdit.security)}
                  legacyEnabled={legacyEnabled}
                  options={WIFI_SECURITY_MODES}
                  allowedIds={profileMeta.allowedWifiModes as string[]}
                  onChange={(id) => setPrimaryEdit({ ...primaryEdit, security: id })}
                />
              </Grid>
              <Grid item xs={12} md={6}><PasswordField fullWidth label="Password" value={primaryEdit.password} onChange={(e) => setPrimaryEdit({ ...primaryEdit, password: e.target.value })} /></Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Channel"
                  type="number"
                  value={primaryEdit.channel}
                  helperText={`Applies to all network interfaces on ${primaryEdit.band === '5' ? '5 GHz' : `${primaryEdit.band} GHz`}`}
                  onChange={(e) => setPrimaryEdit({ ...primaryEdit, channel: parseInt(e.target.value) })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Channel Width"
                  value={primaryEdit.channelWidth}
                  helperText={`Applies to all network interfaces on ${primaryEdit.band === '5' ? '5 GHz' : `${primaryEdit.band} GHz`}`}
                  onChange={(e) => setPrimaryEdit({ ...primaryEdit, channelWidth: e.target.value })}
                >
                  {(primaryEdit.band === '2.4' ? ['20MHz', '40MHz'] : ['20MHz', '40MHz', '80MHz', '160MHz']).map((w) => (
                    <MenuItem key={w} value={w}>{w}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel control={<Switch checked={primaryEdit.enabled} onChange={(e) => setPrimaryEdit({ ...primaryEdit, enabled: e.target.checked })} />} label="Interface enabled" />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPrimaryEdit(null)}>Cancel</Button>
            <Button variant="contained" onClick={savePrimary}>Save</Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}

function toWlanForm(i: WirelessInterfaceDto): WlanBandForm {
  return {
    band: i.band,
    enabled: i.enabled,
    ssid: i.ssid,
    channel: i.channel,
    channelWidth: i.channelWidth,
    security: normalizeWifiSecurityMode(i.security),
    password: i.password,
  };
}
