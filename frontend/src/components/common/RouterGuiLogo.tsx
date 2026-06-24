import { Box } from '@mui/material';

type RouterGuiLogoProps = {
  /** Full wordmark (default) or compact mark for sidebar */
  variant?: 'full' | 'compact';
  height?: number;
};

export function RouterGuiLogo({ variant = 'full', height }: RouterGuiLogoProps) {
  const h = height ?? (variant === 'compact' ? 32 : 48);

  return (
    <Box
      component="img"
      src="/icon.png"
      alt="RouterGui"
      sx={{
        height: h,
        width: 'auto',
        maxWidth: variant === 'compact' ? 72 : 120,
        objectFit: 'contain',
        display: 'block',
      }}
    />
  );
}
