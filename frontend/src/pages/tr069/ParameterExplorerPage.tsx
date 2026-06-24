import { useEffect, useState } from 'react';
import { Box, TextField } from '@mui/material';
import api from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { ParameterTree } from '../../components/tr069/ParameterTree';
import type { Tr098ParameterNodeDto } from '@routergui/shared';

export function ParameterExplorerPage() {
  const [nodes, setNodes] = useState<Tr098ParameterNodeDto[]>([]);
  const [search, setSearch] = useState('');

  const load = () => {
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    api.get(`/operational/tr069/parameters${q}`).then((res) => setNodes(res.data));
  };

  useEffect(() => { load(); }, [search]);

  const handleUpdate = async (path: string, value: string) => {
    await api.put('/operational/tr069/parameters', { path, value });
    load();
  };

  return (
    <Box>
      <PageHeader title="Parameter Explorer" subtitle="Browse and edit the InternetGatewayDevice parameter tree." />
      <TextField
        size="small"
        placeholder="Search parameters..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2, maxWidth: 400 }}
      />
      <ParameterTree nodes={nodes} onUpdate={handleUpdate} />
    </Box>
  );
}
