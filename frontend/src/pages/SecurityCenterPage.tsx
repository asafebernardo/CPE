import { useEffect, useState } from 'react';
import {
  Box, Grid, Card, CardContent, CardActionArea, Typography, Button, Alert, AlertTitle, LinearProgress,
  FormControlLabel, Switch, CircularProgress, Chip, TextField,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { PageHeader } from '../components/common/PageHeader';
import { FormSection } from '../components/common/FormSection';
import { SecuritySelect } from '../components/security/SecuritySelect';
import { SecurityLevelChip } from '../components/security/SecurityLevelChip';
import { PasswordStrengthMeter } from '../components/security/PasswordStrengthMeter';
import { PasswordField } from '../components/common/PasswordField';
import { useSecurityStore } from '../stores/securityStore';
import { useAuthStore } from '../stores/authStore';
import {
  PASSWORD_HASH_ALGORITHMS,
  CREDENTIAL_ENCRYPTION_TYPES,
  BACKUP_ENCRYPTION_TYPES,
  CERTIFICATE_TYPES,
  SECURITY_PROFILES,
  SCORE_CLASSIFICATION_COLORS,
  classifyScore,
  getPasswordHashAlgorithm,
  getCertificateType,
  validateAdminPasswordPolicy,
  type AuditStatus,
  type PasswordHashAlgorithm,
  type CredentialEncryptionType,
  type BackupEncryptionType,
  type CertificateType,
  type SecurityProfile,
} from '@routergui/shared';
import { acsColors } from '../theme/colors';

function ScoreCard({ title, score }: { title: string; score: number }) {
  const classification = classifyScore(score);
  const color = SCORE_CLASSIFICATION_COLORS[classification];
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>{title}</Typography>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mt: 0.5, mb: 1 }}>
          <Typography variant="h4" fontWeight={800} sx={{ color }}>{score}</Typography>
          <Typography variant="body2" color="text.secondary">/ 100</Typography>
        </Box>
        <LinearProgress variant="determinate" value={score} sx={{ height: 8, borderRadius: 4, bgcolor: `${color}22`, '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 4 } }} />
        <Chip size="small" label={classification} sx={{ mt: 1, height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: `${color}22`, color }} />
      </CardContent>
    </Card>
  );
}

const AUDIT_ICON: Record<AuditStatus, React.ReactNode> = {
  pass: <CheckCircleIcon sx={{ color: '#22c55e' }} />,
  warn: <WarningAmberIcon sx={{ color: '#eab308' }} />,
  fail: <ErrorIcon sx={{ color: '#ef4444' }} />,
};

