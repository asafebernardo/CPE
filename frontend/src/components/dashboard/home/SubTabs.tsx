import { Box, ButtonBase } from '@mui/material';
import { acsColors } from '../../../theme/colors';

export interface SubTabItem<T extends string> {
  id: T;
  label: string;
}

export function SubTabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: SubTabItem<T>[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <Box
      sx={{
        display: 'inline-flex',
        gap: 0.5,
        p: 0.5,
        mb: 2,
        borderRadius: 2,
        bgcolor: acsColors.bgInput,
        border: `1px solid ${acsColors.border}`,
        flexWrap: 'wrap',
      }}
    >
      {tabs.map((tab) => {
        const active = tab.id === value;
        return (
          <ButtonBase
            key={tab.id}
            onClick={() => onChange(tab.id)}
            sx={{
              px: 2,
              py: 0.75,
              borderRadius: 1.5,
              fontSize: '0.8125rem',
              fontWeight: active ? 700 : 500,
              color: active ? acsColors.bgPrimary : acsColors.textSecondary,
              bgcolor: active ? acsColors.accent : 'transparent',
              transition: 'all 0.15s',
              '&:hover': { bgcolor: active ? acsColors.accent : acsColors.accentSoft },
            }}
          >
            {tab.label}
          </ButtonBase>
        );
      })}
    </Box>
  );
}
