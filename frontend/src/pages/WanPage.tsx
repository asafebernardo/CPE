import { useEffect, useState } from 'react';
import {
  Box, Grid, Alert, Button, CircularProgress,
} from '@mui/material';
import { PageHeader } from '../components/common/PageHeader';
import { FormSection } from '../components/common/FormSection';
import { ProfessionalTable } from '../components/common/ProfessionalTable';
import { WanStatusPanel } from '../components/wan/WanStatusPanel';
import { WanPhysicalLink } from '../components/wan/WanPhysicalLink';
import { WanStatsPanel } from '../components/wan/WanStatsPanel';
import { WanQualityPanel } from '../components/wan/WanQualityPanel';
import { WanAcsPanel } from '../components/wan/WanAcsPanel';
import { WanHistoryTimeline } from '../components/wan/WanHistoryTimeline';
import { WanQuickActions } from '../components/wan/WanQuickActions';
import { WanInterfacesPanel } from '../components/wan/WanInterfacesPanel';
import { SubTabs } from '../components/dashboard/home/SubTabs';
import { useWanStore } from '../stores/wanStore';
import { useUiStore } from '../stores/uiStore';
import { WAN_TABS } from '../navigation/wanTabs';
import type { WanDashboardDto } from '@routergui/shared';
import { acsColors } from '../theme/colors';

export function WanPage({ embedded = false }: { embedded?: boolean }) {
  const { data, loading, error, actionLoading, fetch, runAction } = useWanStore();
  const [local, setLocal] = useState<WanDashboardDto | null>(null);
  const tab = useUiStore((s) => s.wanTab);
  const setWanTab = useUiStore((s) => s.setWanTab);

  useEffect(() => { fetch(); }, [fetch]);
  useEffect(() => { if (data) setLocal(data); }, [data]);

  if (loading && !local) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, color: acsColors.textSecondary }}>
        <CircularProgress size={20} />
        Loading WAN dashboard...
      </Box>
    );
  }

  if (error && !local) {
    return (
      <Box>
        {!embedded && (
          <PageHeader title="WAN" subtitle="Wide area network management, monitoring and diagnostics." />
        )}
        <Alert severity="error">{error}</Alert>
        <Button sx={{ mt: 2 }} onClick={fetch}>Retry</Button>
      </Box>
    );
  }

  if (!local) return null;

  return (
    <Box>
      {!embedded && (
        <PageHeader title="WAN" subtitle="Professional WAN management — status, configuration, statistics and diagnostics." />
      )}
      <SubTabs tabs={WAN_TABS} value={tab} onChange={setWanTab} />
      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}

      {tab === 'overview' && (
        <>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} lg={8}><WanStatusPanel status={local.status} /></Grid>
            <Grid item xs={12} lg={4}><WanPhysicalLink link={local.physicalLink} /></Grid>
          </Grid>

          <FormSection title="Quick Actions">
            <WanQuickActions loading={actionLoading} onAction={runAction} />
          </FormSection>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} lg={8}><WanStatsPanel stats={local.statistics} /></Grid>
            <Grid item xs={12} lg={4}><WanQualityPanel quality={local.quality} /></Grid>
          </Grid>
        </>
      )}

      {tab === 'interfaces' && <WanInterfacesPanel />}

      {tab === 'routes' && (
        <>
          <FormSection title="Route Table">
            <ProfessionalTable
              columns={[
                { key: 'destination', label: 'Destination', sortable: true },
                { key: 'gateway', label: 'Gateway', sortable: true },
                { key: 'interface', label: 'Interface' },
                { key: 'metric', label: 'Metric', sortable: true },
              ]}
              rows={local.routes}
            />
          </FormSection>
          <WanAcsPanel acs={local.acs} />
        </>
      )}

      {tab === 'history' && (
        <FormSection title="WAN History">
          <WanHistoryTimeline events={local.history} />
        </FormSection>
      )}
    </Box>
  );
}
