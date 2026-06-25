import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Box, Grid, Alert, TextField, Button, Switch, FormControlLabel } from '@mui/material';
import api from '../services/api';
import { PageHeader } from '../components/common/PageHeader';
import { FormSection } from '../components/common/FormSection';
import { WirelessNetworksPanel } from '../components/wifi/WirelessNetworksPanel';
import { useAuthStore } from '../stores/authStore';
import { useUiStore } from '../stores/uiStore';
import { WIRELESS_TABS, parseWirelessPath } from '../navigation/wirelessTabs';
import { type BandSteeringConfigDto } from '@aerobrry/shared';
import { useCapabilitiesStore } from '../os/capabilities/capabilitiesStore';

export function WirelessPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const role = useAuthStore((s) => s.user?.role ?? 'USER');
  const canAccess = useUiStore((s) => s.canAccess);

  const { tab } = parseWirelessPath(location.pathname);

  const hasMesh = useCapabilitiesStore((s) => s.hasCapability('mesh'));

  const visibleTabs = WIRELESS_TABS.filter((t) => {
    if (t.id === 'mesh' && !hasMesh) return false;
    return canAccess(t.minRole, false, role);
  });
  const activeTabConfig = WIRELESS_TABS.find((t) => t.id === tab) ?? visibleTabs[0];
  const allowedTab = visibleTabs.some((t) => t.id === tab);
  const fallbackPath = visibleTabs[0]?.path ?? '/';

  const [clients24, setClients24] = useState(0);
  const [clients5, setClients5] = useState(0);
  const [steering, setSteering] = useState<BandSteeringConfigDto>({
    enabled: true,
    rssiThreshold24: -70,
    rssiThreshold5: -65,
    prefer5G: true,
    clientSteering: true,
  });
  const [steeringSaved, setSteeringSaved] = useState(false);

  useEffect(() => {
    if (!allowedTab && visibleTabs.length > 0) {
      navigate(fallbackPath, { replace: true });
    }
  }, [allowedTab, fallbackPath, navigate, visibleTabs.length]);

  useEffect(() => {
    api.get('/operational/dashboard').then((res) => {
      setClients24(res.data.wifi.clients24);
      setClients5(res.data.wifi.clients5);
    });
    api.get('/wifi/band-steering').then((res) => {
      const data = res.data as BandSteeringConfigDto & { rssiThreshold?: number };
      setSteering({
        enabled: data.enabled,
        rssiThreshold24: data.rssiThreshold24 ?? data.rssiThreshold ?? -70,
        rssiThreshold5: data.rssiThreshold5 ?? data.rssiThreshold ?? -65,
        prefer5G: data.prefer5G,
        clientSteering: data.clientSteering,
      });
    });
  }, []);

  const saveSteering = async () => {
    await api.put('/wifi/band-steering', steering);
    setSteeringSaved(true);
    setTimeout(() => setSteeringSaved(false), 3000);
  };

  if (location.pathname === '/wifi') {
    return <Navigate to="/wifi/networks" replace />;
  }

  if (!allowedTab) {
    return <Navigate to={fallbackPath} replace />;
  }

  return (
    <Box className="rgos-section-wireless">
      <PageHeader
        title={activeTabConfig?.title ?? 'Wireless'}
        subtitle={activeTabConfig?.description ?? 'Wireless configuration and monitoring.'}
      />

      {tab === 'networks' && (
        <WirelessNetworksPanel
          scope="home"
          steering={steering}
          clients24={clients24}
          clients5={clients5}
          onSteeringChange={(patch) => setSteering((s) => ({ ...s, ...patch }))}
          onSteeringSave={saveSteering}
        />
      )}

      {tab === 'band-steering' && (
        <>
          {steeringSaved && <Alert severity="success" sx={{ mb: 2 }}>Band steering saved</Alert>}
          <FormSection title="Band Steering Policy">
            <Alert severity="info" sx={{ mb: 2 }}>
              Only Primary/Home SSIDs participate in Band Steering. Guest and Mesh interfaces are automatically excluded.
            </Alert>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={<Switch checked={steering.enabled} onChange={(e) => setSteering({ ...steering, enabled: e.target.checked })} />}
                  label="Enable Band Steering"
                />
              </Grid>
              {!steering.enabled && (
                <>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="RSSI Threshold 2.4 GHz (dBm)"
                      type="number"
                      value={steering.rssiThreshold24}
                      onChange={(e) => setSteering({ ...steering, rssiThreshold24: parseInt(e.target.value) })}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="RSSI Threshold 5 GHz (dBm)"
                      type="number"
                      value={steering.rssiThreshold5}
                      onChange={(e) => setSteering({ ...steering, rssiThreshold5: parseInt(e.target.value) })}
                    />
                  </Grid>
                </>
              )}
              <Grid item xs={12}>
                <FormControlLabel control={<Switch checked={steering.prefer5G} onChange={(e) => setSteering({ ...steering, prefer5G: e.target.checked })} />} label="Prefer 5 GHz" />
                <FormControlLabel control={<Switch checked={steering.clientSteering} onChange={(e) => setSteering({ ...steering, clientSteering: e.target.checked })} />} label="Client Steering" />
              </Grid>
            </Grid>
            <Button variant="contained" sx={{ mt: 2 }} onClick={saveSteering}>Save</Button>
          </FormSection>
        </>
      )}

      {tab === 'guest' && <WirelessNetworksPanel scope="guest" />}

      {tab === 'mesh' && <WirelessNetworksPanel scope="mesh" />}
    </Box>
  );
}
