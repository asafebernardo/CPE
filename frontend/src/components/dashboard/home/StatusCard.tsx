import { Card, CardContent, Box, Typography } from '@mui/material';
import type { SvgIconComponent } from '@mui/icons-material';
import { acsColors } from '../../../theme/colors';

export type StatusTone = 'online' | 'offline' | 'active' | 'disabled' | 'neutral';

const toneColor: Record<StatusTone, string> = {
  online: acsColors.success,
  active: acsColors.success,
  offline: acsColors.error,
  disabled: acsColors.warning,
  neutral: acsColors.textMuted,
};

interface StatusRow {
  label: string;
  value: string | number;
  strong?: boolean;
}

interface StatusCardProps {
  title: string;
  icon: SvgIconComponent;
  tone: StatusTone;
  statusLabel: string;
  rows: StatusRow[];
}

export function StatusCard({ title, icon: Icon, tone, statusLabel, rows }: StatusCardProps) {
  const color = toneColor[tone];

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: 1.5,
              bgcolor: acsColors.accentSoft,
            }}
          >
            <Icon sx={{ color: acsColors.accent, fontSize: 20 }} />
          </Box>
          <Typography
            variant="overline"
            sx={{ color: acsColors.textMuted, fontWeight: 700, letterSpacing: '0.06em', lineHeight: 1.2 }}
          >
            {title}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color, boxShadow: `0 0 6px ${color}` }} />
          <Typography variant="subtitle1" fontWeight={700} sx={{ color }}>
            {statusLabel}
          </Typography>
        </Box>

        {rows.map((r) => (
          <Box key={r.label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', py: 0.3 }}>
            <Typography variant="caption" sx={{ color: acsColors.textMuted }}>{r.label}</Typography>
            <Typography
              variant="body2"
              fontWeight={r.strong ? 700 : 600}
              sx={{ color: acsColors.textPrimary, fontFamily: r.strong ? 'monospace' : undefined }}
            >
              {r.value}
            </Typography>
          </Box>
        ))}
      </CardContent>
    </Card>
  );
}
