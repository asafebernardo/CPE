/**
 * Component-facing design tokens.
 *
 * Each value is a CSS custom property so the *same* component code adapts to
 * whichever theme is active (the variables are defined per-theme in
 * `tokens.css`, keyed by the `data-theme` attribute on <html>).
 *
 * IMPORTANT: these are `var(...)` strings — safe in `sx`, CSS template
 * literals and box-shadows. They are NOT safe to:
 *   - feed into MUI `createTheme` palette (use the per-theme concrete colors),
 *   - concatenate with a hex alpha suffix (use the `*Soft` tokens instead),
 *   - place in raw SVG presentation attributes (use inline `style` so the
 *     variable resolves — see Sparkline).
 */
export const acsColors = {
  bgPrimary: 'var(--acs-bg-primary)',
  bgSecondary: 'var(--acs-bg-secondary)',
  bgCard: 'var(--acs-bg-card)',
  bgInput: 'var(--acs-bg-input)',
  bgSidebar: 'var(--acs-bg-sidebar)',
  accent: 'var(--acs-accent)',
  accentHover: 'var(--acs-accent-hover)',
  textPrimary: 'var(--acs-text-primary)',
  textSecondary: 'var(--acs-text-secondary)',
  textMuted: 'var(--acs-text-muted)',
  border: 'var(--acs-border)',
  borderSubtle: 'var(--acs-border-subtle)',
  success: 'var(--acs-success)',
  warning: 'var(--acs-warning)',
  error: 'var(--acs-error)',

  // Pre-computed translucent fills (replace `${color}AA` hex concatenations,
  // which break with var()-based colors).
  accentSoft: 'var(--acs-accent-soft)',
  accentSoftStrong: 'var(--acs-accent-soft-strong)',
  successSoft: 'var(--acs-success-soft)',
  mutedSoft: 'var(--acs-muted-soft)',
};
