import { useEffect, useState } from 'react';
import { Box, Button } from '@mui/material';
import api from '../../services/api';
import { FormSection } from '../common/FormSection';
import { DataTable } from '../common/DataTable';
import type { WifiNeighborDto } from '@aerobrry/shared';

export function NeighborScanPanel() {
  const [neighbors, setNeighbors] = useState<WifiNeighborDto[]>([]);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    api.get('/wifi/neighbors').then((res) => setNeighbors(res.data));
  }, []);

  const scan = async () => {
    setScanning(true);
    try {
      const res = await api.post('/wifi/neighbors/scan');
      setNeighbors(res.data);
    } finally {
      setScanning(false);
    }
  };

  return (
    <FormSection title="Neighbor AP Scan">
      <Button variant="contained" onClick={scan} disabled={scanning}>
        {scanning ? 'Scanning...' : 'Scan Now'}
      </Button>
      <Box sx={{ mt: 2 }}>
        <DataTable
          columns={[
            { key: 'ssid', label: 'SSID' },
            { key: 'bssid', label: 'BSSID' },
            { key: 'channel', label: 'Channel' },
            { key: 'band', label: 'Band' },
            { key: 'rssi', label: 'RSSI' },
            { key: 'security', label: 'Security' },
          ]}
          rows={neighbors.map((n) => ({
            ssid: n.ssid,
            bssid: n.bssid,
            channel: n.channel,
            band: `${n.band} GHz`,
            rssi: `${n.rssi} dBm`,
            security: n.security,
          }))}
        />
      </Box>
    </FormSection>
  );
}
