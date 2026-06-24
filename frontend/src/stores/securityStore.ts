import { create } from 'zustand';
import type {
  SecuritySettingsDto,
  SecuritySettingsInput,
  SecurityScoreDto,
  CertificateType,
  PasswordHashAlgorithm,
  HashPreviewDto,
  SecurityProfile,
  AuditReportDto,
} from '@routergui/shared';
import api from '../services/api';

interface SecurityState {
  settings: SecuritySettingsDto | null;
  score: SecurityScoreDto | null;
  audit: AuditReportDto | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  fetchAll: () => Promise<void>;
  fetchScore: () => Promise<void>;
  fetchAudit: () => Promise<void>;
  saveSettings: (input: SecuritySettingsInput) => Promise<void>;
  setProfile: (profile: SecurityProfile) => Promise<void>;
  generateCertificate: (type: CertificateType) => Promise<void>;
  hashPreview: (algorithm: PasswordHashAlgorithm, input: string) => Promise<HashPreviewDto>;
  changePassword: (username: string, currentPassword: string, newPassword: string) => Promise<void>;
  /** Builds a full settings input from current settings, overriding given fields. */
  patchSettings: (patch: Partial<SecuritySettingsInput>) => Promise<void>;
}

export const useSecurityStore = create<SecurityState>((set, get) => ({
  settings: null,
  score: null,
  audit: null,
  loading: false,
  saving: false,
  error: null,

  fetchAll: async () => {
    set({ loading: true, error: null });
    try {
      const [settings, score] = await Promise.all([
        api.get<SecuritySettingsDto>('/security/settings'),
        api.get<SecurityScoreDto>('/security/score'),
      ]);
      set({ settings: settings.data, score: score.data, loading: false });
    } catch (e) {
      set({ loading: false, error: e instanceof Error ? e.message : 'Failed to load security data' });
    }
  },

  fetchScore: async () => {
    try {
      const res = await api.get<SecurityScoreDto>('/security/score');
      set({ score: res.data });
    } catch {
      /* ignore */
    }
  },

  fetchAudit: async () => {
    try {
      const res = await api.get<AuditReportDto>('/security/audit');
      set({ audit: res.data });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to load audit' });
    }
  },

  setProfile: async (profile) => {
    set({ saving: true, error: null });
    try {
      const res = await api.put<SecuritySettingsDto>('/security/profile', { profile });
      set({ settings: res.data, saving: false });
      await Promise.all([get().fetchScore(), get().fetchAudit()]);
    } catch (e) {
      set({ saving: false, error: e instanceof Error ? e.message : 'Failed to change profile' });
      throw e;
    }
  },

  patchSettings: async (patch) => {
    const s = get().settings;
    if (!s) return;
    await get().saveSettings({
      securityProfile: s.securityProfile,
      forcePasswordChange: s.forcePasswordChange,
      passwordHashAlgorithm: s.passwordHashAlgorithm,
      credentialEncryptionType: s.credentialEncryptionType,
      backupEncryptionType: s.backupEncryptionType,
      legacyCompatibility: s.legacyCompatibility,
      ...patch,
    });
  },

  changePassword: async (username, currentPassword, newPassword) => {
    await api.post('/auth/change-password', { username, currentPassword, newPassword });
    await get().fetchScore();
  },

  saveSettings: async (input) => {
    set({ saving: true, error: null });
    try {
      const res = await api.put<SecuritySettingsDto>('/security/settings', input);
      set({ settings: res.data, saving: false });
      await get().fetchScore();
    } catch (e) {
      set({ saving: false, error: e instanceof Error ? e.message : 'Failed to save settings' });
      throw e;
    }
  },

  generateCertificate: async (type) => {
    set({ saving: true, error: null });
    try {
      const res = await api.post<SecuritySettingsDto>('/security/certificate', { type });
      set({ settings: res.data, saving: false });
      await get().fetchScore();
    } catch (e) {
      set({ saving: false, error: e instanceof Error ? e.message : 'Failed to generate certificate' });
      throw e;
    }
  },

  hashPreview: async (algorithm, input) => {
    const res = await api.post<HashPreviewDto>('/security/hash-preview', { algorithm, input });
    return res.data;
  },
}));
