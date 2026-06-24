import { Box, Typography } from '@mui/material';
import type { WanHistoryEventDto } from '@routergui/shared';
import { acsColors } from '../../theme/colors';

export function WanHistoryTimeline({ events }: { events: WanHistoryEventDto[] }) {
  return (
    <Box>
      {events.length === 0 && (
        <Typography color="text.secondary" variant="body2">No WAN events recorded yet.</Typography>
      )}
      {events.map((e) => (
        <Box
          key={e.id}
          sx={{
            display: 'flex',
            gap: 2,
            py: 1.5,
            borderBottom: `1px solid ${acsColors.border}`,
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ minWidth: 140 }}>
            {new Date(e.timestamp).toLocaleString()}
          </Typography>
          <Box>
            <Typography variant="body2" fontWeight={600}>{e.event}</Typography>
            {e.details && <Typography variant="caption" color="text.secondary">{e.details}</Typography>}
          </Box>
        </Box>
      ))}
    </Box>
  );
}
