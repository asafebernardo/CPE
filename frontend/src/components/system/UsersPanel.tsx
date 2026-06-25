import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import api from '../../services/api';
import { FormSection } from '../common/FormSection';
import { PasswordField } from '../common/PasswordField';
import { useAuthStore } from '../../stores/authStore';
import {
  ROLE_LABELS,
  USER_ROLES,
  type SystemUserDto,
  type UpdateSystemUserInput,
  type UserRole,
} from '@aerobrry/shared';
import { acsColors } from '../../theme/colors';

const ROLE_COLORS: Record<UserRole, string> = {
  USER: acsColors.textSecondary,
  TECHNICIAN: '#60a5fa',
  ADMIN: acsColors.accent,
};

type UserForm = {
  username: string;
  role: UserRole;
  enabled: boolean;
  password: string;
  mustChangePassword: boolean;
};

export function UsersPanel() {
  const currentRole = useAuthStore((s) => s.user?.role ?? 'USER');
  const canEdit = currentRole === 'ADMIN';

  const [users, setUsers] = useState<SystemUserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUserDto | null>(null);
  const [form, setForm] = useState<UserForm>({
    username: '',
    role: 'USER',
    enabled: true,
    password: '',
    mustChangePassword: false,
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/security/users');
      setUsers(res.data);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? (e instanceof Error ? e.message : 'Failed to load users'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openEdit = (user: SystemUserDto) => {
    setEditingUser(user);
    setForm({
      username: user.username,
      role: user.role,
      enabled: user.enabled,
      password: '',
      mustChangePassword: user.mustChangePassword,
    });
    setError(null);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingUser(null);
    setError(null);
  };

  const saveUser = async () => {
    if (!editingUser) return;
    if (!form.username.trim()) {
      setError('Username is required');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload: UpdateSystemUserInput = {
        username: form.username.trim(),
        role: form.role,
        mustChangePassword: form.mustChangePassword,
      };
      if (editingUser.role !== 'ADMIN') {
        payload.enabled = form.enabled;
      }
      if (form.password.trim()) payload.password = form.password;
      await api.put(`/security/users/${editingUser.id}`, payload);
      closeDialog();
      await load();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? (e instanceof Error ? e.message : 'Failed to save user'));
    } finally {
      setSaving(false);
    }
  };

  const isAdminUser = editingUser?.role === 'ADMIN';

  return (
    <>
      <FormSection title="System Users">
        {error && !dialogOpen && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Typography variant="body2" color="text.secondary">Loading users...</Typography>
        ) : (
          <TableContainer
            component={Paper}
            variant="outlined"
            sx={{ borderRadius: 2, border: `1px solid ${acsColors.border}` }}
          >
            <Table size="small">
              <TableHead>
                <TableRow>
                  {['Username', 'Role', 'Status', 'Must Change Password', 'Last Updated', ''].map((h) => (
                    <TableCell key={h} sx={{ bgcolor: acsColors.bgSecondary, fontWeight: 600 }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} hover sx={{ opacity: user.enabled ? 1 : 0.65 }}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{user.username}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={ROLE_LABELS[user.role]}
                        sx={{
                          height: 22,
                          fontWeight: 600,
                          bgcolor: `${ROLE_COLORS[user.role]}22`,
                          color: ROLE_COLORS[user.role],
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={user.enabled ? 'Enabled' : 'Disabled'}
                        color={user.enabled ? 'success' : 'default'}
                        variant="outlined"
                        sx={{ height: 22, fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell>{user.mustChangePassword ? 'Yes' : 'No'}</TableCell>
                    <TableCell sx={{ color: acsColors.textSecondary, fontSize: '0.875rem' }}>
                      {new Date(user.updatedAt).toLocaleString()}
                    </TableCell>
                    <TableCell align="right">
                      {canEdit && (
                        <IconButton size="small" onClick={() => openEdit(user)} aria-label={`Edit ${user.username}`}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {!canEdit && !loading && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Only administrators can edit system users.
          </Alert>
        )}
      </FormSection>

      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              fullWidth
              label="Username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              helperText="3–32 characters: letters, numbers, . _ -"
            />
            <TextField
              select
              fullWidth
              label="Role"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
            >
              {USER_ROLES.map((role) => (
                <MenuItem key={role} value={role}>
                  {ROLE_LABELS[role]}
                </MenuItem>
              ))}
            </TextField>
            <FormControlLabel
              control={
                <Switch
                  checked={form.enabled}
                  onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
                  disabled={isAdminUser}
                />
              }
              label="Account enabled"
            />
            {isAdminUser && (
              <Typography variant="caption" color="text.secondary">
                Administrator accounts cannot be disabled.
              </Typography>
            )}
            <PasswordField
              fullWidth
              label="New password"
              placeholder="Leave empty to keep current password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={form.mustChangePassword}
                  onChange={(e) => setForm({ ...form, mustChangePassword: e.target.checked })}
                />
              }
              label="Require password change on next login"
            />
            {error && <Alert severity="error">{error}</Alert>}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button variant="contained" onClick={saveUser} disabled={saving}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
