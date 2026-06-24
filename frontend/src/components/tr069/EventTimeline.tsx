import { Box, Typography, TextField, Chip } from '@mui/material';
import type { Tr069EventDto } from '@routergui/shared';
import { acsColors } from '../../theme/colors';

interface EventTimelineProps {
  events: Tr069EventDto[];
  search: string;
  onSearchChange: (v: string) => void;
}

export function EventTimeline({ events, search, onSearchChange }: EventTimelineProps) {
  return (
    <Box>
      <TextField
        size="small"
        placeholder="Search events..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        sx={{ mb: 2, maxWidth: 400 }}
      />
      <Box sx={{ position: 'relative' }}>
        {events.map((e, i) => (
          <Box key={e.id} sx={{ display: 'flex', gap: 2, mb: 2, position: 'relative' }}>
            <Box sx={{ width: 12, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: acsColors.accent, mt: 1 }} />
              {i < events.length - 1 && (
                <Box sx={{ width: 2, flex: 1, bgcolor: acsColors.border, minHeight: 40 }} />
              )}
            </Box>
            <Box
              sx={{
                flex: 1,
                p: 2,
                borderRadius: 2,
                border: `1px solid ${acsColors.border}`,
                bgcolor: acsColors.bgCard,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Typography variant="subtitle2" fontWeight={700}>{e.event}</Typography>
                  <Chip size="small" label={e.code} sx={{ fontSize: '0.7rem' }} />
                </Box>
                <Chip
                  size="small"
                  label={e.result}
                  sx={{ bgcolor: 'rgba(16,185,129,0.12)', color: acsColors.success, fontSize: '0.7rem' }}
                />
              </Box>
              <Typography variant="caption" color="text.secondary">
                {new Date(e.timestamp).toLocaleString()}
              </Typography>
              {e.details && (
                <Typography variant="body2" sx={{ mt: 1, fontFamily: 'monospace', fontSize: '0.75rem', color: acsColors.textMuted }}>
                  {e.details}
                </Typography>
              )}
            </Box>
          </Box>
        ))}
        {events.length === 0 && (
          <Typography color="text.secondary">No events found</Typography>
        )}
      </Box>
    </Box>
  );
}
