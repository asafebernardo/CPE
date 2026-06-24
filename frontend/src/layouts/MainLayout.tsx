import { useEffect } from 'react';
import { Box } from '@mui/material';
import { Navbar } from './Navbar';
import { Sidebar, sidebarWidth } from './Sidebar';
import { useWebSocket } from '../hooks/useWebSocket';
import { useOperationalStore } from '../stores/operationalStore';
import { acsColors } from '../theme/colors';

export function MainLayout({ children }: { children: React.ReactNode }) {
  useWebSocket();
  const fetchOperational = useOperationalStore((s) => s.fetch);

  useEffect(() => {
    fetchOperational();
    const interval = setInterval(fetchOperational, 30000);
    return () => clearInterval(interval);
  }, [fetchOperational]);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: acsColors.bgPrimary }}>
      <Sidebar />
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          width: `calc(100% - ${sidebarWidth}px)`,
        }}
      >
        <Navbar />
        <Box
          component="main"
          sx={{
            flex: 1,
            p: 3,
            bgcolor: acsColors.bgPrimary,
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