export function SecurityCenterPage() {
  const { settings, score, audit, loading, saving, error, fetchAll, fetchAudit, saveSettings, setProfile, generateCertificate, changePassword } = useSecurityStore();
  const username = useAuthStore((s) => s.user?.username ?? 'admin');

  const [form, setForm] = useState<{
    passwordHashAlgorithm: PasswordHashAlgorithm;
    credentialEncryptionType: CredentialEncryptionType;
    backupEncryptionType: BackupEncryptionType;
    forcePasswordChange: boolean;
  } | null>(null);
  const [certType, setCertType] = useState<CertificateType>('rsa-2048');
  const [feedback, setFeedback] = useState('');
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwError, setPwError] = useState('');

  useEffect(() => { fetchAll(); fetchAudit(); }, [fetchAll, fetchAudit]);
  useEffect(() => {
    if (settings) {
      setForm({
        passwordHashAlgorithm: settings.passwordHashAlgorithm,
        credentialEncryptionType: settings.credentialEncryptionType,
        backupEncryptionType: settings.backupEncryptionType,
        forcePasswordChange: settings.forcePasswordChange,
      });
      setCertType(settings.certificate.type);
    }
  }, [settings]);

  if (loading && !settings) {
    return (
      <Box>
        <PageHeader title="Security Center" subtitle="Compliance profile, Wi-Fi, passwords, certificate and audit." />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, color: acsColors.textSecondary }}>
          <CircularProgress size={20} /> Loading security posture...
        </Box>
      </Box>
    );
  }

  if (!settings || !score || !form) {
    return (
      <Box>
        <PageHeader title="Security Center" subtitle="Compliance profile, Wi-Fi, passwords, certificate and audit." />
        <Alert severity="error">{error ?? 'Failed to load security data'}</Alert>
        <Button sx={{ mt: 2 }} onClick={fetchAll}>Retry</Button>
      </Box>
    );
  }

  const handleSaveSettings = async () => {
    await saveSettings({
      securityProfile: settings.securityProfile,
      forcePasswordChange: form.forcePasswordChange,
      passwordHashAlgorithm: form.passwordHashAlgorithm,
      credentialEncryptionType: form.credentialEncryptionType,
      backupEncryptionType: form.backupEncryptionType,
      legacyCompatibility: settings.legacyCompatibility,
    });
    setFeedback('Security settings saved');
    setTimeout(() => setFeedback(''), 3000);
  };

  const handleProfile = async (p: SecurityProfile) => {
    try {
      await setProfile(p);
      setFeedback(`Profile changed to ${p}`);
      setTimeout(() => setFeedback(''), 3000);
    } catch { /* surfaced via error */ }
  };

  const handleRegenCert = async () => {
    try {
      await generateCertificate(certType);
      setFeedback(`Certificate regenerated (${getCertificateType(certType)?.label})`);
      setTimeout(() => setFeedback(''), 3000);
    } catch { /* surfaced */ }
  };

  const handleChangePassword = async () => {
    setPwError('');
    if (pw.next !== pw.confirm) { setPwError('New passwords do not match'); return; }
    const policy = validateAdminPasswordPolicy(settings.securityProfile, pw.next);
    if (!policy.valid) { setPwError(policy.errors.join('. ')); return; }
    try {
      await changePassword(username, pw.current, pw.next);
      setPw({ current: '', next: '', confirm: '' });
      setFeedback('Admin password changed');
      setTimeout(() => setFeedback(''), 3000);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setPwError(msg ?? 'Failed to change password');
    }
  };

  const algoMeta = getPasswordHashAlgorithm(form.passwordHashAlgorithm);
  const cert = settings.certificate;
  const adminPolicy = pw.next ? validateAdminPasswordPolicy(settings.securityProfile, pw.next) : null;

  return (
    <Box>
      <PageHeader title="Security Center" subtitle="Compliance profile, Wi-Fi, passwords, certificate and configuration audit." />

      {settings.securityProfile === 'legacy' && (
        <Alert severity="warning" icon={<WarningAmberIcon />} sx={{ mb: 2 }}>
          <AlertTitle>Legacy compatibility enabled</AlertTitle>
          This configuration is insecure and should only be used for testing and TR-069 lab scenarios.
        </Alert>
      )}
      {feedback && <Alert severity="success" sx={{ mb: 2 }}>{feedback}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <FormSection title="Security Profile">
        <Grid container spacing={2}>
          {SECURITY_PROFILES.map((p) => {
            const active = settings.securityProfile === p.id;
            return (
              <Grid item xs={12} md={4} key={p.id}>
                <Card variant="outlined" sx={{ height: '100%', borderColor: active ? acsColors.accent : acsColors.border, borderWidth: active ? 2 : 1 }}>
                  <CardActionArea onClick={() => handleProfile(p.id)} disabled={saving} sx={{ height: '100%', p: 0.5 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="subtitle1" fontWeight={700}>{p.label}</Typography>
                        {active && <Chip size="small" label="Active" sx={{ height: 20, fontSize: '0.65rem', bgcolor: acsColors.accentSoftStrong, color: acsColors.accent, fontWeight: 700 }} />}
                      </Box>
                      <Typography variant="body2" color="text.secondary">{p.description}</Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </FormSection>

      <Grid container spacing={2} sx={{ mb: 1 }}>
        <Grid item xs={12} sm={6} md={2.4}><ScoreCard title="Wi-Fi Security" score={score.wifiScore} /></Grid>
        <Grid item xs={12} sm={6} md={2.4}><ScoreCard title="Admin Password" score={score.adminPasswordScore} /></Grid>
        <Grid item xs={12} sm={6} md={2.4}><ScoreCard title="TR-069 Security" score={score.tr069Score} /></Grid>
        <Grid item xs={12} sm={6} md={2.4}><ScoreCard title="Backup Security" score={score.backupScore} /></Grid>
        <Grid item xs={12} sm={6} md={2.4}><ScoreCard title="Overall Security" score={score.overallScore} /></Grid>
      </Grid>

      <FormSection title="Configuration Audit">
        {!audit ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: acsColors.textSecondary }}><CircularProgress size={16} /> Running audit...</Box>
        ) : (
          <>
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              <Chip label={`Passed: ${audit.passed}`} sx={{ bgcolor: '#22c55e22', color: '#22c55e', fontWeight: 700 }} />
              <Chip label={`Warnings: ${audit.warnings}`} sx={{ bgcolor: '#eab30822', color: '#eab308', fontWeight: 700 }} />
              <Chip label={`Failed: ${audit.failed}`} sx={{ bgcolor: '#ef444422', color: '#ef4444', fontWeight: 700 }} />
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {audit.checks.map((c) => (
                <Box key={c.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1, borderRadius: 1, border: `1px solid ${acsColors.border}` }}>
                  {AUDIT_ICON[c.status]}
                  <Box>
                    <Typography variant="body2" fontWeight={600}>{c.label}</Typography>
                    <Typography variant="caption" color="text.secondary">{c.detail}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </>
        )}
      </FormSection>

      {score.alerts.length > 0 && (
        <FormSection title="Security Alerts">
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {score.alerts.map((a) => (
              <Alert key={a.id} severity={a.severity === 'critical' ? 'error' : a.severity}>
                <AlertTitle sx={{ mb: 0 }}>{a.title}</AlertTitle>
                {a.detail}
              </Alert>
            ))}
          </Box>
        </FormSection>
      )}

      <FormSection title="Admin Password">
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}><PasswordField fullWidth label="Current Password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></Grid>
          <Grid item xs={12} md={4}>
            <PasswordField fullWidth label="New Password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })}
              error={Boolean(adminPolicy && !adminPolicy.valid)} />
            <PasswordStrengthMeter password={pw.next} />
          </Grid>
          <Grid item xs={12} md={4}><PasswordField fullWidth label="Confirm New Password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /></Grid>
        </Grid>
        {pwError && <Alert severity="error" sx={{ mt: 2 }}>{pwError}</Alert>}
        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Button variant="contained" onClick={handleChangePassword} disabled={!pw.current || !pw.next}>Change Password</Button>
          <FormControlLabel
            control={<Switch checked={form.forcePasswordChange} onChange={(e) => setForm({ ...form, forcePasswordChange: e.target.checked })} />}
            label="Force Password Change On First Login"
          />
        </Box>
      </FormSection>

      <FormSection title="Password & Credential Storage">
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <SecuritySelect label="Web Login Password Storage" value={form.passwordHashAlgorithm} legacyEnabled={settings.legacyCompatibility}
              options={PASSWORD_HASH_ALGORITHMS} onChange={(id) => setForm({ ...form, passwordHashAlgorithm: id as PasswordHashAlgorithm })}
              helperText={algoMeta ? `${algoMeta.description} · since ${algoMeta.year}` : undefined} />
          </Grid>
          <Grid item xs={12} md={4}>
            <SecuritySelect label="TR-069 Credential Storage" value={form.credentialEncryptionType} legacyEnabled={settings.legacyCompatibility}
              options={CREDENTIAL_ENCRYPTION_TYPES} onChange={(id) => setForm({ ...form, credentialEncryptionType: id as CredentialEncryptionType })} />
          </Grid>
          <Grid item xs={12} md={4}>
            <SecuritySelect label="Backup Encryption" value={form.backupEncryptionType} legacyEnabled={settings.legacyCompatibility}
              options={BACKUP_ENCRYPTION_TYPES} onChange={(id) => setForm({ ...form, backupEncryptionType: id as BackupEncryptionType })} />
          </Grid>
        </Grid>
        <Box sx={{ mt: 2 }}>
          <Button variant="contained" onClick={handleSaveSettings} disabled={saving}>Save Security Settings</Button>
        </Box>
      </FormSection>

      <FormSection title="HTTPS Certificate">
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="subtitle1" fontWeight={700}>{getCertificateType(cert.type)?.label ?? cert.type}</Typography>
                  {cert.expired
                    ? <Chip size="small" label="Expired" sx={{ height: 20, bgcolor: '#ef444422', color: '#ef4444', fontWeight: 700 }} />
                    : <SecurityLevelChip level={getCertificateType(cert.type)?.level ?? 'recommended'} />}
                </Box>
                <Row label="Algorithm" value={`${cert.algorithm} ${cert.bits}-bit`} />
                <Row label="Issuer" value={cert.issuer} />
                <Row label="Subject" value={cert.subject} />
                <Row label="Serial" value={cert.serialNumber} mono />
                <Row label="Valid From" value={new Date(cert.validFrom).toLocaleDateString()} />
                <Row label="Valid To" value={new Date(cert.validTo).toLocaleDateString()} />
                <Row label="SHA-256 Fingerprint" value={cert.fingerprintSha256} mono />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <SecuritySelect label="Certificate Type" value={certType} legacyEnabled={settings.legacyCompatibility} options={CERTIFICATE_TYPES} onChange={(id) => setCertType(id as CertificateType)} />
            <Button variant="outlined" sx={{ mt: 2 }} onClick={handleRegenCert} disabled={saving}>{saving ? 'Generating...' : 'Generate Certificate'}</Button>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Generates a real {getCertificateType(certType)?.algorithm} key pair and a new self-signed certificate.
            </Typography>
          </Grid>
        </Grid>
      </FormSection>
    </Box>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, py: 0.4 }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body2" sx={{ fontFamily: mono ? 'monospace' : undefined, fontSize: mono ? '0.72rem' : undefined, textAlign: 'right', wordBreak: 'break-all' }}>{value}</Typography>
    </Box>
  );
}
