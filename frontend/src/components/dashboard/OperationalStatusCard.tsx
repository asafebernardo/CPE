import { Box, Card, CardContent, Typography, Chip } from '@mui/material';
import type { SvgIconComponent } from '@mui/icons-material';
import { acsColors } from '../../theme/colors';

export type StatusLevel = 'online' | 'offline' | 'warning' | 'active' | 'disabled' | 'connected' | 'disconnected';

interface MetricRow {
  label: string;
  value: string | number;
}

interface OperationalStatusCardProps {
  title: string;
  icon: SvgIconComponent;
  status: StatusLevel;
  statusLabel?: string;
  metrics: MetricRow[];
  updatedAt?: string;
}

const statusColors: Record<StatusLevel, { bg: string; color: string; dot: string }> = {
  online: { bg: 'rgba(16,185,129,0.12)', color: acsColors.success, dot: acsColors.success },
  connected: { bg: 'rgba(16,185,129,0.12)', color: acsColors.success, dot: acsColors.success },
  active: { bg: 'rgba(16,185,129,0.12)', color: acsColors.success, dot: acsColors.success },
  offline: { bg: 'rgba(239,68,68,0.12)', color: acsColors.error, dot: acsColors.error },
  disconnected: { bg: 'rgba(239,68,68,0.12)', color: acsColors.error, dot: acsColors.error },
  warning: { bg: 'rgba(245,158,11,0.12)', color: acsColors.warning, dot: acsColors.warning },
  disabled: { bg: 'rgba(148,163,184,0.1)', color: acsColors.textMuted, dot: acsColors.textMuted },
};

export function OperationalStatusCard({
  title,
  icon: Icon,
  status,
  statusLabel,
  metrics,
  updatedAt,
}: OperationalStatusCardProps) {
  const sc = statusColors[status] ?? statusColors.offline;

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: 'rgba(34,211,238,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon sx={{ color: acsColors.accent, fontSize: 22 }} />
            </Box>
            <Typography variant="subtitle1" fontWeight={700}>{title}</Typography>
          </Box>
          <Chip
            size="small"
            label={statusLabel ?? status}
            sx={{ bgcolor: sc.bg, color: sc.color, fontWeight: 600 }}
          />
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          {metrics.map((m) => (
            <Box key={m.label} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
              <Typography variant="body2" color="text.secondary">{m.label}</Typography>
              <Typography variant="body2" fontWeight={500} sx={{ color: acsColors.textPrimary, textAlign: 'right' }}>
                {m.value}
              </Typography>
            </Box>
          ))}
        </Box>
        {updatedAt && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
            Updated {new Date(updatedAt).toLocaleTimeString()}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

/** Alias for reusable status widget naming in CPE UI architecture. */
export { OperationalStatusCard as StatusCard };
