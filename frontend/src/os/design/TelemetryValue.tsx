import { useEffect, useRef, useState } from 'react';
import { Typography } from '@mui/material';
import { acsColors } from '../../theme/colors';

export function TelemetryValue({
  value,
  suffix = '',
  decimals = 0,
}: {
  value: number;
  suffix?: string;
  decimals?: number;
}) {
  const [display, setDisplay] = useState(value);
  const target = useRef(value);

  useEffect(() => {
    target.current = value;
  }, [value]);

  useEffect(() => {
    let frame: number;
    const tick = () => {
      setDisplay((prev) => {
        const diff = target.current - prev;
        if (Math.abs(diff) < 0.01) return target.current;
        return prev + diff * 0.15;
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <Typography
      component="span"
      sx={{
        fontFamily: 'var(--rgos-font-mono)',
        fontWeight: 500,
        fontSize: '0.75rem',
        color: acsColors.textSecondary,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {display.toFixed(decimals)}
      {suffix}
    </Typography>
  );
}
