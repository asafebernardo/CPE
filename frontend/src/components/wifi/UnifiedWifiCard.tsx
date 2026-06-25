import {
  Box, Grid, Card, CardContent, Typography, TextField, Button, Switch, FormControlLabel,
  Alert, MenuItem, Chip,
} from '@mui/material';
import { PasswordField } from '../common/PasswordField';
import { FormSection } from '../common/FormSection';
import { SecuritySelect } from '../security/SecuritySelect';
import { SecurityLevelChip } from '../security/SecurityLevelChip';
import { PasswordStrengthMeter } from '../security/PasswordStrengthMeter';
import { acsColors } from '../../theme/colors';
import {
  WIFI_SECURITY_MODES,
  validateWifiPassword,
  validateWifiPasswordPolicy,
  isWifiModeAllowed,
  getWifiSecurityMode,
  type BandSteeringConfigDto,
  type WifiSecurityMode,
} from '@routergui/shared';

export interface WlanBandForm {
  band: string;
  enabled: boolean;
  ssid: string;
  channel: number;
  channelWidth: string;
  security: string;
  password: string;
}

const CHANNEL_WIDTHS_24 = ['20MHz', '40MHz'];
const CHANNEL_WIDTHS_5 = ['20MHz', '40MHz', '80MHz', '160MHz'];

interface UnifiedWifiCardProps {
  wlan24: WlanBandForm;
  wlan5: WlanBandForm;
  steering: BandSteeringConfigDto;
  clients24: number;
  clients5: number;
  legacyEnabled: boolean;
  profileLabel: string;
  allowedModeIds: string[];
  profile: string;
  onUpdateBand: (band: string, patch: Partial<WlanBandForm>) => void;
  onUpdateShared: (patch: Pick<WlanBandForm, 'ssid' | 'security' | 'password'>) => void;
  onUpdateSteering: (patch: Partial<BandSteeringConfigDto>) => void;
  onSave: () => void;
}

