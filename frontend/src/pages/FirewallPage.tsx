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
  MenuItem,
  Switch,
  TextField,
  Alert,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import api from '../services/api';
import { FormSection } from '../components/common/FormSection';
import { PageHeader } from '../components/common/PageHeader';
import { ProfessionalTable } from '../components/common/ProfessionalTable';
import { ProtocolSelect } from '../components/common/ProtocolSelect';
import type { FirewallRuleDto, ProtocolOption } from '@aerobrry/shared';
import { isProtectedFirewallRule } from '@aerobrry/shared';

type FirewallRuleForm = Omit<FirewallRuleDto, 'id'>;

const EMPTY_RULE: FirewallRuleForm = {
  name: '',
  direction: 'inbound',
  protocol: 'TCP',
  sourceIp: 'any',
  destIp: 'any',
  sourcePort: 'any',
  destPort: 'any',
  action: 'allow',
  enabled: true,
};

function toProtocolOption(protocol: FirewallRuleDto['protocol']): ProtocolOption {
  if (protocol === 'UDP' || protocol === 'BOTH') return protocol;
  return 'TCP';
}

function formatProtocol(protocol: FirewallRuleDto['protocol']) {
  if (protocol === 'BOTH') return 'Both';
  return protocol;
}

export function FirewallPage() {
  const [rules, setRules] = useState<FirewallRuleDto[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FirewallRuleForm>(EMPTY_RULE);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const load = useCallback(() => {
    api.get('/firewall/rules').then((res) => setRules(res.data));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_RULE);
    setError(null);
    setDialogOpen(true);
  };

  const openEdit = (rule: FirewallRuleDto) => {
    setEditingId(rule.id ?? null);
    setForm({
      name: rule.name,
      direction: rule.direction,
      protocol: toProtocolOption(rule.protocol),
      sourceIp: rule.sourceIp,
      destIp: rule.destIp,
      sourcePort: rule.sourcePort,
      destPort: rule.destPort,
      action: rule.action,
      enabled: rule.enabled,
    });
    setError(null);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setError(null);
  };

  const saveRule = async () => {
    if (!form.name.trim()) {
      setError('Name is required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await api.put(`/firewall/rules/${editingId}`, form);
      } else {
        await api.post('/firewall/rules', form);
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

  const deleteRule = async (rule: FirewallRuleDto) => {
    if (!rule.id) return;
    if (isProtectedFirewallRule(rule)) {
      setError('HTTP and HTTPS firewall rules cannot be removed');
      return;
    }
    if (!confirm('Remove this firewall rule?')) return;
    try {
      await api.delete(`/firewall/rules/${rule.id}`);
      load();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? (e instanceof Error ? e.message : 'Failed to delete rule'));
    }
  };

  const toggleEnabled = async (rule: FirewallRuleDto, enabled: boolean) => {
    if (!rule.id) return;
    setTogglingId(rule.id);
    try {
      await api.put(`/firewall/rules/${rule.id}`, {
        name: rule.name,
        direction: rule.direction,
        protocol: toProtocolOption(rule.protocol),
        sourceIp: rule.sourceIp,
        destIp: rule.destIp,
        sourcePort: rule.sourcePort,
        destPort: rule.destPort,
        action: rule.action,
        enabled,
      });
      setRules((rows) => rows.map((r) => (r.id === rule.id ? { ...r, enabled } : r)));
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? (e instanceof Error ? e.message : 'Failed to update rule'));
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <Box>
      <PageHeader title="Firewall" subtitle="Inbound and outbound packet filtering rules." />
      <FormSection
        title="Firewall Rules"
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
            {
              key: 'direction',
              label: 'Direction',
              sortable: true,
              render: (r) => r.direction === 'inbound' ? 'Inbound' : 'Outbound',
            },
            {
              key: 'protocol',
              label: 'Protocol',
              sortable: true,
              render: (r) => formatProtocol(r.protocol),
            },
            { key: 'sourceIp', label: 'Source IP', sortable: true },
            { key: 'destIp', label: 'Dest IP', sortable: true },
            { key: 'sourcePort', label: 'Src Port', sortable: true },
            { key: 'destPort', label: 'Dest Port', sortable: true },
            {
              key: 'action',
              label: 'Action',
              sortable: true,
              render: (r) => r.action === 'allow' ? 'Allow' : 'Deny',
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
                  <Tooltip
                    title={isProtectedFirewallRule(r) ? 'HTTP/HTTPS rules cannot be removed' : 'Delete rule'}
                  >
                    <span>
                      <IconButton
                        size="small"
                        onClick={() => deleteRule(r)}
                        disabled={isProtectedFirewallRule(r)}
                        aria-label="Delete rule"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>
              ),
            },
          ]}
          rows={rules}
          searchKeys={['name', 'sourceIp', 'destIp', 'destPort']}
          searchPlaceholder="Search rules..."
        />
      </FormSection>

      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingId ? 'Edit Firewall Rule' : 'New Firewall Rule'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="Direction"
                value={form.direction}
                onChange={(e) => setForm({ ...form, direction: e.target.value as FirewallRuleDto['direction'] })}
              >
                <MenuItem value="inbound">Inbound</MenuItem>
                <MenuItem value="outbound">Outbound</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <ProtocolSelect
                value={toProtocolOption(form.protocol)}
                onChange={(protocol) => setForm({ ...form, protocol })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label="Action"
                value={form.action}
                onChange={(e) => setForm({ ...form, action: e.target.value as FirewallRuleDto['action'] })}
              >
                <MenuItem value="allow">Allow</MenuItem>
                <MenuItem value="deny">Deny</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
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
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Source IP"
                placeholder="any"
                value={form.sourceIp}
                onChange={(e) => setForm({ ...form, sourceIp: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Destination IP"
                placeholder="any"
                value={form.destIp}
                onChange={(e) => setForm({ ...form, destIp: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Source Port"
                placeholder="any"
                value={form.sourcePort}
                onChange={(e) => setForm({ ...form, sourcePort: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Destination Port"
                placeholder="any"
                value={form.destPort}
                onChange={(e) => setForm({ ...form, destPort: e.target.value })}
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
          <Button variant="contained" onClick={saveRule} disabled={saving}>
            {editingId ? 'Save' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
