import { useEffect, useState } from 'react';
import {
  Box, Button, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, ListSubheader,
  FormControlLabel, Switch, Grid, Typography, Alert, CircularProgress, Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { WanConfigDialog } from './WanConfigDialog';
import { PasswordField } from '../common/PasswordField';
import {
  WAN_SERVICE_TYPES,
  WAN_SERVICE_TYPES_COMBINED,
  WAN_SERVICE_TYPE_LABELS,
  type WanConnectionType,
  type WanInterfaceDto,
  type WanInterfaceInput,
  type WanServiceType,
} from '@aerobrry/shared';
import { useWanStore } from '../../stores/wanStore';
import { acsColors } from '../../theme/colors';

const CONNECTION_TYPES: WanConnectionType[] = ['DHCP', 'PPPoE', 'Static', 'Bridge'];

const EMPTY_FORM: WanInterfaceInput = {
  name: '',
  serviceType: 'INTERNET',
  connectionType: 'DHCP',
  enabled: true,
  ipAddress: '0.0.0.0',
  subnetMask: '255.255.255.0',
  gateway: '0.0.0.0',
  dnsPrimary: '8.8.8.8',
  dnsSecondary: '8.8.4.4',
  mtu: 1500,
  vlanEnabled: false,
  vlanId: 0,
  natEnabled: true,
  pppoeUsername: '',
  pppoePassword: '',
};

const serviceColor: Record<WanServiceType, string> = {
  INTERNET: acsColors.accent,
  VOIP: '#a78bfa',
  TR069: acsColors.warning,
  IPTV: '#f472b6',
  OTHER: acsColors.textMuted,
  BRIDGE: acsColors.textSecondary,
  INTERNET_TR069: '#34d399',
  INTERNET_VOIP: '#60a5fa',
  INTERNET_IPTV: '#fb7185',
  TR069_VOIP: '#c084fc',
  INTERNET_TR069_VOIP: '#2dd4bf',
};

export function WanInterfacesPanel() {
  const {
    interfaces,
    interfacesLoading,
    fetchInterfaces,
    createInterface,
    updateInterface,
    deleteInterface,
    toggleInterfaceEnabled,
    fetch,
  } = useWanStore();
  const [configOpen, setConfigOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<WanInterfaceInput>(EMPTY_FORM);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    fetchInterfaces();
    fetch();
  }, [fetchInterfaces, fetch]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
    setOpen(true);
  };

  const openEdit = (iface: WanInterfaceDto) => {
    setEditingId(iface.id);
    setForm({
      name: iface.name,
      serviceType: iface.serviceType,
      connectionType: iface.connectionType,
      enabled: iface.enabled,
      ipAddress: iface.ipAddress,
      subnetMask: iface.subnetMask,
      gateway: iface.gateway,
      dnsPrimary: iface.dnsPrimary,
      dnsSecondary: iface.dnsSecondary,
      mtu: iface.mtu,
      vlanEnabled: iface.vlanEnabled,
      vlanId: iface.vlanId,
      natEnabled: iface.natEnabled,
      pppoeUsername: iface.pppoeUsername,
      pppoePassword: '',
    });
    setError('');
    setOpen(true);
  };

  const patch = (p: Partial<WanInterfaceInput>) => setForm((f) => ({ ...f, ...p }));

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Name is required'); return; }
    setSaving(true);
    setError('');
    try {
      if (editingId) await updateInterface(editingId, form);
      else await createInterface(form);
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save interface');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (iface: WanInterfaceDto) => {
    if (!confirm(`Remove WAN interface "${iface.name}"?`)) return;
    try {
      await deleteInterface(iface.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete interface');
    }
  };

  const handleToggleEnabled = async (iface: WanInterfaceDto, enabled: boolean) => {
    setTogglingId(iface.id);
    setError('');
    try {
      await toggleInterfaceEnabled(iface.id, enabled);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update interface status');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" fontWeight={700}>WAN Interfaces</Typography>
          <Typography variant="caption" color="text.secondary">
            Multiple WAN service profiles (Internet, VoIP, TR-069, IPTV) like a real CPE.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>New WAN Interface</Button>
      </Box>

      {error && <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {interfacesLoading && interfaces.length === 0 ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: acsColors.textSecondary }}>
          <CircularProgress size={18} /> Loading interfaces...
        </Box>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, border: `1px solid ${acsColors.border}` }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                {['Name', 'Service', 'Mode', 'IP Address', 'VLAN', 'Enabled', 'Status', ''].map((h) => (
                  <TableCell key={h} sx={{ bgcolor: acsColors.bgSecondary, fontWeight: 600 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {interfaces.map((iface) => {
                const online = iface.status === 'connected' && iface.enabled;
                return (
                  <TableRow key={iface.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Typography variant="body2" fontWeight={600}>{iface.name}</Typography>
                        {iface.isDefault && (
                          <Chip size="small" label="Default" sx={{ height: 20, fontSize: '0.65rem' }} />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={WAN_SERVICE_TYPE_LABELS[iface.serviceType] ?? iface.serviceType}
                        sx={{ bgcolor: `${serviceColor[iface.serviceType]}22`, color: serviceColor[iface.serviceType], fontWeight: 600, height: 22 }}
                      />
                    </TableCell>
                    <TableCell>{iface.connectionType}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{iface.ipAddress}</TableCell>
                    <TableCell>{iface.vlanEnabled ? iface.vlanId : '—'}</TableCell>
                    <TableCell>
                      <Tooltip title={iface.enabled ? 'Disable interface' : 'Enable interface'}>
                        <Switch
                          size="small"
                          checked={iface.enabled}
                          disabled={togglingId === iface.id}
                          onChange={(e) => handleToggleEnabled(iface, e.target.checked)}
                        />
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: online ? acsColors.success : acsColors.textMuted }} />
                        <Typography variant="body2" sx={{ color: online ? acsColors.success : acsColors.textMuted }}>
                          {iface.enabled ? (online ? 'Up' : 'Down') : 'Disabled'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      {iface.isDefault ? (
                        <Tooltip title="Edit WAN configuration">
                          <IconButton size="small" onClick={() => setConfigOpen(true)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <>
                          <IconButton size="small" onClick={() => openEdit(iface)}><EditIcon fontSize="small" /></IconButton>
                          <IconButton size="small" onClick={() => handleDelete(iface)}><DeleteIcon fontSize="small" /></IconButton>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingId ? 'Edit WAN Interface' : 'New WAN Interface'}</DialogTitle>
        <DialogContent dividers>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Interface Name" value={form.name} onChange={(e) => patch({ name: e.target.value })} placeholder="e.g. VoIP-WAN" />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField select fullWidth label="Service Type" value={form.serviceType} onChange={(e) => patch({ serviceType: e.target.value as WanServiceType })}>
                <ListSubheader sx={{ bgcolor: 'transparent', fontWeight: 700, lineHeight: '2.2em' }}>Single Service</ListSubheader>
                {WAN_SERVICE_TYPES.filter((t) => !WAN_SERVICE_TYPES_COMBINED.includes(t)).map((t) => (
                  <MenuItem key={t} value={t}>{WAN_SERVICE_TYPE_LABELS[t]}</MenuItem>
                ))}
                <ListSubheader sx={{ bgcolor: 'transparent', fontWeight: 700, lineHeight: '2.2em' }}>Combined Service</ListSubheader>
                {WAN_SERVICE_TYPES_COMBINED.map((t) => (
                  <MenuItem key={t} value={t}>{WAN_SERVICE_TYPE_LABELS[t]}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField select fullWidth label="Connection Mode" value={form.connectionType} onChange={(e) => patch({ connectionType: e.target.value as WanConnectionType })}>
                {CONNECTION_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
            </Grid>

            {form.connectionType === 'Static' && (
              <>
                <Grid item xs={12} md={4}><TextField fullWidth label="IP Address" value={form.ipAddress} onChange={(e) => patch({ ipAddress: e.target.value })} /></Grid>
                <Grid item xs={12} md={4}><TextField fullWidth label="Subnet Mask" value={form.subnetMask} onChange={(e) => patch({ subnetMask: e.target.value })} /></Grid>
                <Grid item xs={12} md={4}><TextField fullWidth label="Gateway" value={form.gateway} onChange={(e) => patch({ gateway: e.target.value })} /></Grid>
              </>
            )}

            {form.connectionType === 'PPPoE' && (
              <>
                <Grid item xs={12} md={6}><TextField fullWidth label="PPPoE Username" value={form.pppoeUsername} onChange={(e) => patch({ pppoeUsername: e.target.value })} /></Grid>
                <Grid item xs={12} md={6}><PasswordField fullWidth label="PPPoE Password" value={form.pppoePassword} onChange={(e) => patch({ pppoePassword: e.target.value })} /></Grid>
              </>
            )}

            <Grid item xs={12} md={4}><TextField fullWidth label="Primary DNS" value={form.dnsPrimary} onChange={(e) => patch({ dnsPrimary: e.target.value })} /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="Secondary DNS" value={form.dnsSecondary} onChange={(e) => patch({ dnsSecondary: e.target.value })} /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth type="number" label="MTU" value={form.mtu} onChange={(e) => patch({ mtu: parseInt(e.target.value) || 1500 })} /></Grid>

            <Grid item xs={12} md={4}>
              <FormControlLabel control={<Switch checked={form.vlanEnabled} onChange={(e) => patch({ vlanEnabled: e.target.checked })} />} label="VLAN Tagging" />
            </Grid>
            {form.vlanEnabled && (
              <Grid item xs={12} md={4}><TextField fullWidth type="number" label="VLAN ID" value={form.vlanId} onChange={(e) => patch({ vlanId: parseInt(e.target.value) || 0 })} /></Grid>
            )}
            <Grid item xs={12} md={4}>
              <FormControlLabel control={<Switch checked={form.natEnabled} onChange={(e) => patch({ natEnabled: e.target.checked })} />} label="NAT" />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel control={<Switch checked={form.enabled} onChange={(e) => patch({ enabled: e.target.checked })} />} label="Interface Enabled" />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Interface'}
          </Button>
        </DialogActions>
      </Dialog>

      <WanConfigDialog open={configOpen} onClose={() => setConfigOpen(false)} />
    </Box>
  );
}
