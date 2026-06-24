import { Box, Typography, Chip } from '@mui/material';
import type { TopologyDto } from '@routergui/shared';
import { acsColors } from '../../theme/colors';

interface NetworkTopologyProps {
  topology: TopologyDto;
  modelName: string;
}

function statusChip(status: string) {
  const on = status === 'connected' || status === 'active';
  return (
    <Chip
      size="small"
      label={status}
      sx={{
        ml: 1,
        height: 20,
        fontSize: '0.65rem',
        bgcolor: on ? 'rgba(16,185,129,0.15)' : 'rgba(148,163,184,0.1)',
        color: on ? acsColors.success : acsColors.textMuted,
      }}
    />
  );
}

export function NetworkTopology({ topology, modelName }: NetworkTopologyProps) {
  return (
    <Box
      sx={{
        p: 3,
        borderRadius: 2,
        border: `1px solid ${acsColors.border}`,
        bgcolor: acsColors.bgCard,
        minHeight: 420,
      }}
    >
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 3 }}>Network Topology</Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">Internet</Typography>
          {statusChip(topology.internetOnline ? 'connected' : 'disconnected')}
        </Box>
        <Box sx={{ width: 2, height: 28, bgcolor: acsColors.border }} />
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">WAN</Typography>
          {statusChip(topology.wanStatus)}
        </Box>
        <Box sx={{ width: 2, height: 28, bgcolor: acsColors.border }} />
        <Box
          sx={{
            px: 4,
            py: 2,
            borderRadius: 2,
            border: `2px solid ${acsColors.accent}`,
            bgcolor: 'rgba(34,211,238,0.06)',
            textAlign: 'center',
          }}
        >
          <Typography variant="caption" color="text.secondary">RouterGui</Typography>
          <Typography variant="h6" fontWeight={700} sx={{ color: acsColors.accent }}>{modelName}</Typography>
        </Box>
        <Box sx={{ display: 'flex', width: '60%', justifyContent: 'center', mt: 0 }}>
          <Box sx={{ width: '50%', height: 2, bgcolor: acsColors.border }} />
          <Box sx={{ width: 2, height: 2 }} />
          <Box sx={{ width: '50%', height: 2, bgcolor: acsColors.border }} />
        </Box>
        <Box sx={{ display: 'flex', gap: 8, mt: 0 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Box sx={{ width: 2, height: 24, bgcolor: acsColors.border, mx: 'auto' }} />
            <Typography variant="body2" fontWeight={600}>LAN</Typography>
            {statusChip(topology.lanStatus)}
            <Typography variant="caption" color="text.secondary" display="block">
              {topology.lanClientCount} clients
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Box sx={{ width: 2, height: 24, bgcolor: acsColors.border, mx: 'auto' }} />
            <Typography variant="body2" fontWeight={600}>Wi-Fi</Typography>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mt: 0.5 }}>
              <Chip size="small" label={`2.4G: ${topology.wifi24ClientCount}`} sx={{ fontSize: '0.65rem' }} />
              <Chip size="small" label={`5G: ${topology.wifi5ClientCount}`} sx={{ fontSize: '0.65rem' }} />
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
