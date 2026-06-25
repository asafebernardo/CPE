import { useState } from 'react';
import { Alert, Box, Button, Grid, TextField } from '@mui/material';
import api from '../../services/api';
import { FormSection } from '../common/FormSection';
import { DataTable } from '../common/DataTable';
import type { TracerouteResponse } from '@aerobrry/shared';

export function TraceroutePanel() {
  const [traceTarget, setTraceTarget] = useState('google.com');
  const [dnsTarget, setDnsTarget] = useState('google.com');
  const [traceResult, setTraceResult] = useState<TracerouteResponse | null>(null);
  const [dnsResult, setDnsResult] = useState('');
  const [wanTest, setWanTest] = useState('');
  const [loading, setLoading] = useState(false);

  const runTraceroute = async () => {
    setLoading(true);
    try {
      const res = await api.post('/diagnostic/traceroute', { target: traceTarget, maxHops: 8 });
      setTraceResult(res.data);
    } finally {
      setLoading(false);
    }
  };

  const runDnsLookup = async () => {
    setLoading(true);
    try {
      const res = await api.post('/diagnostic/ping', { target: dnsTarget, count: 1 });
      setDnsResult(`Resolved via ping test — avg ${res.data.avgMs} ms`);
    } finally {
      setLoading(false);
    }
  };

  const runWanTest = async () => {
    setLoading(true);
    try {
      const res = await api.post('/wan/actions/test-connection');
      setWanTest(res.data.success ? `WAN OK — ${res.data.latencyMs} ms` : 'WAN connection failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <FormSection title="Traceroute">
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              label="Target"
              value={traceTarget}
              onChange={(e) => setTraceTarget(e.target.value)}
            />
          </Grid>
          <Grid item>
            <Button variant="contained" onClick={runTraceroute} disabled={loading}>
              Run Traceroute
            </Button>
          </Grid>
        </Grid>
        {traceResult && (
          <Box sx={{ mt: 2 }}>
            <DataTable
              columns={[
                { key: 'hop', label: 'Hop' },
                { key: 'hostname', label: 'Host' },
                { key: 'ip', label: 'IP' },
                { key: 'timeMs', label: 'ms' },
              ]}
              rows={traceResult.hops as unknown as Array<Record<string, unknown>>}
            />
          </Box>
        )}
      </FormSection>

      <FormSection title="DNS Lookup">
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              label="Hostname"
              value={dnsTarget}
              onChange={(e) => setDnsTarget(e.target.value)}
            />
          </Grid>
          <Grid item>
            <Button variant="outlined" onClick={runDnsLookup} disabled={loading}>
              Lookup
            </Button>
          </Grid>
        </Grid>
        {dnsResult && <Alert severity="info" sx={{ mt: 2 }}>{dnsResult}</Alert>}
      </FormSection>

      <FormSection title="WAN Connection Test">
        <Button variant="outlined" onClick={runWanTest} disabled={loading}>
          Run WAN Test
        </Button>
        {wanTest && <Alert severity="info" sx={{ mt: 2 }}>{wanTest}</Alert>}
      </FormSection>
    </>
  );
}
