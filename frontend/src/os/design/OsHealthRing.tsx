import { Box, Typography } from '@mui/material';
import { acsColors } from '../../theme/colors';

const statusColor = {
  ok: acsColors.success,
  warn: acsColors.warning,
  error: acsColors.error,
  idle: acsColors.textMuted,
};

export function OsHealthRing({
  score,
  size = 48,
  compact = false,
}: {
  score: number;
  size?: number;
  compact?: boolean;
}) {
  const clamped = Math.max(0, Math.min(100, score));
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (clamped / 100) * c;
  const color = clamped >= 80 ? acsColors.success : clamped >= 50 ? acsColors.warning : acsColors.error;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
      <Box sx={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={2.5} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography
            sx={{
              fontFamily: 'var(--rgos-font-mono)',
              fontWeight: 600,
              fontSize: compact ? '0.7rem' : '0.8rem',
              color,
              lineHeight: 1,
            }}
          >
            {Math.round(clamped)}
          </Typography>
        </Box>
      </Box>
      {!compact && (
        <Box>
          <Typography variant="caption" sx={{ color: acsColors.textMuted, display: 'block', lineHeight: 1.2, fontSize: '0.65rem' }}>
            Network health
          </Typography>
          <Typography variant="body2" fontWeight={600} sx={{ color: acsColors.textPrimary, fontSize: '0.8125rem' }}>
            {clamped >= 80 ? 'Optimal' : clamped >= 50 ? 'Degraded' : 'Critical'}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export function LiveDot({ status = 'ok' }: { status?: keyof typeof statusColor }) {
  return (
    <Box
      className={status === 'ok' ? 'rgos-live-dot' : undefined}
      sx={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        bgcolor: statusColor[status],
        flexShrink: 0,
        animation: status === 'ok' ? 'rgos-live-dot 2.4s ease-in-out infinite' : undefined,
      }}
    />
  );
}
