import { useState } from 'react';
import { Box, Card, CardContent, Typography, Chip, Button, Grid, Alert, Collapse } from '@mui/material';
import type { OperationalDashboardResponse, WanDashboardDto } from '@aerobrry/shared';
import { SubTabs } from '../home/SubTabs';
import { InfoCard } from '../home/InfoCard';
import { Sparkline } from '../home/Sparkline';
import { QualityIndicator, rateQuality } from '../home/QualityIndicator';
import { formatBytes, formatUptime } from '../dashboardFormat';
import { acsColors } from '../../../theme/colors';

type InternetSubTab = 'status' | 'ipv4' | 'ipv6' | 'advanced';

const SUB_TABS = [
  { id: 'status' as const, label: 'Status' },
  { id: 'ipv4' as const, label: 'IPv4' },
  { id: 'ipv6' as const, label: 'IPv6' },
  { id: 'advanced' as const, label: 'Advanced' },
];

function TrafficCard({ label, value, color, seed }: { label: string; value: string; color: string; seed: number }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 1 } }}>
        <Typography variant="caption" sx={{ color: acsColors.textMuted, fontWeight: 600 }}>{label}</Typography>
        <Typography variant="h6" fontWeight={700} sx={{ color: acsColors.textPrimary, mb: 0.5 }}>{value}</Typography>
        <Sparkline seed={seed} color={color} height={36} />
      </CardContent>
    </Card>
  );
}

