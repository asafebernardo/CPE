import { useState } from 'react';
import { Box, Grid, Card, CardContent, Typography, Button, Dialog, DialogContent, DialogTitle, IconButton } from '@mui/material';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import CloseIcon from '@mui/icons-material/Close';
import type { OperationalDashboardResponse } from '@aerobrry/shared';
import { NetworkTopology } from '../NetworkTopology';
import { CompactTopology } from '../home/CompactTopology';
import { InfoCard } from '../home/InfoCard';
import { acsColors } from '../../../theme/colors';

export function DashboardNetworkView({
  data,
  showNetworkDetails,
}: {
  data: OperationalDashboardResponse;
  showNetworkDetails: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={12} md={5}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                <Typography variant="overline" sx={{ color: acsColors.textMuted, fontWeight: 700, flex: 1 }}>
                  Topology
                </Typography>
                <Button size="small" startIcon={<OpenInFullIcon sx={{ fontSize: 16 }} />} onClick={() => setExpanded(true)}>
                  Expand
                </Button>
              </Box>
              <CompactTopology topology={data.topology} modelName={data.device.modelName} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={7}>
          <InfoCard
            title="LAN / WAN Overview"
            rows={[
              { label: 'WAN IP', value: data.wan.ipAddress, mono: true },
              { label: 'Gateway', value: data.wan.gateway, mono: true },
              { label: 'Connection Type', value: data.wan.connectionType },
              { label: 'LAN IP', value: data.lan.ipAddress, mono: true },
              { label: 'DHCP', value: data.lan.dhcpEnabled ? 'Enabled' : 'Disabled', tone: data.lan.dhcpEnabled ? 'success' : 'warning' },
              { label: 'Hosts', value: data.lan.hostCount },
            ]}
          />
        </Grid>
      </Grid>

      {showNetworkDetails && (
        <Box sx={{ mt: 2 }}>
          <InfoCard
            title="Extended Network"
            rows={[
              { label: 'Internet', value: data.internet.status, tone: data.internet.status === 'online' ? 'success' : 'error' },
              { label: 'Wi-Fi 2.4 GHz', value: data.wifi.status24 },
              { label: 'Wi-Fi 5 GHz', value: data.wifi.status5 },
              { label: 'LAN Clients', value: data.topology.lanClientCount },
              { label: 'Wi-Fi 2.4 Clients', value: data.topology.wifi24ClientCount },
              { label: 'Wi-Fi 5 Clients', value: data.topology.wifi5ClientCount },
            ]}
          />
        </Box>
      )}

      <Dialog open={expanded} onClose={() => setExpanded(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
          Network Topology
          <IconButton onClick={() => setExpanded(false)} sx={{ ml: 'auto' }} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <NetworkTopology topology={data.topology} modelName={data.device.modelName} />
        </DialogContent>
      </Dialog>
    </Box>
  );
}
