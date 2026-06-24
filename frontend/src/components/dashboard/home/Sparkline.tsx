import { Box } from '@mui/material';

/**
 * Lightweight inline sparkline. Renders a smooth area/line from a numeric series.
 * Series are derived deterministically from a seed so the widget looks alive
 * even though the simulator does not expose historical samples.
 */
function seededSeries(seed: number, points = 16): number[] {
  const out: number[] = [];
  let x = (seed % 1000) / 1000 + 0.1;
  for (let i = 0; i < points; i += 1) {
    x = (x * 9301 + 49297) % 233280 / 233280;
    const wave = 0.5 + 0.35 * Math.sin(i / 2 + seed) + 0.15 * x;
    out.push(Math.max(0.05, Math.min(1, wave)));
  }
  return out;
}

export function Sparkline({
  seed,
  color,
  height = 40,
}: {
  seed: number;
  color: string;
  height?: number;
}) {
  const series = seededSeries(seed);
  const w = 100;
  const h = 100;
  const step = w / (series.length - 1);
  const points = series.map((v, i) => `${(i * step).toFixed(1)},${(h - v * h).toFixed(1)}`);
  const line = points.join(' ');
  const area = `0,${h} ${line} ${w},${h}`;
  const gradId = `spark-${Math.round(seed)}`;

  return (
    <Box sx={{ width: '100%', height }}>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" width="100%" height="100%">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={area} fill={`url(#${gradId})`} />
        <polyline points={line} fill="none" stroke={color} strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
      </svg>
    </Box>
  );
}
