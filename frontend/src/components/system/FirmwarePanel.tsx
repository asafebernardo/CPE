import { useEffect, useRef, useState } from 'react';
import { Alert, Box, Button, Grid, Typography } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import api from '../../services/api';
import { FormSection } from '../common/FormSection';
import { acsColors } from '../../theme/colors';
import type { FirmwareUploadResult } from '@aerobrry/shared';

const ACCEPTED_FIRMWARE = '.bin,.img,.trx,.fw,.zip';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FirmwarePanel() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [firmware, setFirmware] = useState<Record<string, unknown>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [upgrading, setUpgrading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = () => api.get('/cpe/firmware').then((res) => setFirmware(res.data));

  useEffect(() => { load(); }, []);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setError('');
    setTimeout(() => setMessage(''), 5000);
  };

  const showError = (msg: string) => {
    setError(msg);
    setMessage('');
  };

  const pollUpgradeComplete = () => {
    setTimeout(async () => {
      await load();
      setUpgrading(false);
      setUploading(false);
      showMessage('Firmware upgraded successfully');
    }, 3500);
  };

  const upgrade = async () => {
    if (!confirm('Start firmware upgrade from online repository? The device may reboot.')) return;
    setUpgrading(true);
    setError('');
    try {
      await api.post('/cpe/firmware/upgrade');
      showMessage('Firmware upgrade started...');
      pollUpgradeComplete();
    } catch (e) {
      showError(e instanceof Error ? e.message : 'Upgrade failed');
      setUpgrading(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    setError('');
  };

  const uploadFirmware = async () => {
    if (!selectedFile) return;
    if (!confirm(`Upload "${selectedFile.name}" and start firmware upgrade? The device may reboot.`)) return;

    setUploading(true);
    setError('');
    const formData = new FormData();
    formData.append('firmware', selectedFile);

    try {
      const res = await api.post<FirmwareUploadResult>('/cpe/firmware/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      showMessage(`Upload accepted — upgrading to ${res.data.targetVersion}...`);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setUpgrading(true);
      pollUpgradeComplete();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      showError(msg ?? (e instanceof Error ? e.message : 'Upload failed'));
      setUploading(false);
    }
  };

  const busy = upgrading || uploading;

  return (
    <Box>
      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <FormSection title="Current Firmware">
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary">Current Version</Typography>
            <Typography variant="h5" fontWeight={700} sx={{ color: acsColors.accent }}>
              {String(firmware.currentVersion ?? '—')}
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary">Pending Version</Typography>
            <Typography variant="h6" fontWeight={600}>
              {String(firmware.pendingVersion ?? '—')}
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary">Upgrade Status</Typography>
            <Typography variant="h6" fontWeight={600}>
              {String(firmware.upgradeStatus ?? '—')}
            </Typography>
          </Grid>
        </Grid>
      </FormSection>

      <FormSection title="Upload Firmware">
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Select a firmware image file (.bin, .img, .trx, .fw, .zip) to upload and install.
        </Typography>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_FIRMWARE}
          hidden
          onChange={onFileChange}
        />
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<CloudUploadIcon />}
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
          >
            Choose File
          </Button>
          {selectedFile && (
            <Typography variant="body2" color="text.secondary">
              {selectedFile.name} ({formatFileSize(selectedFile.size)})
            </Typography>
          )}
          <Button
            variant="contained"
            onClick={uploadFirmware}
            disabled={!selectedFile || busy}
          >
            {uploading ? 'Uploading...' : 'Upload & Install'}
          </Button>
        </Box>
      </FormSection>

      <FormSection title="Online Upgrade">
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Download and install the latest firmware from the vendor repository.
        </Typography>
        <Button variant="outlined" onClick={upgrade} disabled={busy}>
          {upgrading && !uploading ? 'Upgrading...' : 'Upgrade from Repository'}
        </Button>
      </FormSection>
    </Box>
  );
}
