import type { Theme } from '@mui/material/styles';
import { defaultTheme } from './default/theme';

export type ThemeId = 'default';

export interface ThemeDefinition {
  id: ThemeId;
  label: string;
  description: string;
  theme: Theme;
}

export const THEMES: Record<ThemeId, ThemeDefinition> = {
  default: {
    id: 'default',
    label: 'Default',
    description: 'Painel enterprise OLED',
    theme: defaultTheme,
  },
};

export const THEME_LIST: ThemeDefinition[] = Object.values(THEMES);

export const DEFAULT_THEME_ID: ThemeId = 'default';

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === 'string' && value in THEMES;
}

export function getTheme(id: ThemeId): Theme {
  return THEMES[id]?.theme ?? THEMES.default.theme;
}
