import { Card, CardContent, Box, Typography, Chip } from '@mui/material';
import type { SvgIconComponent } from '@mui/icons-material';
import { acsColors } from '../../theme/colors';

interface Metric {
  label: string;
  value: string | number;
}

interface HomeSummaryCardProps {
  title: string;
  icon: SvgIconComponent;
  status?: 'online' | 'offline' | 'active' | 'disabled';
  statusLabel?: string;
  metrics: Metric[];
}

const statusColors = {
  online: acsColors.success,
  active: acsColors.success,
  offline: acsColors.error,
  disabled: acsColors.warning,
};

export function HomeSummaryCard({ title, icon: Icon, status, statusLabel, metrics }: HomeSummaryCardProps) {
  const color = status ? statusColors[status] : acsColors.textSecondary;

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Icon sx={{ color: acsColors.accent, fontSize: 22 }} />
            <Typography variant="subtitle1" fontWeight={700}>{title}</Typography>
          </Box>
          {statusLabel && (
            <Chip
              size="small"
              label={statusLabel}
              sx={{ bgcolor: `${color}22`, color, fontWeight: 700, fontSize: '0.7rem' }}
            />
          )}
        </Box>
        {metrics.map((m) => (
          <Box key={m.label} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.4 }}>
            <Typography variant="body2" color="text.secondary">{m.label}</Typography>
            <Typography variant="body2" fontWeight={600}>{m.value}</Typography>
          </Box>
        ))}
      </CardContent>
    </Card>
  );
}
