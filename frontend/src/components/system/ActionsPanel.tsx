import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import api from '../../services/api';
import { FormSection } from '../common/FormSection';
import { DEVICE_PRESETS, type DevicePresetDto } from '@aerobrry/shared';
import { acsColors } from '../../theme/colors';

export function ActionsPanel() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [presets, setPresets] = useState<DevicePresetDto[]>(DEVICE_PRESETS);

  useEffect(() => {
    api.get('/management/presets').then((res) => setPresets(res.data)).catch(() => {
      setPresets(DEVICE_PRESETS);
    });
  }, []);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setError('');
    setTimeout(() => setMessage(''), 4000);
  };

  const showError = (msg: string) => {
    setError(msg);
    setMessage('');
  };

  const reboot = async () => {
    if (!confirm('Reboot the device now?')) return;
    await api.post('/management/reboot');
    showMessage('Reboot initiated');
  };

  const factoryReset = async () => {
    if (!confirm('Factory reset will erase all settings. Are you sure?')) return;
    await api.post('/management/factory-reset');
    showMessage('Factory reset completed');
  };

  const applyPreset = async (preset: DevicePresetDto) => {
    if (!confirm(`Apply "${preset.label}" preset? Current settings will be overwritten.`)) return;
    setApplyingId(preset.id);
    setError('');
    try {
      const res = await api.post('/management/apply-preset', { presetId: preset.id });
      showMessage(res.data.message ?? `${preset.label} applied`);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showError(msg ?? (e instanceof Error ? e.message : 'Failed to apply preset'));
    } finally {
      setApplyingId(null);
    }
  };

  return (
    <Box>
      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <FormSection title="Configuration Presets">
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Apply a predefined configuration profile to the device.
        </Typography>
        <TableContainer
          component={Paper}
          variant="outlined"
          sx={{ borderRadius: 2, border: `1px solid ${acsColors.border}`, mb: 2 }}
        >
          <Table size="small">
            <TableHead>
              <TableRow>
                {['Preset', 'Description', ''].map((h) => (
                  <TableCell key={h || 'actions'} sx={{ bgcolor: acsColors.bgSecondary, fontWeight: 600 }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {presets.map((preset) => (
                <TableRow key={preset.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{preset.label}</Typography>
                  </TableCell>
                  <TableCell sx={{ color: acsColors.textSecondary, fontSize: '0.875rem' }}>
                    {preset.description}
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      variant="outlined"
                      disabled={applyingId === preset.id}
                      onClick={() => applyPreset(preset)}
                    >
                      {applyingId === preset.id ? 'Applying...' : 'Apply'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </FormSection>

      <FormSection title="Reboot">
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Restart the device. Active connections will be interrupted briefly.
        </Typography>
        <Button variant="outlined" color="warning" onClick={reboot}>
          Reboot Device
        </Button>
      </FormSection>

      <FormSection title="Factory Reset">
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Restore factory defaults. Same as the Factory Default preset.
        </Typography>
        <Button variant="outlined" color="error" onClick={factoryReset}>
          Factory Reset
        </Button>
      </FormSection>
    </Box>
  );
}
