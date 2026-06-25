import { Box } from '@mui/material';
import type { TopologyDto } from '@aerobrry/shared';
import { LiveTopology } from '../../../os/topology/LiveTopology';
import { OsPanel } from '../../../os/design';

export function CompactTopology({ topology, modelName }: { topology: TopologyDto; modelName: string }) {
  const graph = topology.graph;

  if (graph && graph.nodes.length > 0) {
    return (
      <OsPanel layer={1} sx={{ p: 1 }}>
        <LiveTopology graph={graph} compact height={180} />
      </OsPanel>
    );
  }

  return (
    <Box sx={{ fontFamily: 'var(--rgos-font-mono)', fontSize: '0.75rem', opacity: 0.8 }}>
      {modelName} · LAN {topology.lanClientCount} · Wi‑Fi {topology.wifi24ClientCount + topology.wifi5ClientCount}
    </Box>
  );
}
