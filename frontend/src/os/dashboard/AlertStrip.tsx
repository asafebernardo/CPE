import { Box, Typography } from '@mui/material';
import { acsColors } from '../../theme/colors';
import type { OsAlert } from './useSmartAlerts';
import { LiveDot } from '../design';

const severityColor = {
  error: acsColors.error,
  warning: acsColors.warning,
  info: acsColors.textSecondary,
};

export function AlertStrip({ alerts, compact = false }: { alerts: OsAlert[]; compact?: boolean }) {
  if (alerts.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          py: compact ? 0 : 0.5,
          px: compact ? 0 : 1,
          borderRadius: compact ? 0 : '8px',
          bgcolor: compact ? 'transparent' : 'var(--rgos-layer-2)',
          border: compact ? 'none' : `1px solid ${acsColors.border}`,
        }}
      >
        <LiveDot status="ok" />
        <Typography variant="caption" sx={{ color: acsColors.textMuted, fontSize: '0.7rem' }}>
          All systems nominal
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: compact ? 'column' : 'row', flexWrap: 'wrap', gap: 0.75 }}>
      {alerts.map((a) => (
        <Box
          key={a.id}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            px: 1,
            py: 0.4,
            borderRadius: '6px',
            bgcolor: 'var(--rgos-layer-2)',
            border: `1px solid ${severityColor[a.severity]}33`,
          }}
        >
          <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: severityColor[a.severity], flexShrink: 0 }} />
          <Typography variant="caption" sx={{ color: severityColor[a.severity], fontSize: '0.7rem', fontWeight: 500 }}>
            {a.message}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
