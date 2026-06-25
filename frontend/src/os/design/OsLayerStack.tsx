import { Box, Typography } from '@mui/material';
import { acsColors } from '../../theme/colors';
import { LiveDot } from './OsHealthRing';

export interface OsLayerItem {
  id: string;
  label: string;
  status?: 'ok' | 'warn' | 'error' | 'idle';
  metrics?: React.ReactNode;
  detail?: React.ReactNode;
  onClick?: () => void;
}

export function OsLayerStack({ layers, title }: { layers: OsLayerItem[]; title?: string }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      {title && (
        <Typography
          variant="caption"
          sx={{
            color: acsColors.textMuted,
            fontWeight: 600,
            fontSize: '0.65rem',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            mb: 0.25,
          }}
        >
          {title}
        </Typography>
      )}
      {layers.map((layer) => (
        <Box
          key={layer.id}
          onClick={layer.onClick}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 0.25,
            px: 1.25,
            py: 0.85,
            borderRadius: '8px',
            bgcolor: 'var(--rgos-layer-2)',
            border: `1px solid ${acsColors.border}`,
            cursor: layer.onClick ? 'pointer' : 'default',
            transition: 'background-color 0.15s ease',
            '&:hover': layer.onClick ? { bgcolor: 'var(--rgos-layer-3)' } : undefined,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
              <LiveDot status={layer.status ?? 'idle'} />
              <Typography
                variant="body2"
                fontWeight={500}
                sx={{ color: acsColors.textPrimary, fontSize: '0.8125rem' }}
                noWrap
              >
                {layer.label}
              </Typography>
            </Box>
            <Box sx={{ flexShrink: 0 }}>{layer.metrics}</Box>
          </Box>
          {layer.detail && (
            <Typography variant="caption" sx={{ color: acsColors.textMuted, fontSize: '0.65rem', pl: 2.25 }}>
              {layer.detail}
            </Typography>
          )}
        </Box>
      ))}
    </Box>
  );
}
