import { StrictMode, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import './theme/global.css';
import './theme/tokens.css';
import './os/design/osTokens.css';
import App from './App';
import { routerTheme } from './theme/routerTheme';
import { useUiStore } from './stores/uiStore';

function ThemedApp() {
  const uiMode = useUiStore((s) => s.uiMode);
  const theme = useMemo(
    () =>
      createTheme({
        ...routerTheme,
        spacing: uiMode === 'advanced' ? 6 : 8,
      }),
    [uiMode],
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemedApp />
  </StrictMode>,
);
