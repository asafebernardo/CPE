import { Chip } from '@mui/material';
import { SECURITY_LEVELS, type SecurityLevel } from '@aerobrry/shared';

export function SecurityLevelChip({ level, size = 'small' }: { level: SecurityLevel; size?: 'small' | 'medium' }) {
  const meta = SECURITY_LEVELS[level];
  return (
    <Chip
      size={size}
      label={meta.label}
      sx={{
        height: size === 'small' ? 20 : 26,
        fontSize: size === 'small' ? '0.65rem' : '0.75rem',
        fontWeight: 700,
        bgcolor: `${meta.color}22`,
        color: meta.color,
        border: `1px solid ${meta.color}55`,
      }}
    />
  );
}
