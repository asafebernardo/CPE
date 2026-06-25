import { useEffect, useState } from 'react';
import { Box, Fade } from '@mui/material';
import { useLocation } from 'react-router-dom';
import { TelemetryBar } from './TelemetryBar';
import { IconRail } from './IconRail';
import { ContextPanel, MobileNavDrawer } from './ContextPanel';
import { EnvironmentBackdrop } from './EnvironmentBackdrop';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useOperationalStore } from '../../stores/operationalStore';
import { useCapabilitiesStore } from '../capabilities/capabilitiesStore';
import { useUiStore } from '../../stores/uiStore';
import { useEnvironment } from '../hooks/useEnvironment';
import { acsColors } from '../../theme/colors';

export function OsShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const env = useEnvironment();
  const [mobileNav, setMobileNav] = useState(false);
  const fetchOperational = useOperationalStore((s) => s.fetch);
  const fetchCapabilities = useCapabilitiesStore((s) => s.fetch);
  const uiMode = useUiStore((s) => s.uiMode);

  useWebSocket();

  useEffect(() => {
    document.documentElement.setAttribute('data-ui-mode', uiMode);
  }, [uiMode]);

  useEffect(() => {
    fetchCapabilities();
    fetchOperational();
    const interval = setInterval(fetchOperational, 30000);
    return () => clearInterval(interval);
  }, [fetchOperational, fetchCapabilities]);

  return (
    <Box
      data-environment={env}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        bgcolor: acsColors.bgPrimary,
        position: 'relative',
      }}
    >
      <EnvironmentBackdrop />
      <TelemetryBar onMenuClick={() => setMobileNav(true)} />
      <MobileNavDrawer open={mobileNav} onClose={() => setMobileNav(false)} />

      <Box sx={{ display: 'flex', flex: 1, minHeight: 0, position: 'relative', zIndex: 1 }}>
        <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
          <IconRail />
          <ContextPanel />
        </Box>

        <Fade in key={location.pathname} timeout={280}>
          <Box
            component="main"
            sx={{
              flex: 1,
              minWidth: 0,
              overflow: 'auto',
              p: { xs: 2, md: 'var(--rgos-density-padding)' },
              gap: 'var(--rgos-density-gap)',
            }}
          >
            {children}
          </Box>
        </Fade>
      </Box>

      {/* Mobile bottom icon rail */}
      <Box
        sx={{
          display: { xs: 'block', md: 'none' },
          position: 'sticky',
          bottom: 0,
          borderTop: `1px solid ${acsColors.border}`,
          bgcolor: 'var(--rgos-layer-1)',
          zIndex: 10,
        }}
      >
        <IconRail horizontal />
      </Box>
    </Box>
  );
}
