import { useEffect, useState } from 'react';
import { Box, Grid, Button, Card, CardContent, Typography, Chip, Alert, CircularProgress } from '@mui/material';
import api from '../services/api';
import { PageHeader } from '../components/common/PageHeader';
import type { WanDashboardDto } from '@routergui/shared';
import { acsColors } from '../theme/colors';

function formatUptime(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}h ${m}m`;
}

export function InternetPage() {
  const [data, setData] = useState<WanDashboardDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const load = () => api.get<WanDashboardDto>('/wan/dashboard').then((res) => setData(res.data));

  useEffect(() => { load(); }, []);

  const action = async (name: string) => {
    setLoading(true);
    setMessage('');
    try {
      const res = await api.post(`/wan/actions/${name}`);
      setData(res.data.dashboard ?? res.data);
      if (name === 'test-connection') {
        setMessage(res.data.success ? `Connection OK — ${res.data.latencyMs} ms` : 'Connection failed');
      } else if (name === 'ping-gateway') {
        setMessage(`Gateway ping: ${res.data.avgMs} ms avg`);
      } else {
        setMessage('Done');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!data) return <CircularProgress size={24} />;

  const online = data.status.status === 'connected';

  return (
    <Box>
      <PageHeader title="Internet" subtitle="Your connection to the Internet." />
      {message && <Alert severity="info" sx={{ mb: 2 }}>{message}</Alert>}

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Typography variant="h6" fontWeight={700}>Connection Status</Typography>
            <Chip
              size="small"
              label={online ? 'Online' : 'Offline'}
              sx={{ bgcolor: online ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: online ? acsColors.success : acsColors.error, fontWeight: 700 }}
            />
          </Box>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" color="text.secondary">IP Address</Typography>
              <Typography variant="h6" fontWeight={600}>{data.config.ipv4.ipAddress}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" color="text.secondary">Gateway</Typography>
              <Typography variant="h6" fontWeight={600}>{data.config.ipv4.gateway}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" color="text.secondary">DNS</Typography>
              <Typography variant="h6" fontWeight={600}>{data.config.dns.primary}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" color="text.secondary">Time Online</Typography>
              <Typography variant="h6" fontWeight={600}>{formatUptime(data.status.uptimeSeconds)}</Typography>
            </Grid>
          </Grid>
          <Box sx={{ display: 'flex', gap: 1, mt: 3 }}>
            <Button variant="contained" disabled={loading} onClick={() => action('reconnect')}>Reconnect</Button>
            <Button variant="outlined" disabled={loading} onClick={() => action('test-connection')}>Test Connection</Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
