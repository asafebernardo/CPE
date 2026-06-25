import { useEffect, useState } from 'react';
import { Alert, Box, Button, Grid, List, ListItem, ListItemText } from '@mui/material';
import api from '../../services/api';
import { FormSection } from '../common/FormSection';
import { SecuritySelect } from '../security/SecuritySelect';
import { useSecurityStore } from '../../stores/securityStore';
import { BACKUP_ENCRYPTION_TYPES, getBackupEncryption, type BackupEncryptionType } from '@aerobrry/shared';

export function BackupPanel() {
  const [backups, setBackups] = useState<Array<{ id: string; label: string; createdAt: string }>>([]);
  const [message, setMessage] = useState('');

  const securitySettings = useSecurityStore((s) => s.settings);
  const fetchSecurity = useSecurityStore((s) => s.fetchAll);
  const patchSettings = useSecurityStore((s) => s.patchSettings);

  const load = () => {
    api.get('/management/backups').then((res) => setBackups(res.data));
  };

  useEffect(() => { load(); fetchSecurity(); }, [fetchSecurity]);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const updateBackupEncryption = async (type: BackupEncryptionType) => {
    if (!securitySettings) return;
    await patchSettings({ backupEncryptionType: type });
    showMessage('Backup encryption updated');
  };

  const createBackup = async () => {
    await api.post('/management/backup', { label: `Manual backup ${new Date().toLocaleString()}` });
    load();
    showMessage('Backup created');
  };

  const restore = async (id: string) => {
    if (!confirm('Restore this configuration snapshot? Current settings will be overwritten.')) return;
    await api.post('/management/restore', { snapshotId: id });
    showMessage('Configuration restored');
  };

  return (
    <Box>
      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}

      <FormSection title="Backup Encryption">
        <Grid container spacing={2} alignItems="flex-start">
          <Grid item xs={12} md={5}>
            <SecuritySelect
              label="Encryption Method"
              value={securitySettings?.backupEncryptionType ?? 'aes-256'}
              legacyEnabled={securitySettings?.legacyCompatibility ?? false}
              options={BACKUP_ENCRYPTION_TYPES}
              disabled={!securitySettings}
              onChange={(id) => updateBackupEncryption(id as BackupEncryptionType)}
            />
          </Grid>
          <Grid item xs={12} md={7}>
            <Alert severity="info" sx={{ mt: { md: 1 } }}>
              Protection: {getBackupEncryption(securitySettings?.backupEncryptionType ?? 'aes-256')?.protection}
            </Alert>
          </Grid>
        </Grid>
      </FormSection>

      <FormSection title="Configuration Snapshots">
        <Button variant="contained" onClick={createBackup} sx={{ mb: 2 }}>Create Backup</Button>
        <List>
          {backups.map((b) => (
            <ListItem
              key={b.id}
              secondaryAction={
                <Button size="small" onClick={() => restore(b.id)}>Restore</Button>
              }
            >
              <ListItemText primary={b.label} secondary={new Date(b.createdAt).toLocaleString()} />
            </ListItem>
          ))}
          {backups.length === 0 && (
            <ListItem>
              <ListItemText primary="No backups yet" secondary="Create a snapshot to restore settings later." />
            </ListItem>
          )}
        </List>
      </FormSection>
    </Box>
  );
}
