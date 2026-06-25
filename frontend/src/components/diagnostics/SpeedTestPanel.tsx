import { useEffect, useState } from 'react';
import { Button, Card, CardContent, CircularProgress, Grid, Typography } from '@mui/material';
import api from '../../services/api';
import { FormSection } from '../common/FormSection';
import { DataTable } from '../common/DataTable';
import type { SpeedTestResultDto } from '@aerobrry/shared';
import { acsColors } from '../../theme/colors';

export function SpeedTestPanel() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<SpeedTestResultDto | null>(null);
  const [history, setHistory] = useState<SpeedTestResultDto[]>([]);

  const loadHistory = () => api.get('/diagnostic/speedtest/history').then((res) => setHistory(res.data));

  useEffect(() => { loadHistory(); }, []);

  const run = async () => {
    setRunning(true);
    try {
      const res = await api.post('/diagnostic/speedtest');
      setResult(res.data);
      loadHistory();
    } finally {
      setRunning(false);
    }
  };

  return (
    <>
      <Button variant="contained" size="large" onClick={run} disabled={running} sx={{ mb: 3 }}>
        {running ? <CircularProgress size={24} color="inherit" /> : 'Run Speed Test'}
      </Button>

      {result && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary">Download</Typography>
                <Typography variant="h4" sx={{ color: acsColors.accent, fontWeight: 700 }}>
                  {result.downloadMbps} Mbps
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary">Upload</Typography>
                <Typography variant="h4">{result.uploadMbps} Mbps</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary">Latency</Typography>
                <Typography variant="h4">{result.latencyMs} ms</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary">Jitter</Typography>
                <Typography variant="h4">{result.jitterMs} ms</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <FormSection title="History">
        <DataTable
          columns={[
            { key: 'time', label: 'Time' },
            { key: 'down', label: 'Download' },
            { key: 'up', label: 'Upload' },
            { key: 'latency', label: 'Latency' },
          ]}
          rows={history.map((h) => ({
            time: new Date(h.testedAt).toLocaleString(),
            down: `${h.downloadMbps} Mbps`,
            up: `${h.uploadMbps} Mbps`,
            latency: `${h.latencyMs} ms`,
          }))}
        />
      </FormSection>
    </>
  );
}
