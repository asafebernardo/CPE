import { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import api from '../services/api';
import { PageHeader } from '../components/common/PageHeader';
import { ProfessionalTable } from '../components/common/ProfessionalTable';

export function RoutingPage() {
  const [routes, setRoutes] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    api.get('/cpe/routes').then((res) => setRoutes(res.data));
  }, []);

  return (
    <Box>
      <PageHeader title="Routing" subtitle="Static routing table." />
      <ProfessionalTable
        columns={[
          { key: 'destination', label: 'Destination', sortable: true },
          { key: 'subnetMask', label: 'Mask' },
          { key: 'gateway', label: 'Gateway' },
          { key: 'interface', label: 'Interface' },
        ]}
        rows={routes}
      />
    </Box>
  );
}
