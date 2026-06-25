import { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  Switch,
  TextField,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import api from '../services/api';
import { PageHeader } from '../components/common/PageHeader';
import { FormSection } from '../components/common/FormSection';
import { ProfessionalTable } from '../components/common/ProfessionalTable';
import { ProtocolSelect } from '../components/common/ProtocolSelect';
import type { PortForwardDto } from '@aerobrry/shared';

type PortForwardForm = Omit<PortForwardDto, 'id'>;

const EMPTY_PF: PortForwardForm = {
  name: '',
  externalPort: 8080,
  internalIp: '',
  internalPort: 80,
  protocol: 'TCP',
  enabled: true,
};

export function PortForwardPage() {
  const [portForwards, setPortForwards] = useState<PortForwardDto[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PortForwardForm>(EMPTY_PF);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const load = useCallback(() => {
    api.get('/firewall/port-forward').then((res) => setPortForwards(res.data));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_PF);
    setError(null);
    setDialogOpen(true);
  };

  const openEdit = (pf: PortForwardDto) => {
    setEditingId(pf.id ?? null);
    setForm({
      name: pf.name,
      externalPort: pf.externalPort,
      internalIp: pf.internalIp,
      internalPort: pf.internalPort,
      protocol: pf.protocol,
      enabled: pf.enabled,
    });
    setError(null);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setError(null);
  };

  const savePortForward = async () => {
    if (!form.name.trim()) {
      setError('Name is required');
      return;
    }
    if (!form.internalIp.trim()) {
      setError('Internal IP is required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await api.put(`/firewall/port-forward/${editingId}`, form);
      } else {
        await api.post('/firewall/port-forward', form);
      }
      closeDialog();
      load();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? (e instanceof Error ? e.message : 'Failed to save rule'));
    } finally {
      setSaving(false);
    }
  };

  const deletePortForward = async (id: string) => {
    if (!confirm('Remove this port forward rule?')) return;
    await api.delete(`/firewall/port-forward/${id}`);
    load();
  };

  const toggleEnabled = async (pf: PortForwardDto, enabled: boolean) => {
    if (!pf.id) return;
    setTogglingId(pf.id);
    try {
      await api.put(`/firewall/port-forward/${pf.id}`, {
        name: pf.name,
        externalPort: pf.externalPort,
        internalIp: pf.internalIp,
        internalPort: pf.internalPort,
        protocol: pf.protocol,
        enabled,
      });
      setPortForwards((rows) => rows.map((r) => (r.id === pf.id ? { ...r, enabled } : r)));
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? (e instanceof Error ? e.message : 'Failed to update rule'));
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <Box>
      <PageHeader title="Port Forward" subtitle="Map external ports to internal LAN hosts." />
      <FormSection
        title="Forwarding Rules"
        action={
          <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={openAdd}>
            Add Rule
          </Button>
        }
      >
        {error && !dialogOpen && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        <ProfessionalTable
          columns={[
            { key: 'name', label: 'Name', sortable: true },
            { key: 'externalPort', label: 'External Port', sortable: true },
            { key: 'internalIp', label: 'Internal IP', sortable: true },
            { key: 'internalPort', label: 'Internal Port', sortable: true },
            {
              key: 'protocol',
              label: 'Protocol',
              sortable: true,
              render: (r) => (r.protocol === 'BOTH' ? 'Both' : r.protocol),
            },
            {
              key: 'enabled',
              label: 'Enabled',
              render: (r) => (
                <Switch
                  size="small"
                  checked={r.enabled}
                  disabled={togglingId === r.id}
                  onChange={(e) => toggleEnabled(r, e.target.checked)}
                />
              ),
            },
            {
              key: 'id',
              label: '',
              render: (r) => (
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <IconButton size="small" onClick={() => openEdit(r)} aria-label="Edit rule">
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => deletePortForward(r.id!)} aria-label="Delete rule">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ),
            },
          ]}
          rows={portForwards}
          searchKeys={['name', 'internalIp']}
          searchPlaceholder="Search rules..."
        />
      </FormSection>

      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit Port Forward Rule' : 'New Port Forward Rule'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="External Port"
                type="number"
                value={form.externalPort}
                onChange={(e) => setForm({ ...form, externalPort: parseInt(e.target.value, 10) || 0 })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Internal Port"
                type="number"
                value={form.internalPort}
                onChange={(e) => setForm({ ...form, internalPort: parseInt(e.target.value, 10) || 0 })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Internal IP"
                placeholder="192.168.1.50"
                value={form.internalIp}
                onChange={(e) => setForm({ ...form, internalIp: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <ProtocolSelect
                value={form.protocol}
                onChange={(protocol) => setForm({ ...form, protocol })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.enabled}
                    onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
                  />
                }
                label="Enabled"
              />
            </Grid>
            {error && (
              <Grid item xs={12}>
                <Box sx={{ color: 'error.main', fontSize: '0.875rem' }}>{error}</Box>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button variant="contained" onClick={savePortForward} disabled={saving}>
            {editingId ? 'Save' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
