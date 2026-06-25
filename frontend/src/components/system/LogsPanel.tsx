import { useEffect, useState } from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import api from '../../services/api';
import { ProfessionalTable } from '../common/ProfessionalTable';
import type { LogEntryDto } from '@routergui/shared';

const CATEGORIES = [
  { key: 'system', label: 'System Logs', types: ['SYSTEM', 'DIAGNOSTIC'] },
  { key: 'tr069', label: 'TR-069 Events', types: ['INFORM', 'ACS_COMMAND'] },
  { key: 'security', label: 'Security Logs', types: ['LOGIN', 'PARAM_CHANGE', 'SECURITY'] },
];

export function LogsPanel() {
  const [tab, setTab] = useState(0);
  const [entries, setEntries] = useState<LogEntryDto[]>([]);

  useEffect(() => {
    api.get('/logs?limit=100').then((res) => setEntries(res.data.entries));
  }, []);

  const category = CATEGORIES[tab];
  const filtered = entries.filter((e) => category.types.includes(e.type));

  return (
    <Box>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        {CATEGORIES.map((c) => <Tab key={c.key} label={c.label} />)}
      </Tabs>
      <ProfessionalTable<LogEntryDto>
        columns={[
          { key: 'createdAt', label: 'Date/Time', sortable: true, render: (r) => new Date(r.createdAt).toLocaleString() },
          { key: 'type', label: 'Type', sortable: true },
          { key: 'message', label: 'Message' },
        ]}
        rows={filtered}
        searchKeys={['type', 'message']}
      />
    </Box>
  );
}
