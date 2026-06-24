import { Card, CardContent, Typography, Box, Chip } from '@mui/material';
import { acsColors } from '../../theme/colors';

interface StatusCardProps {
  title: string;
  children: React.ReactNode;
  status?: 'connected' | 'disconnected' | 'active' | 'disabled';
}

export function StatusCard({ title, children, status }: StatusCardProps) {
  const isPositive = status === 'connected' || status === 'active';
  const isDisabled = status === 'disabled';

  return (
    <Card>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={600}>{title}</Typography>
          {status && (
            <Chip
              size="small"
              label={status}
              sx={{
                bgcolor: isPositive
                  ? 'rgba(16, 185, 129, 0.15)'
                  : isDisabled
                    ? 'rgba(148, 163, 184, 0.1)'
                    : 'rgba(239, 68, 68, 0.12)',
                color: isPositive ? acsColors.success : isDisabled ? acsColors.textMuted : acsColors.error,
                fontWeight: 600,
                fontSize: '0.75rem',
              }}
            />
          )}
        </Box>
        <Box sx={{ '& .MuiTypography-body2': { color: acsColors.textSecondary, lineHeight: 1.8 } }}>
          {children}
        </Box>
      </CardContent>
    </Card>
  );
}
