import { Chip } from '@mui/material';
import { COMPLIANCE_BADGE_COLORS, type ComplianceBadge as ComplianceBadgeType } from '@aerobrry/shared';

export function ComplianceBadge({ badge, size = 'small' }: { badge: ComplianceBadgeType; size?: 'small' | 'medium' }) {
  const color = COMPLIANCE_BADGE_COLORS[badge];
  return (
    <Chip
      size={size}
      label={badge}
      sx={{
        height: size === 'small' ? 20 : 26,
        fontSize: size === 'small' ? '0.65rem' : '0.75rem',
        fontWeight: 700,
        bgcolor: `${color}22`,
        color,
        border: `1px solid ${color}55`,
      }}
    />
  );
}
