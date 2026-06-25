import { useEffect } from 'react';
import { Box, Fade } from '@mui/material';
import { useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { ContentHeader } from './ContentHeader';
import { useWebSocket } from '../hooks/useWebSocket';
import { useOperationalStore } from '../stores/operationalStore';
import { acsColors } from '../theme/colors';

export function MainLayout({ children }: { children: React.ReactNode }) {
  useWebSocket();
  const fetchOperational = useOperationalStore((s) => s.fetch);
  const location = useLocation();

  useEffect(() => {
    fetchOperational();
    const interval = setInterval(fetchOperational, 30000);
    return () => clearInterval(interval);
  }, [fetchOperational]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        bgcolor: acsColors.bgPrimary,
      }}
    >
      <Navbar />
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <ContentHeader />
        <Fade in key={location.pathname} timeout={280}>
          <Box
            component="main"
            sx={{
              flex: 1,
              p: { xs: 2, md: 3 },
              bgcolor: acsColors.bgPrimary,
            }}
          >
            {children}
          </Box>
        </Fade>
      </Box>
    </Box>
  );
}
