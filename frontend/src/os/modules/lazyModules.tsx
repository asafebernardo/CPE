import { lazy, Suspense } from 'react';
import { Box, CircularProgress } from '@mui/material';

const NocDashboard = lazy(() =>
  import('../dashboard/NocDashboard').then((m) => ({ default: m.NocDashboard })),
);

const LiveTopology = lazy(() =>
  import('../topology/LiveTopology').then((m) => ({ default: m.LiveTopology })),
);

function LazyFallback() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
      <CircularProgress size={28} />
    </Box>
  );
}

export function LazyNocDashboard(props: React.ComponentProps<typeof NocDashboard>) {
  return (
    <Suspense fallback={<LazyFallback />}>
      <NocDashboard {...props} />
    </Suspense>
  );
}

export function LazyLiveTopology(props: React.ComponentProps<typeof LiveTopology>) {
  return (
    <Suspense fallback={<LazyFallback />}>
      <LiveTopology {...props} />
    </Suspense>
  );
}
