import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, TextField, Button, Typography, Alert } from '@mui/material';
import { useAuthStore } from '../stores/authStore';
import { RouterGuiLogo } from '../components/common/RouterGuiLogo';
import { DEVICE_MODEL, DEVICE_MANUFACTURER } from '@routergui/shared';
import { acsColors } from '../theme/colors';

export function LoginPage() {
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
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
        background: `radial-gradient(ellipse at top, ${acsColors.bgSecondary} 0%, ${acsColors.bgPrimary} 60%)`,
      }}
    >
      <Card
        sx={{
          width: 400,
          maxWidth: '90%',
          border: `1px solid ${acsColors.border}`,
          bgcolor: acsColors.bgCard,
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <RouterGuiLogo height={56} />
          </Box>
          <Typography variant="body2" align="center" color="text.secondary" gutterBottom>
            {DEVICE_MANUFACTURER} {DEVICE_MODEL}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
            Demo: user/user · tech/tech · admin/admin
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <TextField
              fullWidth
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              margin="normal"
              autoFocus
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
            />
            <Button fullWidth type="submit" variant="contained" size="large" sx={{ mt: 2 }} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
