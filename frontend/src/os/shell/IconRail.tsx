import { Box, IconButton, Tooltip } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LanIcon from '@mui/icons-material/Lan';
import WifiIcon from '@mui/icons-material/Wifi';
import SecurityIcon from '@mui/icons-material/Security';
import TroubleshootIcon from '@mui/icons-material/Troubleshoot';
import SettingsIcon from '@mui/icons-material/Settings';
import { Link } from 'react-router-dom';
import type { MainSectionId } from '../../navigation/enterpriseNav';
import { useEnterpriseNav } from '../../hooks/useEnterpriseNav';
import { acsColors } from '../../theme/colors';

const SECTION_ICONS: Record<MainSectionId, typeof DashboardIcon> = {
  dashboard: DashboardIcon,
  network: LanIcon,
  wireless: WifiIcon,
  security: SecurityIcon,
  diagnostics: TroubleshootIcon,
  system: SettingsIcon,
};

export function IconRail({ horizontal = false }: { horizontal?: boolean }) {
  const { visibleSections, activeSectionId, defaultPathForSection } = useEnterpriseNav();

  return (
    <Box
      component="nav"
      sx={{
        width: horizontal ? '100%' : 'var(--rgos-rail-width)',
        flexShrink: 0,
        bgcolor: horizontal ? 'var(--rgos-layer-1)' : 'var(--rgos-layer-1)',
        borderRight: horizontal ? 'none' : `1px solid ${acsColors.border}`,
        display: 'flex',
        flexDirection: horizontal ? 'row' : 'column',
        alignItems: 'center',
        justifyContent: horizontal ? 'space-around' : 'flex-start',
        py: horizontal ? 0.25 : 0.75,
        gap: 0.25,
      }}
    >
      {visibleSections.map((section) => {
        const Icon = SECTION_ICONS[section.id];
        const active = activeSectionId === section.id;
        const path = defaultPathForSection(section.id);
        return (
          <Tooltip key={section.id} title={section.label} placement={horizontal ? 'top' : 'right'}>
            <IconButton
              component={Link}
              to={path}
              size="small"
              sx={{
                width: horizontal ? 40 : 34,
                height: horizontal ? 40 : 34,
                borderRadius: '8px',
                color: active ? acsColors.textPrimary : acsColors.textMuted,
                bgcolor: active ? 'var(--rgos-layer-3)' : 'transparent',
                border: active ? `1px solid ${acsColors.border}` : '1px solid transparent',
                '&:hover': {
                  bgcolor: 'var(--rgos-layer-2)',
                  color: acsColors.textPrimary,
                },
              }}
            >
              <Icon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        );
      })}
    </Box>
  );
}
