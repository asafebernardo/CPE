import { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Alert, Box } from '@mui/material';
import { useAuthStore } from '../../stores/authStore';
import { useSecurityStore } from '../../stores/securityStore';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';
import { PasswordField } from '../common/PasswordField';
import { validateAdminPasswordPolicy } from '@routergui/shared';

/**
 * Blocking modal shown after login when the admin must change the default /
 * forced password before using the system (First Login Security).
 */
export function ForcePasswordChangeDialog() {
  const mustChange = useAuthStore((s) => s.mustChangePassword);
  const clearMustChange = useAuthStore((s) => s.clearMustChange);
  const username = useAuthStore((s) => s.user?.username ?? 'admin');
  const settings = useSecurityStore((s) => s.settings);
  const fetchAll = useSecurityStore((s) => s.fetchAll);
  const changePassword = useSecurityStore((s) => s.changePassword);

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (mustChange && !settings) fetchAll(); }, [mustChange, settings, fetchAll]);

  if (!mustChange) return null;

  const profile = settings?.securityProfile ?? 'isp-standard';

  const submit = async () => {
    setError('');
    if (next !== confirm) { setError('New passwords do not match'); return; }
    const policy = validateAdminPasswordPolicy(profile, next);
    if (!policy.valid) { setError(policy.errors.join('. ')); return; }
    setBusy(true);
    try {
      await changePassword(username, current, next);
      clearMustChange();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Failed to change password');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open maxWidth="xs" fullWidth>
      <DialogTitle>Change your password</DialogTitle>
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          For security reasons you must change the administrative password before continuing.
        </Alert>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <PasswordField label="Current Password" value={current} onChange={(e) => setCurrent(e.target.value)} fullWidth />
          <Box>
            <PasswordField label="New Password" value={next} onChange={(e) => setNext(e.target.value)} fullWidth />
            <PasswordStrengthMeter password={next} />
          </Box>
          <PasswordField label="Confirm New Password" value={confirm} onChange={(e) => setConfirm(e.target.value)} fullWidth />
        </Box>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={submit} disabled={busy || !current || !next}>
          {busy ? 'Saving...' : 'Change Password'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
