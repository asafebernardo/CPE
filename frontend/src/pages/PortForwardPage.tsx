import { useEffect, useState } from 'react';
import { Box, Button, Grid, TextField, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../services/api';
import { PageHeader } from '../components/common/PageHeader';
import { FormSection } from '../components/common/FormSection';
import { ProfessionalTable } from '../components/common/ProfessionalTable';
import type { PortForwardDto } from '@routergui/shared';

export function PortForwardPage() {
  const [portForwards, setPortForwards] = useState<PortForwardDto[]>([]);
  const [newPf, setNewPf] = useState<Partial<PortForwardDto>>({
    name: '',
    externalPort: 8080,
    internalIp: '',
    internalPort: 80,
    protocol: 'TCP',
    enabled: true,
  });

  const load = () => api.get('/firewall/port-forward').then((res) => setPortForwards(res.data));

  useEffect(() => { load(); }, []);

  const addPortForward = async () => {
    await api.post('/firewall/port-forward', newPf);
    setNewPf({ name: '', externalPort: 8080, internalIp: '', internalPort: 80, protocol: 'TCP', enabled: true });
    load();
  };

  const deletePortForward = async (id: string) => {
    await api.delete(`/firewall/port-forward/${id}`);
    load();
  };

  return (
    <Box>
      <PageHeader title="Port Forward" subtitle="Map external ports to internal LAN hosts." />
      <FormSection title="Forwarding Rules">
        <ProfessionalTable
          columns={[
            { key: 'name', label: 'Name', sortable: true },
            { key: 'externalPort', label: 'External', sortable: true },
            { key: 'internalIp', label: 'Internal IP', sortable: true },
            { key: 'internalPort', label: 'Internal Port', sortable: true },
            { key: 'protocol', label: 'Protocol', sortable: true },
            {
              key: 'enabled',
              label: 'Enabled',
              render: (r) => r.enabled ? 'Yes' : 'No',
            },
            {
              key: 'id',
              label: '',
              render: (r) => (
                <IconButton size="small" onClick={() => deletePortForward(r.id!)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              ),
            },
          ]}
          rows={portForwards}
          searchKeys={['name', 'internalIp']}
          searchPlaceholder="Search rules..."
        />
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={12} sm={3}>
            <TextField size="small" fullWidth label="Name" value={newPf.name} onChange={(e) => setNewPf({ ...newPf, name: e.target.value })} />
          </Grid>
          <Grid item xs={6} sm={2}>
            <TextField size="small" fullWidth label="Ext Port" type="number" value={newPf.externalPort} onChange={(e) => setNewPf({ ...newPf, externalPort: parseInt(e.target.value) })} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField size="small" fullWidth label="Internal IP" value={newPf.internalIp} onChange={(e) => setNewPf({ ...newPf, internalIp: e.target.value })} />
          </Grid>
          <Grid item xs={6} sm={2}>
            <TextField size="small" fullWidth label="Int Port" type="number" value={newPf.internalPort} onChange={(e) => setNewPf({ ...newPf, internalPort: parseInt(e.target.value) })} />
          </Grid>
          <Grid item xs={6} sm={2}>
            <Button startIcon={<AddIcon />} onClick={addPortForward} fullWidth sx={{ height: 40 }}>Add</Button>
          </Grid>
        </Grid>
      </FormSection>
    </Box>
  );
}
