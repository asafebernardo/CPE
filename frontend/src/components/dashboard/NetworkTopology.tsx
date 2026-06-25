import { Box, Typography } from '@mui/material';
import type { TopologyDto } from '@aerobrry/shared';
import { LiveTopology } from '../../os/topology/LiveTopology';
import { OsPanel } from '../../os/design';
import { acsColors } from '../../theme/colors';

interface NetworkTopologyProps {
  topology: TopologyDto;
  modelName: string;
}

export function NetworkTopology({ topology, modelName }: NetworkTopologyProps) {
  const graph = topology.graph ?? {
    nodes: [],
    edges: [],
    lanClientCount: topology.lanClientCount,
    wifi24ClientCount: topology.wifi24ClientCount,
    wifi5ClientCount: topology.wifi5ClientCount,
  };

  return (
    <OsPanel layer={2} glow sx={{ p: 2, minHeight: 420 }}>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, color: acsColors.textPrimary }}>
        Network Topology — {modelName}
      </Typography>
      {graph.nodes.length > 0 ? (
        <LiveTopology graph={graph} compact height={160} />
      ) : (
        <Typography sx={{ color: acsColors.textMuted, textAlign: 'center', py: 4 }}>No topology data</Typography>
      )}
    </OsPanel>
  );
}
