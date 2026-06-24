import { useEffect, useState } from 'react';
import { Box, Typography, Button, IconButton, TextField, Grid } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import api from '../services/api';
import { FormSection } from '../components/common/FormSection';
import { DataTable } from '../components/common/DataTable';
import { PageHeader } from '../components/common/PageHeader';
import type { FirewallRuleDto } from '@routergui/shared';

export function FirewallPage() {
  const [rules, setRules] = useState<FirewallRuleDto[]>([]);
  const [newRule, setNewRule] = useState<Partial<FirewallRuleDto>>({
    name: '',
    direction: 'inbound',
    protocol: 'TCP',
    action: 'allow',
    enabled: true,
  });

  const load = () => api.get('/firewall/rules').then((res) => setRules(res.data));

  useEffect(() => { load(); }, []);

  const addRule = async () => {
    await api.post('/firewall/rules', {
      ...newRule,
      sourceIp: 'any',
      destIp: 'any',
      sourcePort: 'any',
      destPort: 'any',
    });
    load();
  };

  const deleteRule = async (id: string) => {
    await api.delete(`/firewall/rules/${id}`);
    load();
  };

  return (
    <Box>
      <PageHeader title="Firewall" subtitle="Inbound and outbound packet filtering rules." />
      <FormSection title="Firewall Rules">
        <DataTable
          columns={[
            { key: 'name', label: 'Name' },
            { key: 'direction', label: 'Direction' },
            { key: 'protocol', label: 'Protocol' },
            { key: 'destPort', label: 'Port' },
            { key: 'action', label: 'Action' },
            { key: 'delete', label: '' },
          ]}
          rows={rules.map((r) => ({
            ...r,
            delete: (
              <IconButton size="small" onClick={() => deleteRule(r.id!)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            ),
          }))}
        />
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={3}>
            <TextField size="small" fullWidth label="Name" value={newRule.name} onChange={(e) => setNewRule({ ...newRule, name: e.target.value })} />
          </Grid>
          <Grid item xs={2}>
            <TextField size="small" fullWidth label="Protocol" value={newRule.protocol} onChange={(e) => setNewRule({ ...newRule, protocol: e.target.value as FirewallRuleDto['protocol'] })} />
          </Grid>
          <Grid item xs={2}>
            <TextField size="small" fullWidth label="Action" value={newRule.action} onChange={(e) => setNewRule({ ...newRule, action: e.target.value as FirewallRuleDto['action'] })} />
          </Grid>
          <Grid item xs={2}>
            <Button startIcon={<AddIcon />} onClick={addRule}>Add</Button>
          </Grid>
        </Grid>
      </FormSection>
    </Box>
  );
}
