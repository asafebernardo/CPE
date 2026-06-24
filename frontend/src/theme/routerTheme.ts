import { createTheme } from '@mui/material/styles';
import { acsColors } from './colors';

export const routerTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: acsColors.accent,
      light: acsColors.accentHover,
      dark: '#06b6d4',
      contrastText: acsColors.bgPrimary,
    },
    secondary: {
      main: acsColors.bgCard,
      contrastText: acsColors.textPrimary,
    },
    background: {
      default: acsColors.bgPrimary,
      paper: acsColors.bgCard,
    },
    text: {
      primary: acsColors.textPrimary,
      secondary: acsColors.textSecondary,
    },
    divider: acsColors.border,
    success: { main: acsColors.success },
    warning: { main: acsColors.warning },
    error: { main: acsColors.error },
  },
  typography: {
    fontFamily: 'Inter, Roboto, -apple-system, BlinkMacSystemFont, sans-serif',
    h4: { fontWeight: 700, color: acsColors.textPrimary },
    h5: { fontWeight: 700, color: acsColors.textPrimary, fontSize: '1.5rem' },
    h6: { fontWeight: 600, color: acsColors.textPrimary },
    body2: { color: acsColors.textSecondary },
    subtitle1: { color: acsColors.textPrimary },
    subtitle2: { color: acsColors.textSecondary },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          scrollbarWidth: 'thin',
          scrollbarColor: `${acsColors.border} ${acsColors.bgPrimary}`,
        },
        body: {
          backgroundColor: acsColors.bgPrimary,
          color: acsColors.textPrimary,
          scrollbarWidth: 'thin',
          scrollbarColor: `${acsColors.border} ${acsColors.bgPrimary}`,
        },
        '#root': {
          minHeight: '100vh',
          backgroundColor: acsColors.bgPrimary,
        },
        '*': {
          scrollbarWidth: 'thin',
          scrollbarColor: `${acsColors.border} ${acsColors.bgSecondary}`,
        },
        '*::-webkit-scrollbar': {
          width: 8,
          height: 8,
        },
        '*::-webkit-scrollbar-track': {
          background: acsColors.bgPrimary,
          borderRadius: 4,
        },
        '*::-webkit-scrollbar-thumb': {
          background: acsColors.border,
          borderRadius: 4,
          border: `2px solid ${acsColors.bgPrimary}`,
        },
        '*::-webkit-scrollbar-thumb:hover': {
          background: acsColors.accent,
        },
        '*::-webkit-scrollbar-corner': {
          background: acsColors.bgPrimary,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: acsColors.bgSecondary,
          borderBottom: `1px solid ${acsColors.border}`,
          boxShadow: 'none',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: acsColors.bgSidebar,
          borderRight: `1px solid ${acsColors.borderSubtle}`,
          color: acsColors.textPrimary,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: acsColors.bgCard,
          borderRadius: 10,
          border: `1px solid ${acsColors.border}`,
          boxShadow: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: acsColors.bgCard,
          borderColor: acsColors.border,
        },
        outlined: {
          border: `1px solid ${acsColors.border}`,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
        contained: {
          backgroundColor: acsColors.accent,
          color: acsColors.bgPrimary,
          '&:hover': { backgroundColor: acsColors.accentHover },
        },
        outlined: {
          borderColor: acsColors.border,
          color: acsColors.textPrimary,
          '&:hover': {
            borderColor: acsColors.accent,
            backgroundColor: 'rgba(34, 211, 238, 0.08)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: acsColors.bgInput,
            borderRadius: 8,
            '& fieldset': { borderColor: acsColors.border },
            '&:hover fieldset': { borderColor: acsColors.accent },
            '&.Mui-focused fieldset': { borderColor: acsColors.accent },
          },
          '& .MuiInputLabel-root': { color: acsColors.textSecondary },
          '& .MuiInputLabel-root.Mui-focused': { color: acsColors.accent },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: acsColors.border,
          color: acsColors.textPrimary,
        },
        head: {
          backgroundColor: acsColors.bgSecondary,
          color: acsColors.textSecondary,
          fontWeight: 600,
          fontSize: '0.8125rem',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': { backgroundColor: 'rgba(34, 211, 238, 0.04)' },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 6, fontWeight: 500 },
        filled: {
          '&.MuiChip-colorSuccess': {
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            color: acsColors.success,
          },
          '&.MuiChip-colorPrimary': {
            backgroundColor: 'rgba(34, 211, 238, 0.15)',
            color: acsColors.accent,
          },
          '&.MuiChip-colorWarning': {
            backgroundColor: 'rgba(245, 158, 11, 0.15)',
            color: acsColors.warning,
          },
        },
        outlined: {
          borderColor: acsColors.border,
          color: acsColors.textSecondary,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '2px 8px',
          '&.Mui-selected': {
            backgroundColor: 'rgba(34, 211, 238, 0.12)',
            borderLeft: `3px solid ${acsColors.accent}`,
            '&:hover': { backgroundColor: 'rgba(34, 211, 238, 0.16)' },
          },
          '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.04)' },
        },
      },
    },
    MuiListSubheader: {
      styleOverrides: {
        root: {
          backgroundColor: 'transparent',
          color: acsColors.textMuted,
          fontSize: '0.7rem',
          fontWeight: 600,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          lineHeight: 2.5,
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: { borderBottom: `1px solid ${acsColors.border}` },
        indicator: { backgroundColor: acsColors.accent },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          color: acsColors.textSecondary,
          textTransform: 'none',
          fontWeight: 500,
          '&.Mui-selected': { color: acsColors.accent },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 8 },
        standardSuccess: {
          backgroundColor: 'rgba(16, 185, 129, 0.12)',
          color: acsColors.success,
        },
        standardInfo: {
          backgroundColor: 'rgba(34, 211, 238, 0.12)',
          color: acsColors.accent,
        },
        standardError: {
          backgroundColor: 'rgba(239, 68, 68, 0.12)',
          color: acsColors.error,
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: acsColors.border },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        switchBase: {
          '&.Mui-checked': { color: acsColors.accent },
          '&.Mui-checked + .MuiSwitch-track': { backgroundColor: acsColors.accent },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: acsColors.textSecondary,
          '&:hover': { color: acsColors.accent, backgroundColor: 'rgba(34, 211, 238, 0.08)' },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: { color: acsColors.textSecondary, minWidth: 40 },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: { minHeight: 56 },
      },
    },
  },
});
