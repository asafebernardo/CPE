import { Box, LinearProgress, Typography } from '@mui/material';
import { evaluatePasswordStrength, passwordStrengthLabel, type PasswordStrengthLevel } from '@routergui/shared';

const LEVEL_COLOR: Record<PasswordStrengthLevel, string> = {
  'very-weak': '#ef4444',
  weak: '#f97316',
  medium: '#eab308',
  strong: '#22c55e',
  'very-strong': '#06b6d4',
};

export function PasswordStrengthMeter({ password, showFeedback = true }: { password: string; showFeedback?: boolean }) {
  if (!password) return null;
  const result = evaluatePasswordStrength(password);
  const color = LEVEL_COLOR[result.level];

  return (
    <Box sx={{ mt: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="caption" sx={{ color, fontWeight: 700 }}>{passwordStrengthLabel(result.level)}</Typography>
        <Typography variant="caption" color="text.secondary">~{result.entropyBits} bits</Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={result.score}
        sx={{ height: 6, borderRadius: 3, bgcolor: `${color}22`, '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 3 } }}
      />
      {showFeedback && result.feedback.length > 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
          {result.feedback[0]}
        </Typography>
      )}
    </Box>
  );
}