export function UnifiedWifiCard({
  wlan24,
  wlan5,
  steering,
  clients24,
  clients5,
  legacyEnabled,
  profileLabel,
  allowedModeIds,
  profile,
  onUpdateBand,
  onUpdateShared,
  onUpdateSteering,
  onSave,
}: UnifiedWifiCardProps) {
  const mode = getWifiSecurityMode(wlan24.security);
  const requiresKey = mode ? !['none', 'enterprise'].includes(mode.keyRule) : true;
  const pwCheck = validateWifiPassword(wlan24.security, wlan24.password);
  const policy = requiresKey ? validateWifiPasswordPolicy(profile, wlan24.password) : { valid: true, errors: [] };
  const modeBlocked = !isWifiModeAllowed(profile, wlan24.security as WifiSecurityMode);
  const pwInvalid = requiresKey && wlan24.password.length > 0 && (!pwCheck.valid || !policy.valid);

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Typography variant="subtitle1" fontWeight={700}>Unified Wi-Fi</Typography>
          <Chip
            size="small"
            label="Band Steering"
            sx={{ height: 22, fontSize: '0.7rem', bgcolor: acsColors.accentSoft, color: acsColors.accent, fontWeight: 600 }}
          />
          <Chip
            size="small"
            label="On"
            sx={{
              height: 22,
              fontSize: '0.7rem',
              bgcolor: acsColors.successSoft,
              color: acsColors.success,
              fontWeight: 600,
            }}
          />
          {mode && <SecurityLevelChip level={mode.level} />}
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Single SSID and security for both bands. Both radios stay enabled while band steering is active.
        </Typography>

        {modeBlocked && (
          <Alert severity="error" sx={{ mb: 2 }}>{mode?.label ?? wlan24.security} is not permitted under the {profileLabel} profile.</Alert>
        )}
        {!modeBlocked && mode && (mode.level === 'critical' || mode.level === 'weak') && (
          <Alert severity="warning" sx={{ mb: 2 }}>Warning: This configuration does not meet modern security recommendations.</Alert>
        )}

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Network Name (SSID)"
              value={wlan24.ssid}
              onChange={(e) => onUpdateShared({ ssid: e.target.value, security: wlan24.security, password: wlan24.password })}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormSection title="2.4 GHz Radio">
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Channel"
                    type="number"
                    value={wlan24.channel}
                    onChange={(e) => onUpdateBand('2.4', { channel: parseInt(e.target.value) || 1 })}
                    helperText="Applies to all network interfaces on 2.4 GHz"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    select
                    fullWidth
                    label="Channel Width"
                    value={wlan24.channelWidth}
                    onChange={(e) => onUpdateBand('2.4', { channelWidth: e.target.value })}
                    helperText="Applies to all network interfaces on 2.4 GHz"
                  >
                    {CHANNEL_WIDTHS_24.map((w) => <MenuItem key={w} value={w}>{w}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="RSSI Threshold 2.4 GHz (dBm)"
                    type="number"
                    value={steering.rssiThreshold24}
                    onChange={(e) => onUpdateSteering({ rssiThreshold24: parseInt(e.target.value) })}
                    helperText="Steer clients below this signal level"
                  />
                </Grid>
              </Grid>
            </FormSection>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormSection title="5 GHz Radio">
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Channel"
                    type="number"
                    value={wlan5.channel}
                    onChange={(e) => onUpdateBand('5', { channel: parseInt(e.target.value) || 36 })}
                    helperText="Applies to all network interfaces on 5 GHz"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    select
                    fullWidth
                    label="Channel Width"
                    value={wlan5.channelWidth}
                    onChange={(e) => onUpdateBand('5', { channelWidth: e.target.value })}
                    helperText="Applies to all network interfaces on 5 GHz"
                  >
                    {CHANNEL_WIDTHS_5.map((w) => <MenuItem key={w} value={w}>{w}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="RSSI Threshold 5 GHz (dBm)"
                    type="number"
                    value={steering.rssiThreshold5}
                    onChange={(e) => onUpdateSteering({ rssiThreshold5: parseInt(e.target.value) })}
                    helperText="Steer clients below this signal level"
                  />
                </Grid>
              </Grid>
            </FormSection>
          </Grid>

          <Grid item xs={12} md={6}>
            <SecuritySelect
              label="Security Mode"
              value={wlan24.security}
              legacyEnabled={legacyEnabled}
              options={WIFI_SECURITY_MODES}
              allowedIds={allowedModeIds}
              onChange={(id) => onUpdateShared({ ssid: wlan24.ssid, security: id, password: wlan24.password })}
              helperText={mode?.encryption}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <PasswordField
              fullWidth
              label="Password"
              value={wlan24.password}
              disabled={!requiresKey}
              error={pwInvalid}
              helperText={requiresKey ? (!pwCheck.valid ? pwCheck.message : policy.errors[0] ?? 'Passphrase meets policy') : 'No PSK required for this mode'}
              onChange={(e) => onUpdateShared({ ssid: wlan24.ssid, security: wlan24.security, password: e.target.value })}
            />
            {requiresKey && wlan24.password.length > 0 && <PasswordStrengthMeter password={wlan24.password} showFeedback={false} />}
          </Grid>

          <Grid item xs={12}>
            <FormControlLabel
              control={<Switch checked={steering.prefer5G} onChange={(e) => onUpdateSteering({ prefer5G: e.target.checked })} />}
              label="Prefer 5 GHz"
            />
            <FormControlLabel
              control={<Switch checked={steering.clientSteering} onChange={(e) => onUpdateSteering({ clientSteering: e.target.checked })} />}
              label="Client Steering"
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">
              Connected clients: <strong style={{ color: acsColors.accent }}>{clients24}</strong> on 2.4 GHz ·{' '}
              <strong style={{ color: acsColors.accent }}>{clients5}</strong> on 5 GHz
            </Typography>
          </Grid>
        </Grid>

        <Button variant="contained" sx={{ mt: 2 }} onClick={onSave}>Save Wi-Fi Settings</Button>
      </CardContent>
    </Card>
  );
}
