import { useEffect } from 'react';
import { Box } from '@mui/material';
import { useOperationalStore } from '../stores/operationalStore';
import { acsColors } from '../theme/colors';
import { LazyNocDashboard } from '../os/modules/lazyModules';

export function DashboardPage() {
  const { data, fetch } = useOperationalStore();

  useEffect(() => {
    fetch();
    const interval = setInterval(fetch, 15000);
    return () => clearInterval(interval);
  }, [fetch]);

  if (!data) {
    return <Box sx={{ color: acsColors.textSecondary }}>Loading AeroBerry…</Box>;
  }

  return (
    <Box>
      <LazyNocDashboard data={data} />
    </Box>
  );
}
