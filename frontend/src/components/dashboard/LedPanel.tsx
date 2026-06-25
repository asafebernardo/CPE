import { Box, Typography, Tooltip } from '@mui/material';
import type { LedIndicatorDto } from '@aerobrry/shared';
import { acsColors } from '../../theme/colors';

const ledColors = {
  on: acsColors.success,
  error: acsColors.error,
  blink: acsColors.accent,
  off: acsColors.border,
};

export function LedPanel({ leds }: { leds: LedIndicatorDto[] }) {
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        border: `1px solid ${acsColors.border}`,
        bgcolor: acsColors.bgCard,
      }}
    >
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2, color: acsColors.textSecondary }}>
        LED STATUS
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {leds.map((led) => (
          <Tooltip key={led.id} title={`${led.label}: ${led.state}`}>
            <Box sx={{ textAlign: 'center', minWidth: 52 }}>
              <Box
                sx={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  mx: 'auto',
                  mb: 0.5,
                  bgcolor: ledColors[led.state],
                  boxShadow: led.state === 'on' ? `0 0 8px ${ledColors.on}` : led.state === 'blink' ? `0 0 8px ${ledColors.blink}` : 'none',
                  animation: led.state === 'blink' ? 'ledBlink 1.2s ease-in-out infinite' : 'none',
                }}
              />
              <Typography variant="caption" sx={{ color: acsColors.textMuted, fontSize: '0.65rem', fontWeight: 600 }}>
                {led.label}
              </Typography>
            </Box>
          </Tooltip>
        ))}
      </Box>
      <style>{`
        @keyframes ledBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </Box>
  );
}