export function DashboardInternetView({
  data,
  wan,
}: {
  data: OperationalDashboardResponse;
  wan: WanDashboardDto | null;
}) {
  const [sub, setSub] = useState<InternetSubTab>('status');
  const [showTech, setShowTech] = useState(false);

  const online = data.internet.status === 'online';
  const config = wan?.config;
  const stats = wan?.statistics;
  const quality = wan?.quality;
  const rating = quality ? rateQuality(quality.latencyMs, quality.jitterMs, quality.packetLossPercent) : null;

  return (
    <Box>
      <SubTabs tabs={SUB_TABS} value={sub} onChange={setSub} />

      {sub === 'status' && (
        <Box>
          {/* Consolidated connection status */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: online ? acsColors.success : acsColors.error, boxShadow: `0 0 8px ${online ? acsColors.success : acsColors.error}` }} />
                <Typography variant="h6" fontWeight={700}>{online ? 'Connected' : 'Disconnected'}</Typography>
                <Chip size="small" label={config?.connectionType ?? data.wan.connectionType} sx={{ ml: 'auto', bgcolor: acsColors.accentSoft, color: acsColors.accent, fontWeight: 600 }} />
              </Box>
              <Grid container spacing={2}>
                {[
                  { label: 'WAN IP', value: config?.ipv4.ipAddress ?? data.wan.ipAddress },
                  { label: 'Gateway', value: config?.ipv4.gateway ?? data.wan.gateway },
                  { label: 'DNS', value: config?.dns.primary ?? '—' },
                  { label: 'Time Online', value: wan ? formatUptime(wan.status.uptimeSeconds) : formatUptime(data.system.uptime) },
                ].map((f) => (
                  <Grid item xs={6} md={3} key={f.label}>
                    <Typography variant="caption" sx={{ color: acsColors.textMuted }}>{f.label}</Typography>
                    <Typography variant="body1" fontWeight={600} sx={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>{f.value}</Typography>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>

          {/* Traffic */}
          {stats && (
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6} md={3}>
                <TrafficCard label="Download" value={formatBytes(stats.rxBytes)} color={acsColors.accent} seed={3} />
              </Grid>
              <Grid item xs={6} md={3}>
                <TrafficCard label="Upload" value={formatBytes(stats.txBytes)} color="#a78bfa" seed={7} />
              </Grid>
              <Grid item xs={6} md={3}>
                <TrafficCard label="Packets Received" value={stats.rxPackets.toLocaleString()} color={acsColors.success} seed={11} />
              </Grid>
              <Grid item xs={6} md={3}>
                <TrafficCard label="Packets Sent" value={stats.txPackets.toLocaleString()} color={acsColors.warning} seed={5} />
              </Grid>
            </Grid>
          )}

          {/* Connection quality */}
          {quality && rating && (
            <Card>
              <CardContent>
                <Typography variant="overline" sx={{ color: acsColors.textMuted, fontWeight: 700 }}>Connection Quality</Typography>
                <Box sx={{ mt: 1, mb: 2 }}>
                  <QualityIndicator rating={rating} />
                </Box>
                <Button size="small" variant="text" onClick={() => setShowTech((v) => !v)} sx={{ px: 0 }}>
                  {showTech ? 'Hide Technical Details' : 'Show Technical Details'}
                </Button>
                <Collapse in={showTech}>
                  <Grid container spacing={2} sx={{ mt: 0.5 }}>
                    <Grid item xs={4}><Typography variant="caption" sx={{ color: acsColors.textMuted }}>Latency</Typography><Typography fontWeight={600}>{quality.latencyMs} ms</Typography></Grid>
                    <Grid item xs={4}><Typography variant="caption" sx={{ color: acsColors.textMuted }}>Jitter</Typography><Typography fontWeight={600}>{quality.jitterMs} ms</Typography></Grid>
                    <Grid item xs={4}><Typography variant="caption" sx={{ color: acsColors.textMuted }}>Packet Loss</Typography><Typography fontWeight={600}>{quality.packetLossPercent}%</Typography></Grid>
                  </Grid>
                </Collapse>
              </CardContent>
            </Card>
          )}
        </Box>
      )}

      {sub === 'ipv4' && (
        <InfoCard
          title="IPv4 Configuration"
          rows={config ? [
            { label: 'IP Address', value: config.ipv4.ipAddress, mono: true },
            { label: 'Subnet Mask', value: config.ipv4.subnetMask, mono: true },
            { label: 'Gateway', value: config.ipv4.gateway, mono: true },
            { label: 'MTU', value: config.ipv4.mtu },
            { label: 'DNS Mode', value: config.dns.auto ? 'Automatic' : 'Manual' },
            { label: 'Primary DNS', value: config.dns.primary, mono: true },
            { label: 'Secondary DNS', value: config.dns.secondary || '—', mono: true },
          ] : [{ label: 'Status', value: 'Loading…' }]}
        />
      )}

      {sub === 'ipv6' && (
        <Box>
          <InfoCard
            title="IPv6 Configuration"
            rows={config ? [
              { label: 'IPv6', value: config.ipv6.enabled ? 'Enabled' : 'Disabled', tone: config.ipv6.enabled ? 'success' : 'warning' },
              { label: 'SLAAC', value: config.ipv6.slaac ? 'On' : 'Off' },
              { label: 'DHCPv6', value: config.ipv6.dhcpv6 ? 'On' : 'Off' },
              { label: 'Prefix Delegation', value: config.ipv6.prefixDelegation ? 'On' : 'Off' },
              { label: 'WAN Address', value: config.ipv6.wanAddress || '—', mono: true },
              { label: 'Gateway', value: config.ipv6.gateway || '—', mono: true },
              { label: 'DNS', value: config.ipv6.dns || '—', mono: true },
              { label: 'Prefix Length', value: `/${config.ipv6.prefixLength}` },
            ] : [{ label: 'Status', value: 'Loading…' }]}
          />
          <Alert severity="info" sx={{ mt: 2 }}>
            IPv6 dual-stack provisioning is being prepared for a future firmware release.
          </Alert>
        </Box>
      )}

      {sub === 'advanced' && (
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <InfoCard
              title="MTU & MAC"
              rows={config ? [
                { label: 'MTU', value: config.ipv4.mtu },
                { label: 'PPPoE MTU', value: config.pppoe.mtu },
                { label: 'MAC Clone', value: 'Disabled' },
              ] : [{ label: 'Status', value: 'Loading…' }]}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <InfoCard
              title="VLAN"
              rows={config ? [
                { label: 'VLAN', value: config.vlan.enabled ? 'Enabled' : 'Disabled', tone: config.vlan.enabled ? 'success' : 'warning' },
                { label: 'VLAN ID', value: config.vlan.vlanId },
                { label: 'Priority', value: config.vlan.priority },
                { label: 'Status', value: config.vlan.status },
              ] : [{ label: 'Status', value: 'Loading…' }]}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <InfoCard
              title="PPPoE"
              rows={config ? [
                { label: 'Username', value: config.pppoe.username || '—' },
                { label: 'Service Name', value: config.pppoe.serviceName || '—' },
                { label: 'AC Name', value: config.pppoe.acName || '—' },
                { label: 'Auth Status', value: config.pppoe.authStatus, tone: config.pppoe.connected ? 'success' : 'warning' },
                { label: 'Session Time', value: formatUptime(config.pppoe.sessionTimeSeconds) },
              ] : [{ label: 'Status', value: 'Loading…' }]}
            />
          </Grid>
        </Grid>
      )}

      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
        Read-only view. Use the Internet menu to change WAN settings.
      </Typography>
    </Box>
  );
}
