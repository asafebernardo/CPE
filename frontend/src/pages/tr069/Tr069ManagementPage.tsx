import { useEffect, useState } from 'react';
import { Box, Grid, TextField, Switch, FormControlLabel, Button, Alert, CircularProgress } from '@mui/material';
import api from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { FormSection } from '../../components/common/FormSection';
import type { Tr069ManagementDto, CredentialEncryptionType } from '@routergui/shared';
import { CREDENTIAL_ENCRYPTION_TYPES, getCredentialEncryption } from '@routergui/shared';
import { acsColors } from '../../theme/colors';
import { SecuritySelect } from '../../components/security/SecuritySelect';
import { useSecurityStore } from '../../stores/securityStore';

type LoadState = 'loading' | 'ready' | 'error';

async function fetchManagementData(): Promise<Tr069ManagementDto> {
  try {
    const res = await api.get<Tr069ManagementDto>('/operational/tr069/management');
    return res.data;
  } catch {
    const [statusRes, dashboardRes] = await Promise.all([
      api.get('/acs/status'),
      api.get('/operational/dashboard').catch(() => null),
    ]);
    const status = statusRes.data;
    const device = dashboardRes?.data?.device;
    const acs = dashboardRes?.data?.acs;
    const nextInform = acs?.nextInform ?? (
      status.lastInform && status.periodicInformEnabled
        ? new Date(new Date(status.lastInform).getTime() + status.periodicInformInterval * 1000).toISOString()
        : null
    );

    return {
      url: status.url ?? '',
      username: '',
      password: '',
      periodicInformEnabled: status.periodicInformEnabled ?? false,
      periodicInformInterval: status.periodicInformInterval ?? 300,
      cwmpVersion: '1.0',
      connectionRequestUrl: '',
      connectionRequestUsername: '',
      connectionRequestPassword: '',
      lastInform: status.lastInform ?? null,
      nextInform,
      lastBoot: device?.bootTime ?? null,
      lastReboot: null,
      lastFactoryReset: null,
      acsStatus: status.sessionState ?? 'idle',
    };
  }
}

