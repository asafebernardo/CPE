import { Box, Typography } from '@mui/material';
import PublicIcon from '@mui/icons-material/Public';
import RouterIcon from '@mui/icons-material/Router';
import LanIcon from '@mui/icons-material/Lan';
import WifiIcon from '@mui/icons-material/Wifi';
import type { TopologyDto } from '@routergui/shared';
import { acsColors } from '../../../theme/colors';

function Node({
  icon,
  label,
  detail,
  online,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  detail?: string;
  online?: boolean;
  highlight?: boolean;
}) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, py: 0.75 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 30,
          height: 30,
          borderRadius: 1.5,
          bgcolor: highlight ? acsColors.accentSoft : acsColors.bgInput,
          border: highlight ? `1px solid ${acsColors.accent}` : `1px solid ${acsColors.border}`,
          color: highlight ? acsColors.accent : acsColors.textSecondary,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" fontWeight={highlight ? 700 : 600} sx={{ color: highlight ? acsColors.accent : acsColors.textPrimary }}>
          {label}
        </Typography>
        {detail && <Typography variant="caption" sx={{ color: acsColors.textMuted }}>{detail}</Typography>}
      </Box>
      {online !== undefined && (
        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: online ? acsColors.success : acsColors.textMuted }} />
      )}
    </Box>
  );
}

function Connector({ indent = 0 }: { indent?: number }) {
  return <Box sx={{ ml: `${15 + indent}px`, width: 2, height: 10, bgcolor: acsColors.border }} />;
}

export function CompactTopology({ topology, modelName }: { topology: TopologyDto; modelName: string }) {
  return (
    <Box>
      <Node icon={<PublicIcon sx={{ fontSize: 18 }} />} label="Internet" online={topology.internetOnline} />
      <Connector />
      <Node
        icon={<RouterIcon sx={{ fontSize: 18 }} />}
        label={`RouterGui ${modelName}`}
        detail={`WAN ${topology.wanStatus}`}
        highlight
      />
      <Box sx={{ ml: 2.5, borderLeft: `2px solid ${acsColors.border}`, pl: 1.5 }}>
        <Node
          icon={<LanIcon sx={{ fontSize: 18 }} />}
          label="LAN"
          detail={`${topology.lanClientCount} clients`}
          online={topology.lanStatus === 'active'}
        />
        <Node
          icon={<WifiIcon sx={{ fontSize: 18 }} />}
          label="Wi-Fi"
          detail={`2.4G: ${topology.wifi24ClientCount} · 5G: ${topology.wifi5ClientCount}`}
          online={topology.wifi24ClientCount + topology.wifi5ClientCount >= 0}
        />
      </Box>
    </Box>
  );
}
