/**
 * Default theme — OLED pure black enterprise palette.
 *
 * Concrete values for MUI palette math. Mirrored into `--acs-*` CSS variables
 * in tokens.css when the default theme is active.
 */
export const defaultColors = {
  bgPrimary: '#000000',
  bgSecondary: '#050505',
  bgCard: '#111111',
  bgInput: '#0A0A0A',
  bgSidebar: '#0A0A0A',
  accent: '#38BDF8',
  accentHover: '#60A5FA',
  textPrimary: '#F9FAFB',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  border: 'rgba(255,255,255,0.04)',
  borderSubtle: 'rgba(255,255,255,0.04)',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
} as const;
