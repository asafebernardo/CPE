import { useEffect, useState } from 'react';
import { Box, Grid, Card, CardContent, Typography, Button, Alert, TextField } from '@mui/material';
import { FormSection } from '../common/FormSection';
import { DeviceInfoCard } from '../dashboard/DeviceInfoCard';
import { SecuritySelect } from '../security/SecuritySelect';
import { useSecurityStore } from '../../stores/securityStore';
import {
  PASSWORD_HASH_ALGORITHMS,
  getPasswordHashAlgorithm,
  type DeviceInfoPanelDto,
  type PasswordHashAlgorithm,
} from '@aerobrry/shared';

export function SystemInfoContent({
  device,
  firmware,
  ntp,
  message,
}: {
  device: DeviceInfoPanelDto;
  firmware: Record<string, unknown>;
  ntp: Record<string, unknown>;
  message?: string;
}) {
  const { settings, fetchAll, patchSettings, hashPreview } = useSecurityStore();
  const [preview, setPreview] = useState<string>('');
  const [demo, setDemo] = useState('demo-password');

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const updateAlgo = async (algo: PasswordHashAlgorithm) => {
    if (!settings) return;
    setPreview('');
    await patchSettings({ passwordHashAlgorithm: algo });
  };

  const runPreview = async () => {
    if (!settings) return;
    const res = await hashPreview(settings.passwordHashAlgorithm, demo);
    setPreview(res.output);
  };

  const algoMeta = settings ? getPasswordHashAlgorithm(settings.passwordHashAlgorithm) : undefined;

  return (
    <Box>
      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <DeviceInfoCard device={device} />
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>Runtime</Typography>
              <Typography variant="body2" color="text.secondary">
                Firmware: {String(firmware.currentVersion ?? '—')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Upgrade Status: {String(firmware.upgradeStatus ?? '—')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                NTP Server: {String(ntp.server ?? '—')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Timezone: {String(ntp.timezone ?? '—')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <FormSection title="Web Login Password Storage">
        <Grid container spacing={2} alignItems="flex-start">
          <Grid item xs={12} md={4}>
            <SecuritySelect
              label="Hash Algorithm"
              value={settings?.passwordHashAlgorithm ?? 'bcrypt'}
              legacyEnabled={settings?.legacyCompatibility ?? false}
              options={PASSWORD_HASH_ALGORITHMS}
              disabled={!settings}
              onChange={(id) => updateAlgo(id as PasswordHashAlgorithm)}
              helperText={algoMeta ? `${algoMeta.description} · since ${algoMeta.year}` : undefined}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Sample Password" value={demo} onChange={(e) => setDemo(e.target.value)} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Button variant="outlined" sx={{ mt: 1 }} onClick={runPreview} disabled={!settings}>Preview Stored Hash</Button>
          </Grid>
          {preview && (
            <Grid item xs={12}>
              <TextField
                fullWidth multiline minRows={2} label="Stored Representation" value={preview}
                InputProps={{ readOnly: true, sx: { fontFamily: 'monospace', fontSize: '0.75rem' } }}
              />
            </Grid>
          )}
        </Grid>
      </FormSection>
    </Box>
  );
}
