import { useEffect, useState } from 'react';
import { Box, Chip } from '@mui/material';
import api from '../services/api';
import { PageHeader } from '../components/common/PageHeader';
import { ProfessionalTable } from '../components/common/ProfessionalTable';
import { useAuthStore } from '../stores/authStore';
import type { ConnectedHostExtendedDto } from '@routergui/shared';
import { acsColors } from '../theme/colors';

export function HostsPage() {
  const [hosts, setHosts] = useState<ConnectedHostExtendedDto[]>([]);
  const role = useAuthStore((s) => s.user?.role ?? 'USER');
  const showMac = role === 'TECHNICIAN' || role === 'ADMIN';

  useEffect(() => {
    api.get('/operational/hosts/extended').then((res) => setHosts(res.data));
    const interval = setInterval(() => {
      api.get('/operational/hosts/extended').then((res) => setHosts(res.data));
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const columns = [
    { key: 'hostname', label: 'Hostname', sortable: true },
    { key: 'ipAddress', label: 'IP', sortable: true },
    ...(showMac ? [{ key: 'macAddress', label: 'MAC', sortable: true }] : []),
    { key: 'interface', label: 'Interface', sortable: true },
    {
      key: 'status',
      label: 'Status',
      render: (r: ConnectedHostExtendedDto) => (
        <Chip
          size="small"
          label={r.status}
          sx={{ bgcolor: 'rgba(16,185,129,0.12)', color: acsColors.success, fontWeight: 600 }}
        />
      ),
    },
  ];

  return (
    <Box>
      <PageHeader title="Connected Devices" subtitle="Devices on your home network." />
      <ProfessionalTable<ConnectedHostExtendedDto>
        columns={columns}
        rows={hosts}
        searchKeys={showMac ? ['hostname', 'ipAddress', 'macAddress'] : ['hostname', 'ipAddress']}
        searchPlaceholder="Search devices..."
      />
    </Box>
  );
}
