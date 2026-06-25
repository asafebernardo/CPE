import { Box, type SxProps, type Theme } from '@mui/material';
import { acsColors } from '../../theme/colors';

interface OsPanelProps {
  children: React.ReactNode;
  /** @deprecated Use variant="elevated" sparingly; default is matte */
  glow?: boolean;
  layer?: 1 | 2 | 3;
  variant?: 'matte' | 'elevated' | 'inset';
  sx?: SxProps<Theme>;
  onClick?: () => void;
}

const layerBg: Record<number, string> = {
  1: 'var(--rgos-layer-2)',
  2: 'var(--rgos-layer-3)',
  3: 'var(--rgos-layer-4)',
};

export function OsPanel({
  children,
  glow: _glow,
  layer = 2,
  variant = 'matte',
  sx,
  onClick,
}: OsPanelProps) {
  return (
    <Box
      onClick={onClick}
      sx={{
        position: 'relative',
        borderRadius: '10px',
        bgcolor: variant === 'inset' ? 'var(--rgos-layer-1)' : layerBg[layer],
        border: `1px solid ${variant === 'elevated' ? 'var(--rgos-border-strong)' : acsColors.border}`,
        boxShadow:
          variant === 'elevated'
            ? '0 1px 2px rgba(0,0,0,0.24), 0 8px 24px rgba(0,0,0,0.18)'
            : 'none',
        overflow: 'hidden',
        transition: 'border-color 0.15s ease, background-color 0.15s ease',
        '&:hover': onClick ? { borderColor: 'var(--rgos-border-strong)', bgcolor: 'var(--rgos-layer-4)' } : undefined,
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}
