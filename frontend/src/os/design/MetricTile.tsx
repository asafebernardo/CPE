import { Box, Typography } from '@mui/material';
import { acsColors } from '../../theme/colors';
import { LiveDot } from './OsHealthRing';

export interface MetricTileProps {
  label: string;
  value: string;
  sub?: string;
  status?: 'ok' | 'warn' | 'error' | 'idle';
  mono?: boolean;
}

export function MetricTile({ label, value, sub, status, mono }: MetricTileProps) {
  return (
    <Box
      sx={{
        px: 1.25,
        py: 1,
        borderRadius: '8px',
        bgcolor: 'var(--rgos-layer-2)',
        border: `1px solid ${acsColors.border}`,
        minWidth: 0,
        flex: '1 1 0',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.35 }}>
        {status && <LiveDot status={status} />}
        <Typography
          variant="caption"
          sx={{
            color: acsColors.textMuted,
            fontSize: '0.65rem',
            fontWeight: 600,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          {label}
        </Typography>
      </Box>
      <Typography
        sx={{
          color: acsColors.textPrimary,
          fontWeight: 600,
          fontSize: '0.9375rem',
          lineHeight: 1.2,
          fontFamily: mono ? 'var(--rgos-font-mono)' : 'var(--rgos-font-ui)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </Typography>
      {sub && (
        <Typography variant="caption" sx={{ color: acsColors.textMuted, fontSize: '0.65rem', mt: 0.25, display: 'block' }}>
          {sub}
        </Typography>
      )}
    </Box>
  );
}
