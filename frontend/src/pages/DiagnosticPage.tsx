import { useState } from 'react';
import { Box, TextField, Button, Grid, Alert } from '@mui/material';
import api from '../services/api';
import { PageHeader } from '../components/common/PageHeader';
import { FormSection } from '../components/common/FormSection';
import { DataTable } from '../components/common/DataTable';
import { useAuthStore } from '../stores/authStore';
import type { PingResponse, TracerouteResponse } from '@routergui/shared';

export function DiagnosticPage() {
  const role = useAuthStore((s) => s.user?.role ?? 'USER');
  const isAdvanced = role === 'TECHNICIAN' || role === 'ADMIN';

  const [pingTarget, setPingTarget] = useState('8.8.8.8');
  const [traceTarget, setTraceTarget] = useState('google.com');
  const [dnsTarget, setDnsTarget] = useState('google.com');
  const [pingResult, setPingResult] = useState<PingResponse | null>(null);
  const [traceResult, setTraceResult] = useState<TracerouteResponse | null>(null);
  const [dnsResult, setDnsResult] = useState<string>('');
  const [speedResult, setSpeedResult] = useState<{ downloadMbps: number; uploadMbps: number; latencyMs: number } | null>(null);
  const [wanTest, setWanTest] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const runSpeedTest = async () => {
    setLoading(true);
    try {
      const res = await api.post('/diagnostic/speedtest');
      setSpeedResult(res.data);
    } finally {
      setLoading(false);
    }
  };

  const runPing = async () => {
    setLoading(true);
    try {
      const res = await api.post('/diagnostic/ping', { target: pingTarget, count: 4 });
      setPingResult(res.data);
    } finally {
      setLoading(false);
    }
  };

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

  const runGatewayTest = async () => {
    setLoading(true);
    try {
      const res = await api.post('/wan/actions/ping-gateway');
      setWanTest(`Gateway ${res.data.target}: ${res.data.avgMs} ms avg`);
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
    <Box>
      <PageHeader title="Diagnostics" subtitle={isAdvanced ? 'Network diagnostic tools.' : 'Test your connection.'} />

      <FormSection title="Ping">
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={8} md={4}>
            <TextField fullWidth size="small" label="Target" value={pingTarget} onChange={(e) => setPingTarget(e.target.value)} />
          </Grid>
          <Grid item>
            <Button variant="contained" onClick={runPing} disabled={loading}>Run Ping</Button>
          </Grid>
        </Grid>
        {pingResult && (
          <Alert severity="info" sx={{ mt: 2 }}>
            {pingResult.packetsReceived}/{pingResult.packetsSent} — {pingResult.minMs}/{pingResult.avgMs}/{pingResult.maxMs} ms
          </Alert>
        )}
      </FormSection>

      {role === 'USER' && (
        <FormSection title="Speed Test">
          <Button variant="outlined" onClick={runSpeedTest} disabled={loading}>Run Speed Test</Button>
          {speedResult && (
            <Alert severity="info" sx={{ mt: 2 }}>
              ↓ {speedResult.downloadMbps} Mbps · ↑ {speedResult.uploadMbps} Mbps · {speedResult.latencyMs} ms
            </Alert>
          )}
        </FormSection>
      )}

      {isAdvanced && (
        <>
          <FormSection title="Traceroute">
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={8} md={4}>
                <TextField fullWidth size="small" label="Target" value={traceTarget} onChange={(e) => setTraceTarget(e.target.value)} />
              </Grid>
              <Grid item>
                <Button variant="contained" onClick={runTraceroute} disabled={loading}>Run Traceroute</Button>
              </Grid>
            </Grid>
            {traceResult && (
              <Box sx={{ mt: 2 }}>
                <DataTable
                  columns={[{ key: 'hop', label: 'Hop' }, { key: 'hostname', label: 'Host' }, { key: 'ip', label: 'IP' }, { key: 'timeMs', label: 'ms' }]}
                  rows={traceResult.hops as unknown as Array<Record<string, unknown>>}
                />
              </Box>
            )}
          </FormSection>

          <FormSection title="DNS Lookup">
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={8} md={4}>
                <TextField fullWidth size="small" label="Hostname" value={dnsTarget} onChange={(e) => setDnsTarget(e.target.value)} />
              </Grid>
              <Grid item>
                <Button variant="outlined" onClick={runDnsLookup} disabled={loading}>Lookup</Button>
              </Grid>
            </Grid>
            {dnsResult && <Alert severity="info" sx={{ mt: 2 }}>{dnsResult}</Alert>}
          </FormSection>

          <FormSection title="Gateway & WAN Test">
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button variant="outlined" onClick={runGatewayTest} disabled={loading}>Ping Gateway</Button>
              <Button variant="outlined" onClick={runWanTest} disabled={loading}>WAN Test</Button>
            </Box>
            {wanTest && <Alert severity="info" sx={{ mt: 2 }}>{wanTest}</Alert>}
          </FormSection>
        </>
      )}
    </Box>
  );
}
