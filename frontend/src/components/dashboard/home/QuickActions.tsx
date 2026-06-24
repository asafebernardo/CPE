import { Card, CardContent, Box, Typography, Divider, ButtonBase } from '@mui/material';
import type { SvgIconComponent } from '@mui/icons-material';
import { acsColors } from '../../../theme/colors';

export interface QuickAction {
  label: string;
  icon: SvgIconComponent;
  onClick: () => void;
  tone?: 'default' | 'warning';
}

export function QuickActions({ actions }: { actions: QuickAction[] }) {
  return (
    <Card>
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Typography
          variant="overline"
          sx={{ color: acsColors.textMuted, fontWeight: 700, letterSpacing: '0.06em' }}
        >
          Quick Actions
        </Typography>
        <Divider sx={{ my: 1.5, borderColor: acsColors.border }} />
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
            gap: 1.5,
          }}
        >
          {actions.map((a) => {
            const Icon = a.icon;
            const accent = a.tone === 'warning' ? acsColors.warning : acsColors.accent;
            return (
              <ButtonBase
                key={a.label}
                onClick={a.onClick}
                sx={{
                  flexDirection: 'column',
                  gap: 1,
                  py: 2,
                  borderRadius: 2,
                  border: `1px solid ${acsColors.border}`,
                  bgcolor: acsColors.bgInput,
                  transition: 'all 0.15s',
                  '&:hover': { borderColor: accent, bgcolor: `${accent}14` },
                }}
              >
                <Icon sx={{ color: accent, fontSize: 26 }} />
                <Typography variant="caption" sx={{ color: acsColors.textSecondary, fontWeight: 600 }}>
                  {a.label}
                </Typography>
              </ButtonBase>
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
}
