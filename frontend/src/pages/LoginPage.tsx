import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, TextField, Button, Typography, Alert } from '@mui/material';
import { PasswordField } from '../components/common/PasswordField';
import { useAuthStore } from '../stores/authStore';
import { DEVICE_MODEL, DEVICE_MANUFACTURER, DEFAULT_ACCOUNT_PASSWORD, PRODUCT_NAME } from '@aerobrry/shared';
import { acsColors } from '../theme/colors';
import { OsPanel } from '../os/design';

export function LoginPage() {
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState(DEFAULT_ACCOUNT_PASSWORD);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const ok = await login(username, password);
    if (!ok) setError('Invalid username or password');
    else navigate('/');
    setLoading(false);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: acsColors.bgPrimary,
        px: 2,
      }}
    >
      <OsPanel variant="elevated" layer={3} sx={{ width: 380, maxWidth: '100%', p: 3 }}>
        <Typography variant="h6" fontWeight={600} sx={{ color: acsColors.textPrimary, letterSpacing: '-0.02em' }}>
          {PRODUCT_NAME}
        </Typography>
        <Typography variant="caption" sx={{ color: acsColors.textMuted, mt: 0.5, display: 'block' }}>
          {DEVICE_MANUFACTURER} {DEVICE_MODEL}
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2.5 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            fullWidth
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            margin="dense"
            autoFocus
            size="small"
          />
          <PasswordField
            fullWidth
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="dense"
            size="small"
          />
          <Button fullWidth type="submit" variant="contained" sx={{ mt: 2 }} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </Box>
      </OsPanel>
    </Box>
  );
}
