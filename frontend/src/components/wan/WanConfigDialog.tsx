import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  MenuItem,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { FormSection } from '../common/FormSection';
import { PasswordField } from '../common/PasswordField';
import { useWanStore } from '../../stores/wanStore';
import type { WanConnectionType, WanDashboardDto } from '@routergui/shared';

const CONNECTION_TYPES: WanConnectionType[] = ['DHCP', 'PPPoE', 'Static', 'Bridge'];
const FUTURE_TYPES = ['L2TP', 'PPTP', 'IPoE', 'DS-Lite', 'MAP-T', 'MAP-E'];

function formatSessionTime(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}h ${m}m ${sec}s`;
}

export function WanConfigDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { data, saveConfig, runAction, actionLoading, fetch, fetchInterfaces } = useWanStore();
  const [cfg, setCfg] = useState<WanDashboardDto['config'] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && data) {
      setCfg({ ...data.config });
      setError('');
    }
  }, [open, data]);

  if (!cfg) return null;

  const updateConfig = (patch: Partial<WanDashboardDto['config']>) => {
    setCfg((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const handleSave = async () => {
    setError('');
    try {
      await saveConfig({
        connectionType: cfg.connectionType,
        ipAddress: cfg.ipv4.ipAddress,
        subnetMask: cfg.ipv4.subnetMask,
        gateway: cfg.ipv4.gateway,
        mtu: cfg.ipv4.mtu,
        dnsPrimary: cfg.dns.primary,
        dnsSecondary: cfg.dns.secondary,
        dnsAuto: cfg.dns.auto,
        pppoeUsername: cfg.pppoe.username,
        pppoePassword: cfg.pppoe.password,
        pppoeServiceName: cfg.pppoe.serviceName,
        pppoeAcName: cfg.pppoe.acName,
        pppoeMtu: cfg.pppoe.mtu,
        vlanEnabled: cfg.vlan.enabled,
        vlanId: cfg.vlan.vlanId,
        vlanPriority: cfg.vlan.priority,
        natEnabled: cfg.nat.enabled,
        natType: cfg.nat.type,
        ipv6Enabled: cfg.ipv6.enabled,
        slaacEnabled: cfg.ipv6.slaac,
        dhcpv6Enabled: cfg.ipv6.dhcpv6,
        prefixDelegation: cfg.ipv6.prefixDelegation,
        wanAddress: cfg.ipv6.wanAddress,
        wanGateway: cfg.ipv6.gateway,
        wanDns: cfg.ipv6.dns,
        prefixLength: cfg.ipv6.prefixLength,
      });
      await fetch();
      await fetchInterfaces();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save configuration');
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 700 }}>WAN Configuration</DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <FormSection title="Connection Type">
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="WAN Mode"
                value={cfg.connectionType}
                onChange={(e) => updateConfig({ connectionType: e.target.value as WanConnectionType })}
              >
                {CONNECTION_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, pt: 1 }}>
                {FUTURE_TYPES.map((t) => (
                  <Chip key={t} size="small" label={t} disabled sx={{ opacity: 0.5 }} />
                ))}
              </Box>
              <Typography variant="caption" color="text.secondary">Future connection modes</Typography>
            </Grid>
          </Grid>
        </FormSection>

        <FormSection title="IPv4 Settings">
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="IP Address" value={cfg.ipv4.ipAddress} onChange={(e) => updateConfig({ ipv4: { ...cfg.ipv4, ipAddress: e.target.value } })} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="Subnet Mask" value={cfg.ipv4.subnetMask} onChange={(e) => updateConfig({ ipv4: { ...cfg.ipv4, subnetMask: e.target.value } })} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="Default Gateway" value={cfg.ipv4.gateway} onChange={(e) => updateConfig({ ipv4: { ...cfg.ipv4, gateway: e.target.value } })} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="MTU" type="number" value={cfg.ipv4.mtu} onChange={(e) => updateConfig({ ipv4: { ...cfg.ipv4, mtu: parseInt(e.target.value) } })} />
            </Grid>
          </Grid>
        </FormSection>

        <FormSection title="DNS">
          <FormControlLabel control={<Switch checked={cfg.dns.auto} onChange={(e) => updateConfig({ dns: { ...cfg.dns, auto: e.target.checked } })} />} label="Automatic DNS" />
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Primary DNS" value={cfg.dns.primary} disabled={cfg.dns.auto} onChange={(e) => updateConfig({ dns: { ...cfg.dns, primary: e.target.value } })} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Secondary DNS" value={cfg.dns.secondary} disabled={cfg.dns.auto} onChange={(e) => updateConfig({ dns: { ...cfg.dns, secondary: e.target.value } })} />
            </Grid>
          </Grid>
        </FormSection>

        {cfg.connectionType === 'PPPoE' && (
          <FormSection title="PPPoE">
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Username" value={cfg.pppoe.username} onChange={(e) => updateConfig({ pppoe: { ...cfg.pppoe, username: e.target.value } })} />
              </Grid>
              <Grid item xs={12} md={6}>
                <PasswordField fullWidth label="Password" value={cfg.pppoe.password} onChange={(e) => updateConfig({ pppoe: { ...cfg.pppoe, password: e.target.value } })} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="Service Name" value={cfg.pppoe.serviceName} onChange={(e) => updateConfig({ pppoe: { ...cfg.pppoe, serviceName: e.target.value } })} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="AC Name" value={cfg.pppoe.acName} onChange={(e) => updateConfig({ pppoe: { ...cfg.pppoe, acName: e.target.value } })} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="MTU" type="number" value={cfg.pppoe.mtu} onChange={(e) => updateConfig({ pppoe: { ...cfg.pppoe, mtu: parseInt(e.target.value) } })} />
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="caption" color="text.secondary">Session Time</Typography>
                <Typography fontWeight={600}>{formatSessionTime(cfg.pppoe.sessionTimeSeconds)}</Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="caption" color="text.secondary">Auth Status</Typography>
                <Typography fontWeight={600}>{cfg.pppoe.authStatus}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button variant="contained" disabled={actionLoading} onClick={() => runAction('pppoe-connect')}>Connect</Button>
                  <Button variant="outlined" disabled={actionLoading} onClick={() => runAction('pppoe-disconnect')}>Disconnect</Button>
                </Box>
              </Grid>
            </Grid>
          </FormSection>
        )}

        <FormSection title="IPv6">
          <FormControlLabel control={<Switch checked={cfg.ipv6.enabled} onChange={(e) => updateConfig({ ipv6: { ...cfg.ipv6, enabled: e.target.checked } })} />} label="Enable IPv6" />
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={3}>
              <FormControlLabel control={<Switch checked={cfg.ipv6.slaac} onChange={(e) => updateConfig({ ipv6: { ...cfg.ipv6, slaac: e.target.checked } })} />} label="SLAAC" />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControlLabel control={<Switch checked={cfg.ipv6.dhcpv6} onChange={(e) => updateConfig({ ipv6: { ...cfg.ipv6, dhcpv6: e.target.checked } })} />} label="DHCPv6" />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControlLabel control={<Switch checked={cfg.ipv6.prefixDelegation} onChange={(e) => updateConfig({ ipv6: { ...cfg.ipv6, prefixDelegation: e.target.checked } })} />} label="Prefix Delegation" />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="IPv6 WAN Address" value={cfg.ipv6.wanAddress} onChange={(e) => updateConfig({ ipv6: { ...cfg.ipv6, wanAddress: e.target.value } })} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="Gateway IPv6" value={cfg.ipv6.gateway} onChange={(e) => updateConfig({ ipv6: { ...cfg.ipv6, gateway: e.target.value } })} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="DNS IPv6" value={cfg.ipv6.dns} onChange={(e) => updateConfig({ ipv6: { ...cfg.ipv6, dns: e.target.value } })} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="Prefix Length" type="number" value={cfg.ipv6.prefixLength} onChange={(e) => updateConfig({ ipv6: { ...cfg.ipv6, prefixLength: parseInt(e.target.value) } })} />
            </Grid>
          </Grid>
        </FormSection>

        <FormSection title="VLAN">
          <FormControlLabel control={<Switch checked={cfg.vlan.enabled} onChange={(e) => updateConfig({ vlan: { ...cfg.vlan, enabled: e.target.checked, status: e.target.checked ? 'active' : 'inactive' } })} />} label="Enable VLAN" />
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="VLAN ID" type="number" value={cfg.vlan.vlanId} onChange={(e) => updateConfig({ vlan: { ...cfg.vlan, vlanId: parseInt(e.target.value) } })} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="802.1p Priority" type="number" value={cfg.vlan.priority} onChange={(e) => updateConfig({ vlan: { ...cfg.vlan, priority: parseInt(e.target.value) } })} />
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="caption" color="text.secondary">VLAN Status</Typography>
              <Typography fontWeight={600}>{cfg.vlan.status}</Typography>
            </Grid>
          </Grid>
        </FormSection>

        <FormSection title="NAT">
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <FormControlLabel control={<Switch checked={cfg.nat.enabled} onChange={(e) => updateConfig({ nat: { ...cfg.nat, enabled: e.target.checked } })} />} label="NAT Enabled" />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="NAT Type" value={cfg.nat.type} onChange={(e) => updateConfig({ nat: { ...cfg.nat, type: e.target.value } })} />
            </Grid>
          </Grid>
        </FormSection>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={actionLoading}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={actionLoading}>
          {actionLoading ? 'Saving...' : 'Save Configuration'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
