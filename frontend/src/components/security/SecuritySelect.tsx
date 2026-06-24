import { TextField, MenuItem, ListSubheader, Box, Typography } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import type { SecurityLevel, SecurityCategory } from '@routergui/shared';
import { SecurityLevelChip } from './SecurityLevelChip';

export interface SecurityOption {
  id: string;
  label: string;
  level: SecurityLevel;
  category: SecurityCategory;
  legacyOnly?: boolean;
}

const CATEGORY_ORDER: SecurityCategory[] = ['modern', 'recommended', 'legacy', 'obsolete'];
const CATEGORY_LABEL: Record<SecurityCategory, string> = {
  modern: 'Modern',
  recommended: 'Recommended',
  legacy: 'Legacy',
  obsolete: 'Obsolete',
};

/**
 * Grouped security selector (Modern / Recommended / Legacy / Obsolete) with a
 * security-level badge per option. Legacy-only options are disabled unless
 * legacy compatibility is enabled.
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
  const grouped = CATEGORY_ORDER.map((cat) => ({
    cat,
    items: options.filter((o) => o.category === cat),
  })).filter((g) => g.items.length > 0);

  const items: React.ReactNode[] = [];
  for (const group of grouped) {
    items.push(
      <ListSubheader key={`h-${group.cat}`} sx={{ bgcolor: 'transparent', fontWeight: 700, lineHeight: '2.2em' }}>
        {CATEGORY_LABEL[group.cat]}
      </ListSubheader>,
    );
    for (const opt of group.items) {
      const notAllowed = allowedIds ? !allowedIds.includes(opt.id) && opt.id !== value : false;
      const blocked = (Boolean(opt.legacyOnly) && !legacyEnabled && opt.id !== value) || notAllowed;
      items.push(
        <MenuItem key={opt.id} value={opt.id} disabled={blocked}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {blocked && <LockIcon sx={{ fontSize: '0.9rem', opacity: 0.6 }} />}
              <Typography variant="body2">{opt.label}</Typography>
            </Box>
            <SecurityLevelChip level={opt.level} />
          </Box>
        </MenuItem>,
      );
    }
  }

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
