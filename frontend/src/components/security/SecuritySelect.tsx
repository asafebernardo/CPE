import { TextField, MenuItem, Box, Typography } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import type { SecurityLevel } from '@routergui/shared';
import { SecurityLevelChip } from './SecurityLevelChip';

export interface SecurityOption {
  id: string;
  label: string;
  level: SecurityLevel;
  category: string;
  legacyOnly?: boolean;
}

/**
 * Security selector with a level badge per option (Critical, Weak, Legacy, etc.).
 * Legacy-only options are disabled unless legacy compatibility is enabled.
 */
export function SecuritySelect({
  label,
  value,
  options,
  legacyEnabled = false,
  disabled = false,
  helperText,
  allowedIds,
  onChange,
}: {
  label: string;
  value: string;
  options: SecurityOption[];
  legacyEnabled?: boolean;
  disabled?: boolean;
  helperText?: string;
  /** When provided, options not in this list are disabled (profile gating). */
  allowedIds?: string[];
  onChange: (id: string) => void;
}) {
  const items = options.map((opt) => {
    const notAllowed = allowedIds ? !allowedIds.includes(opt.id) && opt.id !== value : false;
    const blocked = (Boolean(opt.legacyOnly) && !legacyEnabled && opt.id !== value) || notAllowed;
    return (
      <MenuItem key={opt.id} value={opt.id} disabled={blocked}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {blocked && <LockIcon sx={{ fontSize: '0.9rem', opacity: 0.6 }} />}
            <Typography variant="body2">{opt.label}</Typography>
          </Box>
          <SecurityLevelChip level={opt.level} />
        </Box>
      </MenuItem>
    );
  });

  return (
    <TextField
      select
      fullWidth
      label={label}
      value={value}
      disabled={disabled}
      helperText={helperText}
      onChange={(e) => onChange(e.target.value)}
      SelectProps={{
        renderValue: (selected) => {
          const opt = options.find((o) => o.id === selected);
          if (!opt) return String(selected);
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2">{opt.label}</Typography>
              <SecurityLevelChip level={opt.level} />
            </Box>
          );
        },
      }}
    >
      {items}
    </TextField>
  );
}