export function Tr069ManagementPage() {
  const [data, setData] = useState<Tr069ManagementDto | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [saved, setSaved] = useState(false);

  const securitySettings = useSecurityStore((s) => s.settings);
  const fetchSecurity = useSecurityStore((s) => s.fetchAll);
  const patchSettings = useSecurityStore((s) => s.patchSettings);

  useEffect(() => { fetchSecurity(); }, [fetchSecurity]);

  const updateCredentialStorage = async (type: CredentialEncryptionType) => {
    if (!securitySettings) return;
    await patchSettings({ credentialEncryptionType: type });
  };

  const load = async () => {
    setLoadState('loading');
    setErrorMessage('');
    try {
      const management = await fetchManagementData();
      setData(management);
      setLoadState('ready');
    } catch (err) {
      setData(null);
      setLoadState('error');
      setErrorMessage(err instanceof Error ? err.message : 'Failed to load ACS configuration');
    }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!data) return;
    await api.put('/acs/config', {
      url: data.url,
      username: data.username,
      password: data.password,
      periodicInformEnabled: data.periodicInformEnabled,
      periodicInformInterval: data.periodicInformInterval,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    load();
  };

  if (loadState === 'loading') {
    return (
      <Box>
        <PageHeader title="ACS Configuration" subtitle="TR-069 CWMP management server settings and session status." />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, color: acsColors.textSecondary }}>
          <CircularProgress size={20} />
          Loading ACS configuration...
        </Box>
      </Box>
    );
  }

  if (loadState === 'error' || !data) {
    return (
      <Box>
        <PageHeader title="ACS Configuration" subtitle="TR-069 CWMP management server settings and session status." />
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMessage || 'Unable to load ACS configuration. Ensure the backend is running on port 3001.'}
        </Alert>
        <Button variant="outlined" onClick={load}>Retry</Button>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader title="ACS Configuration" subtitle="TR-069 CWMP management server settings and session status." />
      {saved && <Alert severity="success" sx={{ mb: 2 }}>Configuration saved</Alert>}
      <FormSection title="Management Server">
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}><TextField fullWidth label="ACS URL" value={data.url} onChange={(e) => setData({ ...data, url: e.target.value })} /></Grid>
          <Grid item xs={12} md={3}><TextField fullWidth label="Username" value={data.username} onChange={(e) => setData({ ...data, username: e.target.value })} /></Grid>
          <Grid item xs={12} md={3}><TextField fullWidth label="Password" type="password" value={data.password} onChange={(e) => setData({ ...data, password: e.target.value })} /></Grid>
          <Grid item xs={12}><FormControlLabel control={<Switch checked={data.periodicInformEnabled} onChange={(e) => setData({ ...data, periodicInformEnabled: e.target.checked })} />} label="Periodic Inform" /></Grid>
          <Grid item xs={12} md={4}><TextField fullWidth label="Inform Interval (s)" type="number" value={data.periodicInformInterval} onChange={(e) => setData({ ...data, periodicInformInterval: parseInt(e.target.value) })} /></Grid>
          <Grid item xs={12} md={4}><TextField fullWidth label="CWMP Version" value={data.cwmpVersion} disabled /></Grid>
          <Grid item xs={12} md={4}><TextField fullWidth label="ACS Status" value={data.acsStatus} disabled /></Grid>
        </Grid>
        {data.url && (
          data.url.toLowerCase().startsWith('https://')
            ? <Alert severity="success" sx={{ mt: 2 }}>ACS communication uses HTTPS (encrypted).</Alert>
            : <Alert severity="warning" sx={{ mt: 2 }}>Warning: ACS communication is not encrypted. Use an https:// URL.</Alert>
        )}
        <Button variant="contained" sx={{ mt: 2 }} onClick={save}>Save ACS Config</Button>
      </FormSection>
      <FormSection title="Credential Storage">
        <Grid container spacing={2} alignItems="flex-start">
          <Grid item xs={12} md={5}>
            <SecuritySelect
              label="ACS Credential Encryption"
              value={securitySettings?.credentialEncryptionType ?? 'aes-256'}
              legacyEnabled={securitySettings?.legacyCompatibility ?? false}
              options={CREDENTIAL_ENCRYPTION_TYPES}
              disabled={!securitySettings}
              onChange={(id) => updateCredentialStorage(id as CredentialEncryptionType)}
            />
          </Grid>
          <Grid item xs={12} md={7}>
            {(() => {
              const meta = getCredentialEncryption(securitySettings?.credentialEncryptionType ?? 'aes-256');
              return meta?.warning
                ? <Alert severity="warning" sx={{ mt: { md: 1 } }}>{meta.warning}</Alert>
                : <Alert severity="success" sx={{ mt: { md: 1 } }}>ACS username and password are encrypted at rest.</Alert>;
            })()}
          </Grid>
        </Grid>
      </FormSection>

      <FormSection title="Connection Request">
        <Grid container spacing={2}>
          <Grid item xs={12}><TextField fullWidth label="Connection Request URL" value={data.connectionRequestUrl} disabled /></Grid>
          <Grid item xs={12} md={6}><TextField fullWidth label="CR Username" value={data.connectionRequestUsername} disabled /></Grid>
          <Grid item xs={12} md={6}><TextField fullWidth label="CR Password" type="password" value={data.connectionRequestPassword} disabled /></Grid>
        </Grid>
      </FormSection>
      <FormSection title="Session History">
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}><TextField fullWidth label="Last Inform" value={data.lastInform ? new Date(data.lastInform).toLocaleString() : 'Never'} disabled /></Grid>
          <Grid item xs={12} md={4}><TextField fullWidth label="Next Inform" value={data.nextInform ? new Date(data.nextInform).toLocaleString() : '—'} disabled /></Grid>
          <Grid item xs={12} md={4}><TextField fullWidth label="Last Boot" value={data.lastBoot ? new Date(data.lastBoot).toLocaleString() : '—'} disabled /></Grid>
          <Grid item xs={12} md={4}><TextField fullWidth label="Last Reboot" value={data.lastReboot ? new Date(data.lastReboot).toLocaleString() : '—'} disabled /></Grid>
          <Grid item xs={12} md={4}><TextField fullWidth label="Last Factory Reset" value={data.lastFactoryReset ? new Date(data.lastFactoryReset).toLocaleString() : '—'} disabled /></Grid>
        </Grid>
      </FormSection>
    </Box>
  );
}
