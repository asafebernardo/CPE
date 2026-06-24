import { Box, Typography } from '@mui/material';
import { acsColors } from '../../../theme/colors';

export type QualityRating = 'Excellent' | 'Good' | 'Fair' | 'Poor';

const ratingColor: Record<QualityRating, string> = {
  Excellent: acsColors.success,
  Good: '#84cc16',
  Fair: acsColors.warning,
  Poor: acsColors.error,
};

const ratingBars: Record<QualityRating, number> = {
  Excellent: 4,
  Good: 3,
  Fair: 2,
  Poor: 1,
};

export function rateQuality(latencyMs: number, jitterMs: number, lossPercent: number): QualityRating {
  if (latencyMs <= 30 && jitterMs <= 8 && lossPercent <= 0.5) return 'Excellent';
  if (latencyMs <= 60 && jitterMs <= 20 && lossPercent <= 1.5) return 'Good';
  if (latencyMs <= 120 && jitterMs <= 40 && lossPercent <= 4) return 'Fair';
  return 'Poor';
}

export function QualityIndicator({ rating }: { rating: QualityRating }) {
  const color = ratingColor[rating];
  const bars = ratingBars[rating];

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.5, height: 28 }}>
        {[1, 2, 3, 4].map((i) => (
          <Box
            key={i}
            sx={{
              width: 7,
              height: 7 + i * 6,
              borderRadius: 0.5,
              bgcolor: i <= bars ? color : acsColors.border,
            }}
          />
        ))}
      </Box>
      <Typography variant="h6" fontWeight={700} sx={{ color }}>
        {rating}
      </Typography>
    </Box>
  );
}
