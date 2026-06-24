import { Card, CardContent, Box, Typography, Divider } from '@mui/material';
import { acsColors } from '../../../theme/colors';

export interface InfoRow {
  label: string;
  value: string | number;
  mono?: boolean;
  tone?: 'default' | 'success' | 'warning' | 'error';
}

const toneColor = {
  default: acsColors.textPrimary,
  success: acsColors.success,
  warning: acsColors.warning,
  error: acsColors.error,
};

export function InfoCard({ title, rows }: { title: string; rows: InfoRow[] }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Typography
          variant="overline"
          sx={{ color: acsColors.textMuted, fontWeight: 700, letterSpacing: '0.06em' }}
        >
          {title}
        </Typography>
        <Divider sx={{ my: 1.5, borderColor: acsColors.border }} />
        {rows.map((r) => (
          <Box
            key={r.label}
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', py: 0.65 }}
          >
            <Typography variant="body2" sx={{ color: acsColors.textMuted }}>{r.label}</Typography>
            <Typography
              variant="body2"
              fontWeight={600}
              sx={{
                color: toneColor[r.tone ?? 'default'],
                fontFamily: r.mono ? 'monospace' : undefined,
                textAlign: 'right',
                ml: 2,
              }}
            >
              {r.value}
            </Typography>
          </Box>
        ))}
      </CardContent>
    </Card>
  );
}
