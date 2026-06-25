import { useState } from 'react';
import { Alert, Box, Button, Grid, TextField } from '@mui/material';
import api from '../../services/api';
import { FormSection } from '../common/FormSection';
import type { PingResponse } from '@routergui/shared';

export function PingPanel() {
  const [pingTarget, setPingTarget] = useState('8.8.8.8');
  const [pingResult, setPingResult] = useState<PingResponse | null>(null);
  const [gatewayResult, setGatewayResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const runPing = async () => {
    setLoading(true);
    try {
      const res = await api.post('/diagnostic/ping', { target: pingTarget, count: 4 });
      setPingResult(res.data);
    } finally {
      setLoading(false);
    }
  };

  const runGatewayTest = async () => {
    setLoading(true);
    try {
      const res = await api.post('/wan/actions/ping-gateway');
      setGatewayResult(`Gateway ${res.data.target}: ${res.data.avgMs} ms avg`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <FormSection title="Ping">
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              label="Target"
              value={pingTarget}
              onChange={(e) => setPingTarget(e.target.value)}
            />
          </Grid>
          <Grid item>
            <Button variant="contained" onClick={runPing} disabled={loading}>
              Run Ping
            </Button>
          </Grid>
        </Grid>
        {pingResult && (
          <Alert severity="info" sx={{ mt: 2 }}>
            {pingResult.packetsReceived}/{pingResult.packetsSent} packets — min/avg/max:{' '}
            {pingResult.minMs}/{pingResult.avgMs}/{pingResult.maxMs} ms
          </Alert>
        )}
      </FormSection>

      <FormSection title="Gateway Ping">
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="outlined" onClick={runGatewayTest} disabled={loading}>
            Ping Gateway
          </Button>
        </Box>
        {gatewayResult && <Alert severity="info" sx={{ mt: 2 }}>{gatewayResult}</Alert>}
      </FormSection>
    </>
  );
}
